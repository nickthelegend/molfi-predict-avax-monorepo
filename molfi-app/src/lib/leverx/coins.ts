import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction, type TransactionObjectArgument } from "@mysten/sui/transactions";
import { normalizeQuoteAssetType } from "@/lib/predict/quote-assets";

export class InsufficientCoinBalanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InsufficientCoinBalanceError";
  }
}

/** Split `amountAtoms` from the owner's primary coin object into the PTB. */
export async function splitCoinAmount(
  client: SuiJsonRpcClient,
  owner: string,
  coinType: string,
  amountAtoms: bigint,
  tx: Transaction,
): Promise<TransactionObjectArgument> {
  if (amountAtoms <= 0n) {
    throw new InsufficientCoinBalanceError("Amount must be greater than zero.");
  }

  const normalized = normalizeQuoteAssetType(coinType);
  const balance = await client.getBalance({ owner, coinType: normalized });
  if (BigInt(balance.totalBalance) < amountAtoms) {
    throw new InsufficientCoinBalanceError(
      `Insufficient ${normalized} balance for transaction.`,
    );
  }

  const coins = await client.getCoins({ owner, coinType: normalized, limit: 50 });
  if (coins.data.length === 0) {
    throw new InsufficientCoinBalanceError(`No ${normalized} coins found in wallet.`);
  }

  const primaryId = coins.data[0]!.coinObjectId;
  const primary = tx.object(primaryId);

  if (coins.data.length > 1) {
    tx.mergeCoins(
      primary,
      coins.data.slice(1).map((c) => tx.object(c.coinObjectId)),
    );
  }

  const [split] = tx.splitCoins(primary, [tx.pure.u64(amountAtoms)]);
  return split!;
}
