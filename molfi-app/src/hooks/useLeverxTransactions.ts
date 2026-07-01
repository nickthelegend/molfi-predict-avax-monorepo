import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useWallet } from "@/context/WalletContext";
import { useIndexerProtocol } from "@/hooks/useIndexer";
import { appConfig } from "@/lib/config";
import { invalidateLeverxQueries } from "@/lib/leverx/invalidate-queries";
import {
  beginSuccessSoundAction,
  cancelSuccessSoundAction,
  endSuccessSoundAction,
} from "@/lib/sounds";
import type { LimitMintOrder, LeveragedPosition } from "@/lib/leverx/indexer-client";
import type { MarketKeyArgs } from "@/lib/leverx/market-keys";
import {
  fetchPackageIdsForProtocol,
  fetchRegistryFields,
} from "@/lib/leverx/package-resolution";
import { resolveLeverxProtocol } from "@/lib/leverx/protocol";
import {
  executeCancelLimitOrder,
  executeClearTriggers,
  executeSetTriggers,
  type SetTriggersInput,
  executeClosePosition,
  executeCreateMarginAccount,
  executeOpenTrade,
  executeRegisterExecutor,
  executeRepayDebt,
  executeRevokeExecutor,
  executeSettleExpired,
  executeRecoverStrandedCustody,
  type RecoverStrandedCustodyInput,
  executeVaultSupply,
  executeVaultWithdraw,
  executeWithdrawQuote,
  executeDepositQuote,
  type ClosePositionInput,
  type OpenTradeInput,
  type WithdrawQuoteInput,
  type DepositQuoteInput,
} from "@/lib/leverx/transactions";
import { formatTxError } from "@/lib/leverx/tx-errors";
import { suiClient } from "@/lib/sui/client";

const leverxPackageKeys = {
  ids: (registryId: string, predictId: string) =>
    ["leverx-package-ids", registryId, predictId] as const,
};

export function useLeverxProtocolConfig() {
  const { data: settings, isLoading: settingsLoading } = useIndexerProtocol();

  const registryId = settings?.registry_id?.trim() || appConfig.leverxRegistryId;
  const predictId = settings?.predict_id?.trim() || appConfig.predictId;

  const {
    data: packageIds,
    isLoading: packagesLoading,
    isError: packagesError,
  } = useQuery({
    queryKey: leverxPackageKeys.ids(registryId, predictId),
    queryFn: () =>
      fetchPackageIdsForProtocol(suiClient, {
        registryId,
        predictId,
      }),
    enabled: Boolean(registryId),
    staleTime: 10 * 60_000,
    retry: 2,
  });

  const { data: registryFields } = useQuery({
    queryKey: ["leverx-registry-fields", registryId] as const,
    queryFn: () => fetchRegistryFields(suiClient, registryId),
    enabled: Boolean(registryId),
    staleTime: 10 * 60_000,
    retry: 2,
  });

  const cfg = useMemo(() => {
    const hasResolvedPackages = Boolean(
      packageIds?.leverxPackageId || settings?.package_id?.trim(),
    );
    if (registryId && packagesLoading && !hasResolvedPackages) {
      return null;
    }

    const base = resolveLeverxProtocol(settings ?? null, {
      packageId: packageIds?.leverxPackageId ?? settings?.package_id,
      predictPackageId: packageIds?.predictPackageId ?? settings?.predict_package_id,
      allowEnvPackageFallback: !registryId || packagesError,
    });
    if (!base) return null;

    return {
      ...base,
      predictId: registryFields?.predictId || base.predictId,
      vaultId: registryFields?.vaultId || base.vaultId,
      feeCollectorId: registryFields?.feeCollectorId || base.feeCollectorId,
    };
  }, [settings, packageIds, packagesLoading, packagesError, registryId, registryFields]);

  const isResolving = settingsLoading || (Boolean(registryId) && packagesLoading);

  return { cfg, isResolving };
}

