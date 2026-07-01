import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { SUI_NETWORK } from "@/lib/sui/client";

/** Extract the defining package ID from a fully-qualified Move struct type. */
export function packageIdFromStructType(type: string): string | null {
  const match = type.match(/^(0x[a-fA-F0-9]+)::/);
  return match?.[1] ?? null;
}

export type RegistryFields = {
  predictId: string;
  vaultId: string;
  feeCollectorId: string;
};

type MoveStructRef = {
  address?: string;
  module?: string;
  name?: string;
};

type MoveParam = {
  Reference?: { Struct?: MoveStructRef };
  MutableReference?: { Struct?: MoveStructRef };
};

export class LeverxDeployMismatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LeverxDeployMismatchError";
  }
}

/** Read canonical IDs stored on the shared LeverxRegistry object. */
export async function fetchRegistryFields(
  client: SuiJsonRpcClient,
  registryId: string,
): Promise<RegistryFields | null> {
  const res = await client.getObject({
    id: registryId,
    options: { showContent: true },
  });
  const fields = res.data?.content?.fields as
    | {
        predict_id?: string;
        vault_id?: string;
        fee_collector_id?: string;
      }
    | undefined;
  if (!fields?.predict_id || !fields.vault_id || !fields.fee_collector_id) {
    return null;
  }
  return {
    predictId: fields.predict_id,
    vaultId: fields.vault_id,
    feeCollectorId: fields.fee_collector_id,
  };
}

export async function fetchObjectStructType(
  client: SuiJsonRpcClient,
  objectId: string,
): Promise<string | null> {
  const res = await client.getObject({
    id: objectId,
    options: { showType: true },
  });
  const objectType = res.data?.type;
  return typeof objectType === "string" ? objectType : null;
}

/** Linked Predict manager ID stored on a UserProxy (on-chain source of truth). */
export async function readProxyPredictManagerId(
  client: SuiJsonRpcClient,
  proxyId: string,
): Promise<string | null> {
  const res = await client.getObject({
    id: proxyId,
    options: { showContent: true },
  });
  const fields = res.data?.content?.fields as { predict_manager_id?: string } | undefined;
  const managerId = fields?.predict_manager_id?.trim();
  return managerId || null;
}

function structPackageFromParam(param: MoveParam | undefined): string | null {
  const struct = param?.MutableReference?.Struct ?? param?.Reference?.Struct;
  return struct?.address ?? null;
}

async function expectedTradeArgPackage(
  leverxPackageId: string,
  argIndex: number,
): Promise<string | null> {
  const res = await fetch(getJsonRpcFullnodeUrl(SUI_NETWORK), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "sui_getNormalizedMoveFunction",
      params: [leverxPackageId, "trade", "leveraged_mint_binary_market"],
    }),
  });
  const json = (await res.json()) as {
    result?: { parameters?: MoveParam[] };
  };
  return structPackageFromParam(json.result?.parameters?.[argIndex]);
}

/**
 * Fail fast when on-chain object types do not match the published LeverX trade
 * entry points (common after publishing with embedded Predict deps).
 */
export async function assertLeverxTradeCompatibility(params: {
  client: SuiJsonRpcClient;
  leverxPackageId: string;
  predictId: string;
  oracleId: string;
  predictManagerId: string;
}): Promise<void> {
  const [expectedPredictPkg, expectedManagerPkg, expectedOraclePkg, predictType, managerType, oracleType] =
    await Promise.all([
      expectedTradeArgPackage(params.leverxPackageId, 3),
      expectedTradeArgPackage(params.leverxPackageId, 4),
      expectedTradeArgPackage(params.leverxPackageId, 5),
      fetchObjectStructType(params.client, params.predictId),
      fetchObjectStructType(params.client, params.predictManagerId),
      fetchObjectStructType(params.client, params.oracleId),
    ]);

  const mismatches: string[] = [];
  const predictPkg = predictType ? packageIdFromStructType(predictType) : null;
  const managerPkg = managerType ? packageIdFromStructType(managerType) : null;
  const oraclePkg = oracleType ? packageIdFromStructType(oracleType) : null;

  if (expectedPredictPkg && predictPkg && expectedPredictPkg !== predictPkg) {
    mismatches.push(
      `Predict object is ${predictPkg} but trade expects ${expectedPredictPkg}`,
    );
  }
  if (expectedManagerPkg && managerPkg && expectedManagerPkg !== managerPkg) {
    mismatches.push(
      `PredictManager is ${managerPkg} but trade expects ${expectedManagerPkg}`,
    );
  }
  if (expectedOraclePkg && oraclePkg && expectedOraclePkg !== oraclePkg) {
    mismatches.push(`Oracle is ${oraclePkg} but trade expects ${expectedOraclePkg}`);
  }

  if (mismatches.length === 0) return;

  throw new LeverxDeployMismatchError(
    `LeverX on-chain package is incompatible with the linked DeepBook Predict objects: ${mismatches.join("; ")}. ` +
      "Republish or upgrade the LeverX package using the published deepbook_predict dependency " +
      "(see contracts/Move.toml published-at), then run deploy_and_share again.",
  );
}

export async function fetchPackageIdForObject(
  client: SuiJsonRpcClient,
  objectId: string,
): Promise<string | null> {
  const res = await client.getObject({
    id: objectId,
    options: { showType: true },
  });
  const objectType = res.data?.type;
  if (!objectType || typeof objectType !== "string") return null;
  return packageIdFromStructType(objectType);
}

export async function fetchPackageIdsForProtocol(
  client: SuiJsonRpcClient,
  ids: { registryId: string; predictId?: string },
): Promise<{ leverxPackageId: string; predictPackageId?: string }> {
  const leverxPackageId = await fetchPackageIdForObject(client, ids.registryId);
  if (!leverxPackageId) {
    throw new Error(`Could not resolve LeverX package from registry ${ids.registryId}`);
  }

  let predictPackageId: string | undefined;
  if (ids.predictId) {
    const resolved = await fetchPackageIdForObject(client, ids.predictId);
    if (resolved) predictPackageId = resolved;
  }

  return { leverxPackageId, predictPackageId };
}

export async function objectMatchesStructType(
  client: SuiJsonRpcClient,
  objectId: string,
  expectedType: string,
): Promise<boolean> {
  const res = await client.getObject({
    id: objectId,
    options: { showType: true },
  });
  return res.data?.type === expectedType;
}
