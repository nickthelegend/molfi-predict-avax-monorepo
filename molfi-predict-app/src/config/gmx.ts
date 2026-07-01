import type { SupportedNetwork } from '@/types/molfi-wallet';

// GMX V2 Configuration for Arbitrum
export const GMX_CONFIG = {
  chainId: 42161, // Arbitrum One
  chainName: 'Arbitrum',
  
  // Official GMX API URLs (from docs.gmx.io)
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  oracleUrl: 'https://arbitrum-api.gmxinfra.io',
  subsquidUrl: 'https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql',
  
  // Fallback URLs
  fallbackOracleUrls: [
    'https://arbitrum-api-fallback.gmxinfra.io',
    'https://arbitrum-api-fallback.gmxinfra2.io',
  ],
  
  // GMX V2 Contract Addresses
  contracts: {
    router: '0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8',
    exchangeRouter: '0x69C527fC77291722b52649E45c838e41be8Bf5d5',
    subaccountRouter: '0x47c031236e19d024b42f8AE6780E44A573170703',
    dataStore: '0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8',
    reader: '0xf60becbba223EEA9495Da3f606753867eC10d139',
    orderVault: '0x31eF83a530Fde1B38EE9A18093A333D8Bbbc40D5',
  },
  
  // Supported perpetual markets
  markets: {
    BTC_USD: {
      address: '0x47c031236e19d024b42f8AE6780E44A573170703',
      symbol: 'BTC/USD',
      indexToken: '0x47904963fc8b2340414262125aF798B9655E58Cd', // WBTC
      displayName: 'Bitcoin',
      icon: '/assets/btc.png',
    },
    ETH_USD: {
      address: '0x70d95587d40A2caf56bd97485aB3Eec10Bee6336',
      symbol: 'ETH/USD', 
      indexToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
      displayName: 'Ethereum',
      icon: '/assets/eth.png',
    },
    SOL_USD: {
      address: '0x09400D9DB990D5ed3f35D7be61DfAEB900Af03C9',
      symbol: 'SOL/USD',
      indexToken: '0x2bcC6D6CdBbDC0a4071e48bb3B969b06B3330c07', // SOL
      displayName: 'Solana',
      icon: '/assets/sol.png',
    },
  },
  
  // Collateral tokens
  tokens: {
    USDC: {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      decimals: 6,
    },
    WETH: {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      symbol: 'WETH',
      decimals: 18,
    },
    WBTC: {
      address: '0x47904963fc8b2340414262125aF798B9655E58Cd',
      symbol: 'WBTC',
      decimals: 8,
    },
  },
  
  // Trading limits
  leverage: {
    min: 1,
    max: 50,
    presets: [1, 2, 5, 10, 20, 50],
  },
  
  // Default slippage in basis points (1.25%)
  defaultSlippageBps: 125,
  
  // Order execution
  execution: {
    minCollateralUsd: 10, // Minimum $10 collateral
    maxCollateralUsd: 100000, // Maximum $100k collateral
    executionFee: 0.0001, // ETH for keeper
  },
  
  // Data refresh intervals (ms)
  polling: {
    prices: 5000,      // 5 seconds for prices
    positions: 10000,  // 10 seconds for positions
    orders: 5000,      // 5 seconds for orders
  },
} as const;

// Supported deposit networks
export const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  {
    name: 'Arbitrum',
    chainId: 42161,
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    isArenaCompatible: true,
    icon: '/assets/arbitrum.png',
  },
  {
    name: 'Ethereum',
    chainId: 1,
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    isArenaCompatible: false,
    icon: '/assets/eth.png',
  },
  {
    name: 'Base',
    chainId: 8453,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    isArenaCompatible: false,
    icon: '/assets/base.png',
  },
  {
    name: 'Polygon',
    chainId: 137,
    usdcAddress: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    isArenaCompatible: false,
  },
];

// Arena competition defaults
export const ARENA_CONFIG = {
  initialDeposit: 100, // $100 USDC required
  minParticipants: 10,
  maxParticipants: 50,
  prizeDistribution: [0.4, 0.25, 0.15, 0.12, 0.08], // Top 5 split
} as const;

// Helper to get market by address
export const getMarketByAddress = (address: string) => {
  return Object.values(GMX_CONFIG.markets).find(
    (m) => m.address.toLowerCase() === address.toLowerCase()
  );
};

// Helper to get all market addresses
export const getMarketAddresses = () => {
  return Object.values(GMX_CONFIG.markets).map((m) => m.address);
};

// Helper to format market symbol
export const formatMarketSymbol = (symbol: string) => {
  return symbol.replace('_', '/');
};
