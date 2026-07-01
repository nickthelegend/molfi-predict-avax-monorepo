import {
  SUI_TESTNET_CHAIN,
  SuiSignTransaction,
  type WalletWithRequiredFeatures,
} from "@mysten/wallet-standard";
import type { WalletAccount } from "@wallet-standard/core";
import { Transaction } from "@mysten/sui/transactions";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { fromBase64, toBase64 } from "@mysten/sui/utils";
import {
  keeperCreateSponsoredTransaction,
  keeperExecuteSponsoredTransaction,
} from "@/lib/leverx/keeper-client";

function formatKeeperGasError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const detail = message.includes(":") ? message.split(":").slice(2).join(":").trim() : message;

  if (
    message.includes("enoki_not_configured") ||
    detail.includes("enoki_not_configured") ||
    message.includes(":503")
  ) {
    return "Gas sponsorship is not configured on the keeper. Set ENOKI_SECRET_KEY in keeper/.env and redeploy.";
  }

  const enokiDetail = detail && detail !== message ? detail.slice(0, 480) : "";
  if (enokiDetail.includes("assert_keeper_managed_manager") || enokiDetail.includes("keeper_not_configured")) {
    return "Onboarding failed: registry keeper_address is not set on-chain (abort 52). After republish, run: node contracts/scripts/set-keeper-address.mjs";
  }
  if (enokiDetail) {
    return `Gas sponsorship failed: ${enokiDetail}. If you republished contracts, run contracts/scripts/set-keeper-address.mjs and update the Enoki portal (contracts/scripts/print-enoki-allowlist.mjs).`;
  }

  return "Gas sponsorship failed. After republishing contracts, update the Enoki Developer Portal allow list (contracts/scripts/print-enoki-allowlist.mjs).";
}

/** Sponsor, sign, and execute a user PTB via keeper → Enoki (Google zkLogin). */
export async function executeEnokiSponsoredTransaction(
  client: SuiJsonRpcClient,
  wallet: WalletWithRequiredFeatures,
  account: WalletAccount,
  build: (tx: Transaction) => void | Promise<void>,
  gasBudget: number,
): Promise<{ digest: string }> {
  const tx = new Transaction();
  tx.setSender(account.address);
  tx.setGasBudget(gasBudget);
  await build(tx);

  const kindBytes = await tx.build({ client, onlyTransactionKind: true });
  const transactionKindBytes = toBase64(kindBytes);

  let sponsored: { bytes: string; digest: string };
  try {
    sponsored = await keeperCreateSponsoredTransaction({
      sender: account.address,
      transactionKindBytes,
    });
  } catch (err) {
    throw new Error(formatKeeperGasError(err));
  }

  const signFeature = wallet.features[SuiSignTransaction];
  if (!signFeature?.signTransaction) {
    throw new Error("Connected wallet cannot sign Enoki sponsored transactions.");
  }

  const sponsoredTx = Transaction.from(fromBase64(sponsored.bytes));
  const { signature } = await signFeature.signTransaction({
    transaction: {
      toJSON: () => sponsoredTx.toJSON({ client }),
    },
    account,
    chain: SUI_TESTNET_CHAIN,
  });

  let executed: { digest: string };
  try {
    executed = await keeperExecuteSponsoredTransaction({
      digest: sponsored.digest,
      signature,
    });
  } catch (err) {
    throw new Error(formatKeeperGasError(err));
  }

  const finalized = await client.waitForTransaction({
    digest: executed.digest,
    options: { showEffects: true, showObjectChanges: true },
  });

  if (finalized.effects?.status?.status !== "success") {
    const err = finalized.effects?.status?.error;
    throw new Error(
      typeof err === "string" ? err : err ? JSON.stringify(err) : "Transaction failed on-chain",
    );
  }

  return { digest: executed.digest };
}