export function useLeverxTransactions() {
  const queryClient = useQueryClient();
  const { client, wallet, account } = useWallet();
  const { cfg, isResolving } = useLeverxProtocolConfig();
  const { data: protocol } = useIndexerProtocol();

  const invalidate = () => void invalidateLeverxQueries(queryClient);

  const requireReady = () => {
    if (!wallet || !account) {
      throw new Error("Sign in to continue.");
    }
    if (!cfg) {
      throw new Error(
        "Trading isn't fully set up yet. Check back once markets are live.",
      );
    }
    return { wallet, account, cfg };
  };

  const openTrade = useMutation({
    mutationFn: async (input: OpenTradeInput) => {
      if (protocol?.trading_paused) {
        throw new Error("trading_paused");
      }
      const ready = requireReady();
      return executeOpenTrade({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        input,
      });
    },
    onMutate: (input) => {
      const positionMinted =
        input.orderType === "market" || input.limitExecution === "immediate";
      if (positionMinted) beginSuccessSoundAction();
    },
    onSuccess: (_data, input) => {
      const positionMinted =
        input.orderType === "market" || input.limitExecution === "immediate";
      if (positionMinted) endSuccessSoundAction();
      invalidate();
    },
    onError: (_error, input) => {
      const positionMinted =
        input.orderType === "market" || input.limitExecution === "immediate";
      if (positionMinted) cancelSuccessSoundAction();
    },
  });

  const createMarginAccount = useMutation({
    mutationFn: async () => {
      const ready = requireReady();
      return executeCreateMarginAccount({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
      });
    },
    onSuccess: () => invalidate(),
  });

  const closePosition = useMutation({
    mutationFn: async (input: ClosePositionInput) => {
      const ready = requireReady();
      return executeClosePosition({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        input,
      });
    },
    onMutate: () => beginSuccessSoundAction(),
    onSuccess: () => {
      endSuccessSoundAction();
      invalidate();
    },
    onError: () => cancelSuccessSoundAction(),
  });

  const settleExpired = useMutation({
    mutationFn: async (position: LeveragedPosition) => {
      const ready = requireReady();
      return executeSettleExpired({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        position,
      });
    },
    onMutate: () => beginSuccessSoundAction(),
    onSuccess: () => {
      endSuccessSoundAction();
      invalidate();
    },
    onError: () => cancelSuccessSoundAction(),
  });

  const recoverStrandedCustody = useMutation({
    mutationFn: async (input: RecoverStrandedCustodyInput) => {
      const ready = requireReady();
      return executeRecoverStrandedCustody({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        input,
      });
    },
    onMutate: () => beginSuccessSoundAction(),
    onSuccess: () => {
      endSuccessSoundAction();
      invalidate();
    },
    onError: () => cancelSuccessSoundAction(),
  });

  const repayDebt = useMutation({
    mutationFn: async (args: { position: LeveragedPosition; amountAtoms: bigint }) => {
      const ready = requireReady();
      return executeRepayDebt({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        position: args.position,
        amountAtoms: args.amountAtoms,
      });
    },
    onSuccess: () => invalidate(),
  });

  const setTriggers = useMutation({
    mutationFn: async (input: SetTriggersInput) => {
      const ready = requireReady();
      return executeSetTriggers({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        input,
      });
    },
    onSuccess: () => invalidate(),
  });

  const clearTriggers = useMutation({
    mutationFn: async (args: { accountId: string; key: MarketKeyArgs }) => {
      const ready = requireReady();
      return executeClearTriggers({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        accountId: args.accountId,
        key: args.key,
      });
    },
    onSuccess: () => invalidate(),
  });

  const registerExecutor = useMutation({
    mutationFn: async (args: { accountId: string; executor: string }) => {
      const ready = requireReady();
      return executeRegisterExecutor({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        accountId: args.accountId,
        executor: args.executor,
      });
    },
    onSuccess: () => invalidate(),
  });

  const revokeExecutor = useMutation({
    mutationFn: async (args: { accountId: string; executor: string }) => {
      const ready = requireReady();
      return executeRevokeExecutor({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        accountId: args.accountId,
        executor: args.executor,
      });
    },
    onSuccess: () => invalidate(),
  });

  const cancelLimitOrder = useMutation({
    mutationFn: async (order: LimitMintOrder) => {
      const ready = requireReady();
      return executeCancelLimitOrder({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        order,
      });
    },
    onSuccess: () => invalidate(),
  });

  const vaultSupply = useMutation({
    mutationFn: async (amountAtoms: bigint) => {
      const ready = requireReady();
      return executeVaultSupply({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        amountAtoms,
      });
    },
    onMutate: () => beginSuccessSoundAction(),
    onSuccess: () => {
      endSuccessSoundAction();
      invalidate();
    },
    onError: () => cancelSuccessSoundAction(),
  });

  const vaultWithdraw = useMutation({
    mutationFn: async (lpAmountAtoms: bigint) => {
      const ready = requireReady();
      return executeVaultWithdraw({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        lpAmountAtoms,
      });
    },
    onMutate: () => beginSuccessSoundAction(),
    onSuccess: () => {
      endSuccessSoundAction();
      invalidate();
    },
    onError: () => cancelSuccessSoundAction(),
  });

  const withdrawQuote = useMutation({
    mutationFn: async (input: WithdrawQuoteInput) => {
      const ready = requireReady();
      return executeWithdrawQuote({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        input,
      });
    },
    onMutate: () => beginSuccessSoundAction(),
    onSuccess: () => {
      endSuccessSoundAction();
      invalidate();
    },
    onError: () => cancelSuccessSoundAction(),
  });

  const depositQuote = useMutation({
    mutationFn: async (input: DepositQuoteInput) => {
      const ready = requireReady();
      return executeDepositQuote({
        client,
        wallet: ready.wallet,
        account: ready.account,
        cfg: ready.cfg,
        input,
      });
    },
    onMutate: () => beginSuccessSoundAction(),
    onSuccess: () => {
      endSuccessSoundAction();
      invalidate();
    },
    onError: () => cancelSuccessSoundAction(),
  });

  return {
    cfg,
    isProtocolReady: Boolean(cfg) && !isResolving,
    openTrade,
    createMarginAccount,
    closePosition,
    settleExpired,
    recoverStrandedCustody,
    repayDebt,
    setTriggers,
    clearTriggers,
    registerExecutor,
    revokeExecutor,
    cancelLimitOrder,
    vaultSupply,
    vaultWithdraw,
    withdrawQuote,
    depositQuote,
    formatTxError,
  };
}
