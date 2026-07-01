import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { WalletWithRequiredFeatures } from "@mysten/wallet-standard";
import type { WalletAccount } from "@wallet-standard/core";
import { fetchAccounts } from "@/lib/leverx/indexer-client";
import { ensureUserPredictManager } from "@/lib/leverx/keeper-client";
import { prepareManagerCreateRequest } from "@/lib/leverx/keeper-intent-request";
import { ONBOARD_GAS_BUDGET } from "@/lib/leverx/constants";
import {
  objectMatchesStructType,
  readProxyPredictManagerId,
} from "@/lib/leverx/package-resolution";
import type { LeverxOnboardingConfig } from "@/lib/leverx/protocol";
import { executeWalletTransaction } from "@/lib/sui/execute-transaction";

export type LeverxAccount = {
  accountId: string;
  predictManagerId: string | null;
};

export class LeverxOnboardingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeverxOnboardingError";
  }
}

async function findOwnedObjectId(
  client: SuiJsonRpcClient,
  owner: string,
  structType: string,
): Promise<string | null> {
  const page = await client.getOwnedObjects({
    owner,
    filter: { StructType: structType },
    options: { showContent: false },
  });
  return page.data[0]?.data?.objectId ?? null;
}

function extractCreatedId(
  objectChanges:
    | Array<{ type?: string; objectType?: string; objectId?: string }>
    | null
    | undefined,
  typeFragment: string,
): string | null {
  for (const change of objectChanges ?? []) {
    if (
      change.type === "created" &&
      change.objectType?.includes(typeFragment) &&
      change.objectId
    ) {
      return change.objectId;
    }
  }
  return null;
}

export async function resolveLeverxAccount(
  client: SuiJsonRpcClient,
  owner: string,
  cfg: LeverxOnboardingConfig,
): Promise<LeverxAccount | null> {
  try {
    const { items } = await fetchAccounts({ owner, limit: 5 });
    const row = items[0];
    if (row?.account_id) {
      const proxyType = `${cfg.packageId}::user_proxy::UserProxy`;
      const proxyMatches = await objectMatchesStructType(
        client,
        row.account_id,
        proxyType,
      );
      if (proxyMatches) {
        return {
          accountId: row.account_id,
          predictManagerId: row.predict_manager_id,
        };
      }
    }
  } catch {
    // Indexer may be offline — fall back to RPC.
  }

  const proxyId = await findOwnedObjectId(
    client,
    owner,
    `${cfg.packageId}::user_proxy::UserProxy`,
  );
  if (!proxyId) return null;

  const linkedManagerId = await readProxyPredictManagerId(client, proxyId);
  return {
    accountId: proxyId,
    predictManagerId: linkedManagerId,
  };
}

export async function ensureLeverxAccount(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxOnboardingConfig;
}): Promise<LeverxAccount> {
  const existing = await resolveLeverxAccount(
    params.client,
    params.account.address,
    params.cfg,
  );

  if (existing?.accountId && existing.predictManagerId) {
    // The keeper is seeded as the proxy's secondary owner at creation
    // (trade::create_user_proxy), so no executor registration is needed.
    return {
      accountId: existing.accountId,
      predictManagerId: existing.predictManagerId,
    };
  }

  if (existing?.accountId && !existing.predictManagerId) {
    throw new LeverxOnboardingError(
      "Trading account exists without a Predict manager. Contact support.",
    );
  }

  const managerAuth = await prepareManagerCreateRequest({
    wallet: params.wallet,
    account: params.account,
    address: params.account.address,
  });
  const predictManagerId = await ensureUserPredictManager(managerAuth);

  const { digest } = await executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    (tx) => {
      tx.moveCall({
        target: `${params.cfg.packageId}::trade::create_user_proxy`,
        arguments: [
          tx.object(params.cfg.registryId),
          tx.object(predictManagerId),
        ],
      });
    },
    { gasBudget: ONBOARD_GAS_BUDGET },
  );

  const tx = await params.client.waitForTransaction({
    digest,
    options: { showObjectChanges: true },
  });

  const accountId = extractCreatedId(tx.objectChanges, "user_proxy::UserProxy");
  if (!accountId) {
    throw new LeverxOnboardingError("UserProxy was not created.");
  }

  return {
    accountId,
    predictManagerId,
  };
}
