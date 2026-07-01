/**
 * Molfi — deployed Stellar testnet contract IDs and market constants.
 * Network/RPC/passphrase live in ./walletKit. Override any value via VITE_* env.
 * Source of truth: molfi-contracts/deploy/testnet.env
 */

/** Funded public account used only as the source for read-only simulations. */
export const READ_SOURCE =
  (import.meta.env.VITE_READ_SOURCE as string | undefined) ??
  "GARYSHRXEGDAQ7KVSEILMJDPT5VD5Z6T5G54VV7JRREFKSRBT24HZLYY";

/** Native XLM Stellar Asset Contract (the quote asset for deposits). */
export const NATIVE_SAC =
  (import.meta.env.VITE_NATIVE_SAC as string | undefined) ??
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/** Live testnet deployment (see molfi-contracts/deploy/testnet.env). */
export const CONTRACTS = {
  verifier:
    (import.meta.env.VITE_VERIFIER_CONTRACT_ID as string | undefined) ??
    "CCTJUV6I5WVOLF7DQUZ2NX6ZJD2AWCGDBCEIN2SBFOWNLZP7MYV2ZXEC",
  market:
    (import.meta.env.VITE_MARKET_CONTRACT_ID as string | undefined) ??
    "CDDX7ELEU2XBQWYYS72BFKZN5M642EBLEA6N2X22WZTHNGXPF7YPAXP3",
  clobSettlement:
    (import.meta.env.VITE_CLOB_SETTLEMENT_CONTRACT_ID as string | undefined) ??
    "CCW46B3JPRS3PRKQMQ5CT2XE623QCISXSOC2O7UVHKFQZW77KK7ZHZKQ",
  privacyPool:
    (import.meta.env.VITE_PRIVACY_POOL_CONTRACT_ID as string | undefined) ??
    "CAIMKBEKKLAT2CQ2T3QY6RQLKTHGLIHIUHYDDQ4NXULTZWEGZM2OMPNN",
  policy:
    (import.meta.env.VITE_POLICY_CONTRACT_ID as string | undefined) ??
    "CCIQSVQN3KONZZZEVXG6JMJM5IVZYWN54ZENVBQ6VHO3OO4Q7CTCIYOI",
  /** mUSDC — Molfi's testnet stablecoin with an open faucet. */
  musdc:
    (import.meta.env.VITE_MUSDC_CONTRACT_ID as string | undefined) ??
    "CD4J6V73L5LBHDPCDITB2SMZQK5URUFBDED5IGTEU4G6XOUYXYUBJYST",
  /** predict-escrow — real-money pari-mutuel betting + on-chain ZK-gated bets. */
  predictEscrow:
    (import.meta.env.VITE_PREDICT_ESCROW_CONTRACT_ID as string | undefined) ??
    "CCMR7AL3QT57B7KRZQ47AH34E4OQH42JXUK6BE7SQKRVOIJKAVILURL7",
  /** LP vault — deposit mUSDC, earn trading fees. */
  vault:
    (import.meta.env.VITE_VAULT_CONTRACT_ID as string | undefined) ??
    "CBZSLDILDHVFVZ5E54Y4Z33H6AQANZYQLCB2MKOADD63BLP7VYA7VHDB",
  /** confidential-bet — hidden-side commitment notes + on-chain ZK claim. */
  confidentialBet:
    (import.meta.env.VITE_CONF_BET_CONTRACT_ID as string | undefined) ??
    "CBJO7AZHJSS4JZFTFYHZWK7B2ZZNZ4OUQMAZ53YAJCMJB3M7HHHISJXA",
} as const;

/** mUSDC has 7 decimals; one whole token = 1e7 base units. */
export const MUSDC_DECIMALS = 7;
export const PREDICT_ESCROW = CONTRACTS.predictEscrow;
export const MUSDC_UNIT = 10_000_000;

/** Outcome encoding shared by the market + clob-settlement contracts. */
export const OUTCOME = { YES: 0, NO: 1, INVALID: 2 } as const;

/** Market lifecycle status from the `market` contract. */
export const MARKET_STATUS = { TRADING: 0, RESOLVING: 1, RESOLVED: 2 } as const;

/** Seeded testnet markets (32-byte hex ids). */
export const MARKET_IDS = {
  BTC: "b7c0000000000000000000000000000000000000000000000000000000000001",
  ETH: "e7e0000000000000000000000000000000000000000000000000000000000002",
  RAIN: "5f5a000000000000000000000000000000000000000000000000000000000003",
  ELEC: "e1ec000000000000000000000000000000000000000000000000000000000004",
} as const;

export const EXPLORER = "https://stellar.expert/explorer/testnet";
export const contractUrl = (id: string): string => `${EXPLORER}/contract/${id}`;
export const txUrl = (hash: string): string => `${EXPLORER}/tx/${hash}`;
