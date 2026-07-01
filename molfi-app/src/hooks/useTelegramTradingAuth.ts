import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTelegramTradingOtp,
  fetchTelegramTradingSession,
  revokeTelegramTradingSession,
  type TelegramOtpResponse,
} from "@/lib/leverx/keeper-client";
import { telegramSubscriptionQueryKey } from "@/hooks/useTelegramSubscription";

export function telegramTradingSessionQueryKey(owner: string, accountId: string) {
  return ["telegram-trading-session", owner, accountId] as const;
}

export function useTelegramTradingSession(owner: string | null, accountId: string | null) {
  const enabled = Boolean(owner && accountId);
  return useQuery({
    queryKey: enabled
      ? telegramTradingSessionQueryKey(owner!, accountId!)
      : ["telegram-trading-session", "idle"],
    queryFn: () =>
      fetchTelegramTradingSession({ owner: owner!, accountId: accountId! }),
    enabled,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

export function useGenerateTelegramOtp(owner: string | null, accountId: string | null) {
  return useMutation({
    mutationFn: async (): Promise<TelegramOtpResponse> => {
      if (!owner || !accountId) {
        throw new Error("account_required");
      }
      return createTelegramTradingOtp({ owner, accountId });
    },
  });
}

export function useRevokeTelegramTradingSession(
  owner: string | null,
  accountId: string | null,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!owner || !accountId) {
        throw new Error("account_required");
      }
      return revokeTelegramTradingSession({ owner, accountId });
    },
    onSuccess: () => {
      if (owner && accountId) {
        void queryClient.invalidateQueries({
          queryKey: telegramTradingSessionQueryKey(owner, accountId),
        });
        void queryClient.invalidateQueries({
          queryKey: telegramSubscriptionQueryKey(owner, accountId),
        });
      }
    },
  });
}
