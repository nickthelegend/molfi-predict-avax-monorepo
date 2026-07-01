import { useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useIndexerAccounts, useIndexerPositions } from "@/hooks/useIndexer";
import { resolveTradingAccount } from "@/lib/leverx/account-resolution";
import { appConfig } from "@/lib/config";
import {
  disableJarvis,
  enableJarvis,
  fetchJarvisEvents,
  fetchJarvisSettings,
  fetchJarvisStatus,
  markJarvisEventsRead,
  updateJarvisSettings,
  type JarvisEventRecord,
  type JarvisGuardrails,
  type JarvisSettingsResponse,
  type JarvisStatusResponse,
  type JarvisUpdateSettingsBody,
} from "@/lib/leverx/keeper-client";
import {
  JARVIS_EVENTS_PAGE_SIZE,
  jarvisEventsQueryKey,
  jarvisSettingsQueryKey,
  jarvisStatusQueryKey,
} from "@/lib/leverx/jarvis-query-keys";
import { useJarvisStream } from "@/context/AppStreamContext";

export { useJarvisStream } from "@/context/AppStreamContext";

export { JARVIS_EVENTS_PAGE_SIZE, jarvisEventsQueryKey, jarvisSettingsQueryKey, jarvisStatusQueryKey };

export function isJarvisConfigured(): boolean {
  return Boolean(appConfig.keeperApiUrl?.trim());
}

export function useJarvisStatus(
  owner: string | null | undefined,
  accountId: string | null | undefined,
) {
  const enabled = Boolean(owner && accountId);
  return useQuery({
    queryKey: enabled
      ? jarvisStatusQueryKey(owner!, accountId!)
      : ["jarvis-status", "idle"],
    queryFn: () => fetchJarvisStatus({ owner: owner!, accountId: accountId! }),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useJarvisEvents(
  owner: string | null | undefined,
  accountId: string | null | undefined,
) {
  const enabled = Boolean(owner && accountId);
  return useInfiniteQuery({
    queryKey: enabled
      ? jarvisEventsQueryKey(owner!, accountId!)
      : ["jarvis-events", "idle"],
    queryFn: ({ pageParam }) =>
      fetchJarvisEvents({
        owner: owner!,
        accountId: accountId!,
        limit: JARVIS_EVENTS_PAGE_SIZE,
        beforeMs: pageParam,
      }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => {
      if (lastPage.length < JARVIS_EVENTS_PAGE_SIZE) return undefined;
      const oldest = lastPage[lastPage.length - 1];
      if (!oldest) return undefined;
      const ms = Number(oldest.created_at_ms);
      return Number.isFinite(ms) && ms > 0 ? ms : undefined;
    },
    enabled,
    staleTime: 10_000,
  });
}

export function useJarvisSettings(
  owner: string | null | undefined,
  accountId: string | null | undefined,
) {
  const enabled = Boolean(owner && accountId);
  return useQuery({
    queryKey: enabled
      ? jarvisSettingsQueryKey(owner!, accountId!)
      : ["jarvis-settings", "idle"],
    queryFn: () => fetchJarvisSettings({ owner: owner!, accountId: accountId! }),
    enabled,
    staleTime: 15_000,
  });
}

export function useUpdateJarvisSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: JarvisUpdateSettingsBody) => updateJarvisSettings(body),
    onSuccess: (settings, body) => {
      queryClient.setQueryData(
        jarvisSettingsQueryKey(body.owner, body.account_id),
        settings,
      );
      queryClient.setQueryData(
        jarvisStatusQueryKey(body.owner, body.account_id),
        (prev: JarvisStatusResponse | undefined) =>
          prev ? { ...prev, guardrails: settings.guardrails } : prev,
      );
    },
  });
}

export function useEnableJarvis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { owner: string; accountId: string }) =>
      enableJarvis(params),
    onSuccess: (status, params) => {
      queryClient.setQueryData(
        jarvisStatusQueryKey(params.owner, params.accountId),
        status,
      );
      void queryClient.invalidateQueries({
        queryKey: jarvisEventsQueryKey(params.owner, params.accountId),
      });
    },
  });
}

export function useDisableJarvis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { owner: string; accountId: string }) =>
      disableJarvis(params),
    onSuccess: (status, params) => {
      queryClient.setQueryData(
        jarvisStatusQueryKey(params.owner, params.accountId),
        status,
      );
      void queryClient.invalidateQueries({
        queryKey: jarvisEventsQueryKey(params.owner, params.accountId),
      });
    },
  });
}

export function useMarkJarvisRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      owner: string;
      accountId: string;
      eventIds?: string[];
    }) => markJarvisEventsRead(params),
    onSuccess: (_result, params) => {
      void queryClient.invalidateQueries({
        queryKey: jarvisStatusQueryKey(params.owner, params.accountId),
      });
      void queryClient.invalidateQueries({
        queryKey: jarvisEventsQueryKey(params.owner, params.accountId),
      });
    },
  });
}

/** Resolved wallet account + live unread count for chrome (header, bottom nav). */
export function useJarvisUnreadCount(): number {
  const { address } = useWallet();
  const { data: accounts = [] } = useIndexerAccounts(address ?? undefined);
  const { data: positions = [] } = useIndexerPositions(address ?? undefined);

  const account = useMemo(
    () => resolveTradingAccount(accounts, positions, address ?? ""),
    [accounts, positions, address],
  );

  const owner = address ?? null;
  const accountId = account?.account_id ?? null;

  const { data: jarvisStatus } = useJarvisStatus(owner, accountId);

  return jarvisStatus?.unread_count ?? 0;
}

/** Live Jarvis stream status — connection lifecycle is managed by AppStreamProvider. */
export function useJarvisLive() {
  return useJarvisStream();
}

export type {
  JarvisEventRecord,
  JarvisGuardrails,
  JarvisSettingsResponse,
  JarvisStatusResponse,
};
export type { JarvisConnectionState } from "@/context/AppStreamContext";
