import { signAndExecuteTransaction } from "@mysten/wallet-standard";
import {
  SUI_MAINNET_CHAIN,
  SUI_TESTNET_CHAIN,
  type WalletWithRequiredFeatures,
} from "@mysten/wallet-standard";
import { isEnokiWallet } from "@mysten/enoki";
import type { WalletAccount } from "@wallet-standard/core";
import { Transaction } from "@mysten/sui/transactions";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { appConfig } from "@/lib/config";
import {
  formatInsufficientGasMessage,
  InsufficientGasError,
  MIN_SUI_GAS_MIST,
} from "@/lib/sui/insufficient-gas";
import { executeEnokiSponsoredTransaction } from "@/lib/sui/enoki-sponsored-tx";
import { isGoogleEnokiWallet } from "@/lib/sui/wallets";

const DEFAULT_GAS_BUDGET = 50_000_000;
const SUI_COIN_TYPE = "0x2::sui::SUI";

async function ensureSuiGasBalance(
  client: SuiJsonRpcClient,
  owner: string,
  gasBudget: number,
): Promise<void> {
  const { totalBalance } = await client.getBalance({
    owner,
    coinType: SUI_COIN_TYPE,
  });
  const have = BigInt(totalBalance);
  const needed = BigInt(Math.max(gasBudget, Number(MIN_SUI_GAS_MIST)));
  if (have < needed) {
    throw new InsufficientGasError(formatInsufficientGasMessage(have, needed));
  }
}

function walletChain() {
  return appConfig.suiNetwork === "testnet" ? SUI_TESTNET_CHAIN : SUI_MAINNET_CHAIN;
}

/** Build and sign a single Sui PTB (`Transaction`) via the wallet. */
export async function executeWalletTransaction(
  client: SuiJsonRpcClient,
  wallet: WalletWithRequiredFeatures,
  account: WalletAccount,
  build: (tx: Transaction) => void | Promise<void>,
  options?: { gasBudget?: number },
): Promise<{ digest: string }> {
  const gasBudget = options?.gasBudget ?? DEFAULT_GAS_BUDGET;

  if (isGoogleEnokiWallet(wallet)) {
    return executeEnokiSponsoredTransaction(
      client,
      wallet,
      account,
      build,
      gasBudget,
    );
  }

  // Extension wallets pay their own gas.
  if (!isEnokiWallet(wallet)) {
    await ensureSuiGasBalance(client, account.address, gasBudget);
  }

  const tx = new Transaction();
  tx.setSender(account.address);
  tx.setGasBudget(gasBudget);
  await build(tx);

  const transactionForWallet = {
    toJSON: () => tx.toJSON({ client }),
  };

  const result = await signAndExecuteTransaction(wallet, {
    transaction: transactionForWallet,
    account,
    chain: walletChain(),
  });

  const finalized = await client.waitForTransaction({
    digest: result.digest,
    options: { showEffects: true, showObjectChanges: true },
  });

  if (finalized.effects?.status?.status !== "success") {
    const err = finalized.effects?.status?.error;
    throw new Error(
      typeof err === "string" ? err : err ? JSON.stringify(err) : "Transaction failed on-chain",
    );
  }

  return { digest: result.digest };
}
