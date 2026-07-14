/** Plain-language copy for the marketing landing page. */
export const landingCopy = {
  eyebrow: "Live on Avalanche · Fuji Testnet",
  heroTitle: "Predict privately.",
  heroTitleAccent: "Confidential prediction markets on Avalanche.",
  heroLead:
    "Bet on real-world outcomes with on-chain settlement and zero-knowledge privacy. Your position stays yours.",
  ctaTrade: "Start trading",
  ctaHow: "How it works",

  audienceTraders: "Traders",
  audienceEarners: "Builders",

  featuresEyebrow: "Why Molfi",
  featuresIntroTitle: "Everything you need to predict privately",

  leverageEyebrow: "Charts",
  leverageTitle: "See winning and losing at a glance",
  leverageLead:
    "Your target price sits in the middle of the chart. When the live price crosses above or below it, the line turns green or red so you always know where you stand.",
  leverageBullets: [
    "Price-up and price-down bets on major assets",
    "Target price always centered on the chart",
    "Clear signals when a position is ahead or behind",
  ] as const,
  leverageCta: "Start trading",

  marketsEyebrow: "Markets",
  marketsTitle: "Pick a direction on live prices",
  marketsLead:
    "Will BTC finish above your target? Below it? Choose a market, set your view, and place your bet — settled on-chain by Solidity contracts.",
  marketsBullets: [
    "Price-up and price-down markets on major assets",
    "Target prices update as the market moves",
    "Full list of open markets, live on Avalanche Fuji",
  ] as const,
  marketsCta: "Browse markets",

  orderbookEyebrow: "Privacy",
  orderbookTitle: "Your position stays private",
  orderbookLead:
    "Positions are committed on-chain and proven with zero-knowledge. The order book shows real market depth without revealing who holds what.",
  orderbookBullets: [
    "Confidential positions via ZK commitments",
    "Nullifiers stop double-spends without doxxing you",
    "Honest market depth, private identities",
  ] as const,
  orderbookCta: "View markets",

  earnersTitle: "Private by design",
  earnersLead:
    "Molfi runs on Solidity smart contracts with a Groth16 zero-knowledge verifier and a privacy pool — confidential by construction, not by promise.",

  vaultEyebrow: "On-chain",
  vaultTitle: "Settled by smart contracts",
  vaultLead:
    "Every market is created and resolved on Avalanche via a Chainlink oracle and an on-chain settlement contract. No custodian, no trust-me — verify each step on-chain.",
  vaultBullets: [
    "Markets created and resolved by Solidity contracts",
    "Outcomes settled by the PredictEscrow settlement contract",
    "Every step verifiable on Snowtrace",
  ] as const,
  vaultCta: "Browse markets",

  keeperEyebrow: "Zero-knowledge",
  keeperTitle: "Provably private bets",
  keeperLead:
    "A BN254 Groth16 verifier checks proofs on-chain, so you can deposit, bet, and withdraw from the privacy pool without ever revealing your position.",
  keeperBullets: [
    "Groth16 proofs verified on-chain",
    "Commitment Merkle tree plus nullifiers",
    "Deposit and withdraw confidentially",
  ] as const,
  keeperCta: "How it works",

  footnote: "Testnet · Built on Avalanche",
} as const;
