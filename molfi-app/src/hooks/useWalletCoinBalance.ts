import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { normalizeQuoteAssetType } from "@/lib/predict/quote-assets";

export type WalletCoinBalance = {
  atoms: bigint;
  usd: number;
};

function decimalsForCoin(coinType: string, override?: number): number {
  if (override != null) return override;
  return coinType.includes("sui::SUI") ? 9 : 6;
}

/** Coerce legacy react-query cache entries (plain number) into { atoms, usd }. */
export function normalizeWalletCoinBalance(
  data: unknown,
  scale: number,
): WalletCoinBalance | undefined {
  if (data == null) return undefined;
  if (typeof data === "number") {
    if (!Number.isFinite(data)) return undefined;
    return {
      atoms: BigInt(Math.round(data * scale)),
      usd: data,
    };
  }
  if (typeof data === "object" && "usd" in data) {
    const row = data as WalletCoinBalance;
    const usd = Number(row.usd);
    if (!Number.isFinite(usd)) return undefined;
    const atoms =
      typeof row.atoms === "bigint"
        ? row.atoms
        : row.atoms != null
          ? BigInt(row.atoms)
          : BigInt(Math.round(usd * scale));
    return { atoms, usd };
  }
  return undefined;
}

export function walletCoinBalanceUsd(
  balance: WalletCoinBalance | null | undefined,
): number | null {
  if (balance == null) return null;
  return Number.isFinite(balance.usd) ? balance.usd : null;
}

export function useWalletCoinBalance(coinType: string | null, decimalsOverride?: number) {
  const { client, address } = useWallet();
  const normalized = coinType ? normalizeQuoteAssetType(coinType) : null;
  const decimals = normalized ? decimalsForCoin(normalized, decimalsOverride) : 6;
  const scale = 10 ** decimals;

  return useQuery({
    queryKey: ["wallet-coin-balance", "v2", address, normalized, decimals],
    queryFn: async (): Promise<WalletCoinBalance> => {
      const balance = await client.getBalance({
        owner: address!,
        coinType: normalized!,
      });
      const atoms = BigInt(balance.totalBalance);
      return {
        atoms,
        usd: Number(atoms) / scale,
      };
    },
    select: (data) => normalizeWalletCoinBalance(data, scale) ?? data,
    enabled: Boolean(address && normalized),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
