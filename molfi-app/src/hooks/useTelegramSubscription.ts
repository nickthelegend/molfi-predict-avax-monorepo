import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appConfig } from "@/lib/config";
import {
  createTelegramLinkToken,
  fetchTelegramSubscription,
} from "@/lib/leverx/keeper-client";

export function telegramSubscriptionQueryKey(owner: string, accountId: string) {
  return ["telegram-subscription", owner, accountId] as const;
}

export function useTelegramSubscription(owner: string | null, accountId: string | null) {
  const enabled = Boolean(owner && accountId);
  return useQuery({
    queryKey: enabled
      ? telegramSubscriptionQueryKey(owner!, accountId!)
      : ["telegram-subscription", "idle"],
    queryFn: () =>
      fetchTelegramSubscription({ owner: owner!, accountId: accountId! }),
    enabled,
    staleTime: 30_000,
    refetchInterval: 15_000,
  });
}

export function useConnectTelegram(owner: string | null, accountId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!owner || !accountId) {
        throw new Error("account_required");
      }
      return createTelegramLinkToken({ owner, accountId });
    },
    onSuccess: (link) => {
      window.open(link.deep_link, "_blank", "noopener,noreferrer");
      if (owner && accountId) {
        void queryClient.invalidateQueries({
          queryKey: telegramSubscriptionQueryKey(owner, accountId),
        });
      }
    },
  });
}

export function isTelegramConfigured(
  status: { enabled?: boolean; bot_username?: string | null } | undefined,
): boolean {
  if (status?.enabled) return true;
  return Boolean(appConfig.telegramBotUsername?.trim());
}
