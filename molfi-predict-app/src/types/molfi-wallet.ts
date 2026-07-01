// User's connected wallet (authentication layer)
export interface ConnectedWallet {
  address: string;
  type: 'eoa' | 'aa';
  provider: 'metamask' | 'walletconnect' | 'dynamic' | 'coinbase' | 'unknown';
}

// Arena wallet (smart contract per competition)
export interface ArenaWallet {
  address: string;
  competitionId: string;
  competitionNumber: number;
  balance: number;
  equity: number;
  roi: number;
  rank: number;
  initialDeposit: number;
  depositsLocked: boolean;
  isForfeited: boolean;
  status: 'ACTIVE' | 'QUALIFIED' | 'ELIMINATED' | 'WITHDRAWN';
}

// Protocol wallet system
export interface MolfiWalletSystem {
  connectedWallet: ConnectedWallet | null;
  proxyAddress: string | null;
  ledgerBalance: number;
  arenaWallets: ArenaWallet[];
}

// Supported networks for deposits
export interface SupportedNetwork {
  name: string;
  chainId: number;
  usdcAddress: string;
  isArenaCompatible: boolean;
  icon?: string;
}

// Deposit flow types
export type DepositSource = 'internal' | 'external';
export type DepositTarget = 'ledger' | 'arena';

export interface DepositConfig {
  source: DepositSource;
  target: DepositTarget;
  targetAddress: string;
  amount: number;
  network?: SupportedNetwork;
}

// Wallet context state
export interface MolfiWalletContextState {
  // Authentication
  connectedWallet: ConnectedWallet | null;
  isConnected: boolean;
  
  // Protocol addresses
  /** The user's deployed UserRouter address (their deposit address). */
  proxyAddress: string | null;

  // Router account (on-chain) — internal infrastructure, not exposed to users
  /** True once the UserRouter is deployed and ready to receive funds */
  isRouterReady: boolean;
  /** True while the silent setup is in progress (check + optional deploy) */
  isRouterSettingUp: boolean;
  /** USDC sitting in the router that hasn't been swept yet */
  routerUsdcBalance: string;
  /** Sweep USDC from router → vault */
  sweepRouter: () => Promise<void>;
  /** Re-check router state */
  refreshRouter: () => Promise<void>;
  // Balances
  ledgerBalance: number;
  ledgerBalanceLoading: boolean;
  
  // Arena wallets
  arenaWallets: ArenaWallet[];
  arenaWalletsLoading: boolean;
  currentArenaWallet: ArenaWallet | null;
  
  // Actions
  setCurrentArenaWallet: (wallet: ArenaWallet | null) => void;
  refreshLedgerBalance: () => Promise<void>;
  refreshArenaWallets: () => Promise<void>;
  
  // Network
  supportedNetworks: SupportedNetwork[];
}

// GMX specific types
export interface GmxMarket {
  address: string;
  symbol: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
  price: number;
  priceChange24h: number;
  fundingRate: number;
  openInterest: {
    long: number;
    short: number;
  };
  liquidity: number;
}

export interface GmxPosition {
  id: string;
  market: string;
  marketSymbol: string;
  side: 'long' | 'short';
  size: number;
  collateral: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  liquidationPrice: number;
  createdAt: string;
}

export interface GmxOrder {
  id: string;
  market: string;
  marketSymbol: string;
  side: 'long' | 'short';
  orderType: 'market' | 'limit';
  size: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  createdAt: string;
  filledAt?: string;
}

export interface OrderParams {
  marketAddress: string;
  side: 'long' | 'short';
  collateralAmount: bigint;
  leverage: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
  slippageBps?: number;
}
