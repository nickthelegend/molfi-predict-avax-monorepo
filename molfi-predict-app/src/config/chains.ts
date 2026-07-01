import { mainnet, sepolia, arbitrum, arbitrumSepolia, base, baseSepolia, polygon, polygonAmoy, optimism, optimismSepolia } from "@account-kit/infra";
import type { Chain } from "viem";

// Additional chain configurations
export const bnbChain = {
  id: 56,
  name: "BNB Smart Chain",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://bsc-dataseed.binance.org"] },
    public: { http: ["https://bsc-dataseed.binance.org"] },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://bscscan.com" },
  },
  testnet: false,
} as const satisfies Chain;

export const bnbTestnet = {
  id: 97,
  name: "BNB Smart Chain Testnet",
  nativeCurrency: {
    name: "tBNB",
    symbol: "tBNB",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://data-seed-prebsc-1-s1.binance.org:8545"] },
    public: { http: ["https://data-seed-prebsc-1-s1.binance.org:8545"] },
  },
  blockExplorers: {
    default: { name: "BscScan", url: "https://testnet.bscscan.com" },
  },
  testnet: true,
} as const satisfies Chain;

// All supported chains
export const supportedChains: Chain[] = [
  mainnet,
  sepolia,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  optimism,
  optimismSepolia,
  bnbChain,
  bnbTestnet,
];

// Chain groups for UI
export const mainnetChains = supportedChains.filter(chain => !chain.testnet);
export const testnetChains = supportedChains.filter(chain => chain.testnet);

// Helper to get chain by ID
export const getChainById = (chainId: number): Chain | undefined => {
  return supportedChains.find(chain => chain.id === chainId);
};
