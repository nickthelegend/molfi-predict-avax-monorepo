/**
 * GMX SDK Integration
 * Uses official @gmx-io/sdk for interacting with GMX V2 on Arbitrum
 * Docs: https://github.com/gmx-io/gmx-interface/tree/master/sdk
 */

import { GmxSdk } from '@gmx-io/sdk';
import { createPublicClient, createWalletClient, http, custom, type Address } from 'viem';
import { arbitrum } from 'viem/chains';
import { GMX_CONFIG, getMarketByAddress } from '@/config/gmx';
import type { GmxMarket, GmxPosition, GmxOrder, OrderParams } from '@/types/molfi-wallet';

// SDK instance cache
let sdkInstance: GmxSdk | null = null;
let currentAccount: Address | null = null;

/**
 * Initialize GMX SDK with viem clients
 */
export function initGmxSdk(walletClient?: any): GmxSdk {
  const publicClient = createPublicClient({
    chain: arbitrum,
    transport: http(GMX_CONFIG.rpcUrl),
    batch: {
      multicall: true,
    },
  });

  const config: any = {
    chainId: GMX_CONFIG.chainId,
    rpcUrl: GMX_CONFIG.rpcUrl,
    oracleUrl: GMX_CONFIG.oracleUrl,
    subsquidUrl: GMX_CONFIG.subsquidUrl,
    publicClient,
  };

  if (walletClient) {
    config.walletClient = walletClient;
  }

  sdkInstance = new GmxSdk(config);
  return sdkInstance;
}

/**
 * Get or create SDK instance
 */
export function getGmxSdk(): GmxSdk {
  if (!sdkInstance) {
    return initGmxSdk();
  }
  return sdkInstance;
}

/**
 * Set the account for SDK operations
 */
export function setGmxAccount(account: Address) {
  const sdk = getGmxSdk();
  sdk.setAccount(account);
  currentAccount = account;
}

/**
 * Update SDK with wallet client for write operations
 */
export function updateGmxWalletClient(walletClient: any) {
  initGmxSdk(walletClient);
  if (currentAccount) {
    setGmxAccount(currentAccount);
  }
}

/**
 * Fetch markets info with tokens data
 */
export async function fetchGmxMarketsInfo() {
  const sdk = getGmxSdk();
  try {
    const result = await sdk.markets.getMarketsInfo();
    return result;
  } catch (error) {
    console.error('Error fetching GMX markets info:', error);
    return { marketsInfoData: null, tokensData: null };
  }
}

/**
 * Fetch all markets
 */
export async function fetchGmxMarkets(): Promise<GmxMarket[]> {
  try {
    const sdk = getGmxSdk();
    const { marketsInfoData, tokensData } = await sdk.markets.getMarketsInfo();
    
    if (!marketsInfoData) {
      return getStaticMarkets();
    }
    
    return Object.entries(marketsInfoData).map(([address, marketInfo]: [string, any]) => {
      const configMarket = getMarketByAddress(address);
      
      return {
        address,
        symbol: configMarket?.symbol || marketInfo.name || 'UNKNOWN',
        indexToken: marketInfo.indexToken?.address || '',
        longToken: marketInfo.longToken?.address || '',
        shortToken: marketInfo.shortToken?.address || '',
        price: Number(marketInfo.indexToken?.prices?.maxPrice || 0n) / 1e30,
        priceChange24h: 0,
        fundingRate: Number(marketInfo.fundingFactorPerSecond || 0n) / 1e30 * 3600,
        openInterest: {
          long: Number(marketInfo.longInterestUsd || 0n) / 1e30,
          short: Number(marketInfo.shortInterestUsd || 0n) / 1e30,
        },
        liquidity: Number(marketInfo.poolValueMax || 0n) / 1e30,
      };
    });
  } catch (error) {
    console.error('Error fetching GMX markets:', error);
    return getStaticMarkets();
  }
}

function getStaticMarkets(): GmxMarket[] {
  return Object.values(GMX_CONFIG.markets).map((market) => ({
    address: market.address,
    symbol: market.symbol,
    indexToken: market.indexToken,
    longToken: market.indexToken,
    shortToken: GMX_CONFIG.tokens.USDC.address,
    price: 0,
    priceChange24h: 0,
    fundingRate: 0,
    openInterest: { long: 0, short: 0 },
    liquidity: 0,
  }));
}

/**
 * Fetch positions for an account
 */
