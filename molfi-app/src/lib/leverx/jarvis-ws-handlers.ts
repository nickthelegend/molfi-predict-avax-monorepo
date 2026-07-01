import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import {
  JarvisEventRecordSchema,
  JarvisStatusResponseSchema,
  JarvisUnreadPayloadSchema,
  type JarvisEventRecord,
} from "@/lib/leverx/jarvis-schemas";
import { jarvisEventsQueryKey } from "@/lib/leverx/jarvis-query-keys";
import { invalidatePortfolioQueries } from "@/lib/leverx/invalidate-queries";

export type JarvisConnectionState = "connected" | "connecting" | "disconnected";

function jarvisStatusKey(owner: string, accountId: string) {
  return ["jarvis-status", owner, accountId] as const;
}

function prependLiveEvent(
  prev: InfiniteData<JarvisEventRecord[]> | undefined,
  record: JarvisEventRecord,
): InfiniteData<JarvisEventRecord[]> {
  if (!prev?.pages?.length) {
    return { pages: [[record]], pageParams: [undefined] };
  }

  const firstPage = prev.pages[0] ?? [];
  if (firstPage.some((row) => row.id === record.id)) return prev;

  return {
    ...prev,
    pages: [
      [record, ...firstPage].sort(
        (a, b) => Number(b.created_at_ms) - Number(a.created_at_ms),
      ),
      ...prev.pages.slice(1),
    ],
  };
}

const PORTFOLIO_EVENT_TYPES = new Set([
  "opening_position",
  "closing_position",
  "repaying_debt",
  "cycle_complete",
]);

export function handleJarvisEvent(
  queryClient: QueryClient,
  owner: string,
  accountId: string,
  payload: unknown,
): void {
  const parsed = JarvisEventRecordSchema.safeParse(payload);
  if (!parsed.success) return;

  const record = parsed.data;
  const eventsKey = jarvisEventsQueryKey(owner, accountId);
  queryClient.setQueryData<InfiniteData<JarvisEventRecord[]>>(
    eventsKey,
    (prev) => prependLiveEvent(prev, record),
  );
  void queryClient.invalidateQueries({
    queryKey: jarvisStatusKey(owner, accountId),
  });
  if (PORTFOLIO_EVENT_TYPES.has(record.event_type)) {
    void invalidatePortfolioQueries(queryClient);
  }
}

export function handleJarvisUnread(
  queryClient: QueryClient,
  owner: string,
  accountId: string,
  payload: unknown,
): void {
  const parsed = JarvisUnreadPayloadSchema.safeParse(payload);
  if (!parsed.success) return;

  queryClient.setQueryData(
    jarvisStatusKey(owner, accountId),
    (prev: unknown) => {
      const status = JarvisStatusResponseSchema.safeParse(prev);
      if (!status.success) return prev;
      return {
        ...status.data,
        unread_count: parsed.data.unread_count,
      };
    },
  );
}
