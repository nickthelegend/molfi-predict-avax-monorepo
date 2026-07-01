/**
 * Molfi — deployed Stellar testnet contract IDs and network config.
 * Override any of these via VITE_* env keys (see .env.template).
 */

export const STELLAR_RPC_URL =
  import.meta.env.VITE_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";

export const NETWORK_PASSPHRASE =
  import.meta.env.VITE_STELLAR_NETWORK === "mainnet"
    ? "Public Global Stellar Network ; September 2015"
    : "Test SDF Network ; September 2015";

export const EXPLORER = "https://stellar.expert/explorer/testnet";

/** A funded, public account used only as the source for read-only simulations. */
export const READ_SOURCE =
  import.meta.env.VITE_READ_SOURCE ??
  "GARYSHRXEGDAQ7KVSEILMJDPT5VD5Z6T5G54VV7JRREFKSRBT24HZLYY";

/** Live testnet deployment (see molfi-contracts/deploy/testnet.env). */
export const CONTRACTS = {
  verifier:
    import.meta.env.VITE_VERIFIER_CONTRACT_ID ??
    "CCTJUV6I5WVOLF7DQUZ2NX6ZJD2AWCGDBCEIN2SBFOWNLZP7MYV2ZXEC",
  market:
    import.meta.env.VITE_MARKET_CONTRACT_ID ??
    "CDDX7ELEU2XBQWYYS72BFKZN5M642EBLEA6N2X22WZTHNGXPF7YPAXP3",
  clobSettlement:
    import.meta.env.VITE_CLOB_SETTLEMENT_CONTRACT_ID ??
    "CCW46B3JPRS3PRKQMQ5CT2XE623QCISXSOC2O7UVHKFQZW77KK7ZHZKQ",
  privacyPool:
    import.meta.env.VITE_PRIVACY_POOL_CONTRACT_ID ??
    "CAIMKBEKKLAT2CQ2T3QY6RQLKTHGLIHIUHYDDQ4NXULTZWEGZM2OMPNN",
  policy:
    import.meta.env.VITE_POLICY_CONTRACT_ID ??
    "CCIQSVQN3KONZZZEVXG6JMJM5IVZYWN54ZENVBQ6VHO3OO4Q7CTCIYOI",
} as const;

/** A resolved market used by the /demo "read outcome" button (RAIN → YES). */
export const DEMO_MARKET_ID =
  "5f5a000000000000000000000000000000000000000000000000000000000003";

export const contractUrl = (id: string) => `${EXPLORER}/contract/${id}`;
export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
