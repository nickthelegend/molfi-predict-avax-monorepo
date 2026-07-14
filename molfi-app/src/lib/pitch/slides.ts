export type PitchPattern =
  | "grid"
  | "dots"
  | "diagonal"
  | "cross"
  | "rings"
  | "mesh"
  | "stripes"
  | "diamond"
  | "wave"
  | "frame";

export type PitchIllustration =
  | "cover"
  | "problem"
  | "layers"
  | "chart"
  | "vault"
  | "jarvis"
  | "pillars"
  | "flow"
  | "personas"
  | "roadmap";

export type PitchSlide = {
  id: string;
  eyebrow: string;
  title: string;
  body?: string;
  items?: string[];
  links?: { label: string; href: string }[];
  pattern: PitchPattern;
  illustration: PitchIllustration;
};

export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: "cover",
    eyebrow: "Private prediction markets · Avalanche",
    title: "Molfi",
    body: "Bet on real-world outcomes — your side stays private, proven with zero-knowledge.",
    pattern: "grid",
    illustration: "cover",
  },
  {
    id: "problem",
    eyebrow: "The gap",
    title: "Every bet is public",
    items: [
      "On-chain prediction markets expose your every position",
      "Whales see which side you took — and front-run it",
      "A pseudonymous address isn't privacy",
    ],
    pattern: "dots",
    illustration: "problem",
  },
  {
    id: "solution",
    eyebrow: "The pitch",
    title: "Molfi hides your side",
    body: "A private prediction market on Avalanche, settled on-chain.",
    items: [
      "Bet YES or NO — your side hidden behind a commitment note",
      "Claim winnings with an on-chain Groth16 proof",
      "Payout is unlinkable to your deposit — never revealed",
    ],
    pattern: "diagonal",
    illustration: "layers",
  },
  {
    id: "mechanics",
    eyebrow: "How a private bet works",
    title: "Commit · Resolve · Claim",
    items: [
      "Commit a uniform-denomination note — side + amount hidden",
      "The market resolves on-chain from the Chainlink oracle",
      "Prove you backed the winner in zero-knowledge — nullifier burned",
    ],
    pattern: "cross",
    illustration: "chart",
  },
  {
    id: "onchain",
    eyebrow: "Real, on-chain",
    title: "Solidity contracts, live on Fuji testnet",
    items: [
      "PredictEscrow + ConfidentialBet deployed and verified",
      "Every bet checked on-chain — BN254 Groth16",
      "An autonomous keeper rolls and settles markets 24/7",
    ],
    pattern: "rings",
    illustration: "vault",
  },
  {
    id: "agents",
    eyebrow: "Agent-native",
    title: "Agents trade Molfi",
    items: [
      "molfi-predict-sdk + SKILL.md — an agent self-onboards",
      "Generate a wallet, faucet, and bet — no human in the loop",
      "Proven: an agent placed a real ZK-verified bet on-chain",
    ],
    pattern: "mesh",
    illustration: "jarvis",
  },
  {
    id: "why",
    eyebrow: "Why it's real",
    title: "Built on Avalanche's real primitives",
    items: [
      "Chainlink Data Feeds — the live Avalanche price oracle",
      "Circom + snarkjs Groth16 over BN254",
      "mUSDC escrow — real on-chain settlement, not a mock",
    ],
    pattern: "stripes",
    illustration: "pillars",
  },
  {
    id: "getstarted",
    eyebrow: "Get started",
    title: "Live on testnet today",
    items: [
      "Connect an Avalanche wallet · faucet test mUSDC",
      "Pick a market — bet in the open, or 🔒 privately",
      "Win? Claim on-chain with a ZK proof — your side never shown",
    ],
    pattern: "diamond",
    illustration: "flow",
  },
  {
    id: "who",
    eyebrow: "Who it's for",
    title: "Built for every lane",
    items: [
      "Traders → private positions, no front-running",
      "Degens → fast YES/NO crypto markets, 15m & 30m",
      "Agents → an SDK + skill to trade autonomously",
      "Builders → open-source contracts + ZK circuits",
    ],
    pattern: "wave",
    illustration: "personas",
  },
  {
    id: "next",
    eyebrow: "What's next",
    title: "Roadmap",
    items: [
      "Shared anonymity set — a BN254 Poseidon accumulator",
      "Client-side proving for end-to-end trustlessness",
      "Mainnet, more markets, and richer privacy",
    ],
    links: [{ label: "molfi.fun", href: "https://molfi.fun" }],
    pattern: "frame",
    illustration: "roadmap",
  },
];

export const PITCH_SLIDE_COUNT = PITCH_SLIDES.length;