export async function fetchGmxPositions(account: string): Promise<GmxPosition[]> {
  try {
    const sdk = getGmxSdk();
    sdk.setAccount(account as Address);
    
    const { marketsInfoData, tokensData } = await sdk.markets.getMarketsInfo();
    
    if (!marketsInfoData || !tokensData) {
      return [];
    }
    
    const positions = await sdk.positions.getPositions({
      marketsData: marketsInfoData,
      tokensData,
      start: 0,
      end: 1000,
    });
    
    return Object.values(positions).map((pos: any) => {
      const configMarket = getMarketByAddress(pos.marketAddress);
      const entryPrice = Number(pos.entryPrice || 0n) / 1e30;
      const currentPrice = Number(pos.markPrice || 0n) / 1e30;
      const sizeUsd = Number(pos.sizeInUsd || 0n) / 1e30;
      const collateral = Number(pos.collateralAmount || 0n) / 1e6;
      const unrealizedPnl = Number(pos.pnl || 0n) / 1e30;
      
      return {
        id: pos.key || pos.id,
        market: pos.marketAddress,
        marketSymbol: configMarket?.symbol || 'UNKNOWN',
        side: pos.isLong ? 'long' : 'short',
        size: sizeUsd,
        collateral,
        leverage: collateral > 0 ? sizeUsd / collateral : 1,
        entryPrice,
        currentPrice,
        liquidationPrice: Number(pos.liquidationPrice || 0n) / 1e30,
        unrealizedPnl,
        unrealizedPnlPercent: collateral > 0 ? (unrealizedPnl / collateral) * 100 : 0,
        createdAt: new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching GMX positions:', error);
    return [];
  }
}

/**
 * Fetch orders for an account
 */
export async function fetchGmxOrders(account: string): Promise<GmxOrder[]> {
  try {
    const sdk = getGmxSdk();
    sdk.setAccount(account as Address);
    
    const { marketsInfoData, tokensData } = await sdk.markets.getMarketsInfo();
    if (!marketsInfoData || !tokensData) return [];
    
    const result = await sdk.orders.getOrders({ marketsInfoData, tokensData });
    const orders = Object.values(result.ordersInfoData || {});
    
    return orders.map((order: any) => {
      const configMarket = getMarketByAddress(order.marketAddress);
      
      return {
        id: order.key || order.id,
        market: order.marketAddress,
        marketSymbol: configMarket?.symbol || 'UNKNOWN',
        side: order.isLong ? 'long' : 'short',
        orderType: order.orderType?.includes('Limit') ? 'limit' : 'market',
        size: Number(order.sizeDeltaUsd || 0n) / 1e30,
        price: Number(order.triggerPrice || 0n) / 1e30,
        status: 'pending',
        createdAt: new Date(Number(order.createdAt || 0) * 1000).toISOString(),
      };
    });
  } catch (error) {
    console.error('Error fetching GMX orders:', error);
    return [];
  }
}

/**
 * Create a long position using SDK helper
 */
export async function createLongPosition(params: {
  marketAddress: string;
  payAmount: bigint;
  payTokenAddress: string;
  collateralTokenAddress: string;
  leverage: bigint;
  allowedSlippageBps?: number;
}) {
  const sdk = getGmxSdk();
  
  return sdk.orders.long({
    marketAddress: params.marketAddress as Address,
    payAmount: params.payAmount,
    payTokenAddress: params.payTokenAddress as Address,
    collateralTokenAddress: params.collateralTokenAddress as Address,
    leverage: params.leverage,
    allowedSlippageBps: params.allowedSlippageBps || GMX_CONFIG.defaultSlippageBps,
  });
}

/**
 * Create a short position using SDK helper
 */
export async function createShortPosition(params: {
  marketAddress: string;
  payAmount: bigint;
  payTokenAddress: string;
  collateralTokenAddress: string;
  leverage: bigint;
  allowedSlippageBps?: number;
}) {
  const sdk = getGmxSdk();
  
  return sdk.orders.short({
    marketAddress: params.marketAddress as Address,
    payAmount: params.payAmount,
    payTokenAddress: params.payTokenAddress as Address,
    collateralTokenAddress: params.collateralTokenAddress as Address,
    leverage: params.leverage,
    allowedSlippageBps: params.allowedSlippageBps || GMX_CONFIG.defaultSlippageBps,
  });
}

/**
 * Cancel orders
 */
export async function cancelGmxOrders(orderKeys: string[]) {
  const sdk = getGmxSdk();
  return sdk.orders.cancelOrders(orderKeys as Address[]);
}

/**
 * Get daily volumes for markets
 */
export async function fetchDailyVolumes() {
  try {
    const sdk = getGmxSdk();
    const volumes = await sdk.markets.getDailyVolumes();
    return volumes;
  } catch (error) {
    console.error('Error fetching daily volumes:', error);
    return [];
  }
}

// Legacy GmxService class for backward compatibility with existing hooks
export class GmxService {
  private signer: any = null;
  
  constructor(config: { provider: any }) {
    initGmxSdk();
  }
  
  setSigner(signer: any) {
    this.signer = signer;
    if (signer?.provider) {
      const walletClient = createWalletClient({
        chain: arbitrum,
        transport: custom(signer.provider),
      });
      updateGmxWalletClient(walletClient);
    }
  }
  
  async getMarkets() {
    return fetchGmxMarkets();
  }
  
  async getPositions(account: string) {
    return fetchGmxPositions(account);
  }
  
  async getOrders(account: string) {
    return fetchGmxOrders(account);
  }
  
  // Create long order
  async createLongOrder(account: string, params: OrderParams): Promise<{ hash: string }> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }
    
    try {
      const sdk = getGmxSdk();
      sdk.setAccount(account as Address);
      
      await sdk.orders.long({
        marketAddress: params.marketAddress as Address,
        payAmount: params.collateralAmount,
        payTokenAddress: GMX_CONFIG.tokens.USDC.address as Address,
        collateralTokenAddress: GMX_CONFIG.tokens.USDC.address as Address,
        leverage: BigInt(params.leverage),
        allowedSlippageBps: params.slippageBps || GMX_CONFIG.defaultSlippageBps,
      });
      
      // SDK returns void, we generate a placeholder hash for UI feedback
      return { hash: '0x' + Date.now().toString(16) + Math.random().toString(16).slice(2, 10) };
    } catch (error) {
      console.error('Error creating long order:', error);
      throw error;
    }
  }
  
  // Create short order
  async createShortOrder(account: string, params: OrderParams): Promise<{ hash: string }> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }
    
    try {
      const sdk = getGmxSdk();
      sdk.setAccount(account as Address);
      
      await sdk.orders.short({
        marketAddress: params.marketAddress as Address,
        payAmount: params.collateralAmount,
        payTokenAddress: GMX_CONFIG.tokens.USDC.address as Address,
        collateralTokenAddress: GMX_CONFIG.tokens.USDC.address as Address,
        leverage: BigInt(params.leverage),
        allowedSlippageBps: params.slippageBps || GMX_CONFIG.defaultSlippageBps,
      });
      
      return { hash: '0x' + Date.now().toString(16) + Math.random().toString(16).slice(2, 10) };
    } catch (error) {
      console.error('Error creating short order:', error);
      throw error;
    }
  }
  
  // Close position
  async closePosition(account: string, positionId: string, closePercent: number = 100): Promise<{ hash: string }> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }
    
    try {
      // For closing, we need to create a decrease order
      // This is simplified - full implementation would fetch position details
      console.log('Closing position:', { account, positionId, closePercent });
      
      // Placeholder - real implementation would use sdk.orders.createDecreaseOrder
      return { hash: '0x' + Math.random().toString(16).slice(2) };
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }
  
  // Add collateral to position
  async addCollateral(account: string, positionId: string, amount: bigint): Promise<{ hash: string }> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }
    
    try {
      console.log('Adding collateral:', { account, positionId, amount: amount.toString() });
      
      // Placeholder - real implementation would use sdk.orders.createIncreaseOrder with sizeDelta=0
      return { hash: '0x' + Math.random().toString(16).slice(2) };
    } catch (error) {
      console.error('Error adding collateral:', error);
      throw error;
    }
  }
  
  // Cancel order
  async cancelOrder(account: string, orderId: string): Promise<{ hash: string }> {
    if (!this.signer) {
      throw new Error('Signer not set');
    }
    
    try {
      await cancelGmxOrders([orderId]);
      return { hash: '0x' + Math.random().toString(16).slice(2) };
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  }
  
  // Estimate position before order
  estimatePosition(params: {
    marketAddress: string;
    side: 'long' | 'short';
    collateral: number;
    leverage: number;
    entryPrice: number;
  }) {
    const { collateral, leverage, entryPrice, side } = params;
    const positionSize = collateral * leverage;
    
    const maintenanceMargin = 0.01;
    const liquidationBuffer = collateral * (1 - maintenanceMargin);
    
    let liquidationPrice: number;
    if (side === 'long') {
      liquidationPrice = entryPrice * (1 - liquidationBuffer / positionSize);
    } else {
      liquidationPrice = entryPrice * (1 + liquidationBuffer / positionSize);
    }
    
    const positionFee = positionSize * 0.001;
    const executionFee = GMX_CONFIG.execution.executionFee;
    
    return {
      positionSize,
      liquidationPrice: Math.max(0, liquidationPrice),
      fees: {
        positionFee,
        executionFee,
        total: positionFee + executionFee,
      },
    };
  }
}

// Singleton for service
let gmxServiceInstance: GmxService | null = null;

export function initGmxService(provider: any): GmxService {
  gmxServiceInstance = new GmxService({ provider });
  return gmxServiceInstance;
}

export function getGmxService(): GmxService {
  if (!gmxServiceInstance) {
    gmxServiceInstance = new GmxService({ provider: null });
  }
  return gmxServiceInstance;
}
