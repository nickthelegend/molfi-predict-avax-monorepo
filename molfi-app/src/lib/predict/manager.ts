import { appConfig } from "@/lib/config";
import { fetchJson } from "@/lib/api/fetch-json";
import { executeWalletTransaction } from "@/lib/sui/execute-transaction";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { WalletWithRequiredFeatures } from "@mysten/wallet-standard";
import type { WalletAccount } from "@wallet-standard/core";

interface PredictManagerCreatedRow {
  manager_id: string;
  owner?: string;
}

export class PredictManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PredictManagerError";
  }
}

const base = () => appConfig.predictServerUrl.replace(/\/$/, "");

export async function fetchPredictManagerForOwner(owner: string): Promise<string | null> {
  if (!appConfig.usePredictServer) return null;
  try {
    const rows = await fetchJson<PredictManagerCreatedRow[]>(
      `${base()}/managers?owner=${encodeURIComponent(owner)}`,
    );
    return rows[0]?.manager_id ?? null;
  } catch {
    return null;
  }
}

async function createPredictManager(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
}): Promise<string> {
  const pkg = appConfig.predictPackageId;

  const { digest } = await executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    (tx) => {
      tx.moveCall({
        target: `${pkg}::predict::create_manager`,
        arguments: [],
      });
    },
    { gasBudget: 50_000_000 },
  );

  const tx = await params.client.waitForTransaction({
    digest,
    options: { showObjectChanges: true },
  });

  for (const change of tx.objectChanges ?? []) {
    if (
      change.type === "created" &&
      change.objectType?.includes("predict_manager::PredictManager")
    ) {
      return change.objectId;
    }
  }

  throw new PredictManagerError("PredictManager was not found in transaction effects.");
}

export async function ensurePredictManager(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
}): Promise<string> {
  const existing = await fetchPredictManagerForOwner(params.account.address);
  if (existing) return existing;
  return createPredictManager(params);
}
