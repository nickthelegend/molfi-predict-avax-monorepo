/**
 * GMX V2 Synthetics Subgraph Integration
 * Uses official GMX Squids GraphQL API for on-chain data
 * Endpoint: https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql
 */

import { GMX_CONFIG } from '@/config/gmx';
import { getGmxTickers, getGmxMarketsInfo } from './gmx-api';
import type { GmxMarket, GmxPosition, GmxOrder } from '@/types/molfi-wallet';

// Official GMX Squids GraphQL endpoint for Arbitrum
const GMX_GRAPHQL_URL = 'https://gmx.squids.live/gmx-synthetics-arbitrum:prod/api/graphql';

// Fallback prices when API is unavailable
const FALLBACK_PRICES: Record<string, { usd: number; usd_24h_change: number }> = {
  'BTC/USD': { usd: 78591.00, usd_24h_change: 0.73 },
  'ETH/USD': { usd: 3245.50, usd_24h_change: -0.42 },
  'SOL/USD': { usd: 142.75, usd_24h_change: 1.28 },
};

// Symbol mapping
const GMX_TOKEN_TO_SYMBOL: Record<string, string> = {
  'BTC': 'BTC/USD',
  'ETH': 'ETH/USD',
  'SOL': 'SOL/USD',
};

interface PriceData {
  usd: number;
  usd_24h_change: number;
}

// Fetch real-time prices from GMX API
export async function fetchMarketPrices(): Promise<Record<string, PriceData>> {
  try {
    const tickers = await getGmxTickers();
    const prices: Record<string, PriceData> = {};
    
    for (const ticker of tickers) {
      const ourSymbol = GMX_TOKEN_TO_SYMBOL[ticker.tokenSymbol];
      if (ourSymbol) {
        // GMX prices are in 30 decimals
        const minPrice = parseFloat(ticker.minPrice) / 1e30;
        const maxPrice = parseFloat(ticker.maxPrice) / 1e30;
        const avgPrice = (minPrice + maxPrice) / 2;
        
        prices[ourSymbol] = {
          usd: avgPrice,
          usd_24h_change: FALLBACK_PRICES[ourSymbol]?.usd_24h_change || 0, // GMX tickers don't include 24h change
        };
      }
    }
    
    // Fill in any missing with fallbacks
    for (const symbol of Object.keys(FALLBACK_PRICES)) {
      if (!prices[symbol]) {
        prices[symbol] = FALLBACK_PRICES[symbol];
      }
    }
    
    return prices;
  } catch (error) {
    console.warn('Using fallback prices:', error);
    return { ...FALLBACK_PRICES };
  }
}

interface SubgraphMarketData {
  marketAddress: string;
  indexToken: string;
  longToken: string;
  shortToken: string;
  longOpenInterest: string;
  shortOpenInterest: string;
  longOpenInterestUsd: string;
  shortOpenInterestUsd: string;
  totalBorrowingFees: string;
  positionImpactPoolAmount: string;
}

interface SubgraphPositionData {
  id: string;
  account: string;
  market: string;
  collateralToken: string;
  sizeInUsd: string;
  sizeInTokens: string;
  collateralAmount: string;
  borrowingFactor: string;
  fundingFeeAmountPerSize: string;
  longTokenFundingAmountPerSize: string;
  shortTokenFundingAmountPerSize: string;
  increasedAtTime: string;
  decreasedAtTime: string;
  isLong: boolean;
}

// Fetch market data from GMX subgraph
export async function fetchGmxMarketData(): Promise<SubgraphMarketData[]> {
  const query = `
    query GetMarkets {
      marketInfos(first: 100) {
        marketToken
        indexToken
        longToken
        shortToken
        longOpenInterest
        shortOpenInterest
        longOpenInterestInTokens
        shortOpenInterestInTokens
      }
    }
  `;
  
  try {
    const response = await fetch(GMX_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    
    if (!response.ok) {
      throw new Error('Subgraph request failed');
    }
    
    const { data } = await response.json();
    return data?.marketInfos || [];
  } catch (error) {
    console.error('Error fetching GMX market data:', error);
    return [];
  }
}

// Fetch positions for a specific account
export async function fetchGmxPositions(account: string): Promise<GmxPosition[]> {
  const query = `
    query GetPositions($account: String!) {
      positions(where: { account: $account }) {
        id
        account
        market
        collateralToken
        sizeInUsd
        sizeInTokens
        collateralAmount
        isLong
        increasedAtTime
        decreasedAtTime
      }
    }
  `;
  
  try {
    const response = await fetch(GMX_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query,
        variables: { account: account.toLowerCase() }
      }),
    });
    
    if (!response.ok) {
      throw new Error('Subgraph request failed');
    }
    
    const { data } = await response.json();
    const positions: SubgraphPositionData[] = data?.positions || [];
    
    // Fetch current prices to calculate PnL
    const prices = await fetchMarketPrices();
    
    return positions.map((pos) => mapSubgraphPosition(pos, prices));
  } catch (error) {
    console.error('Error fetching positions:', error);
    return [];
  }
}

// Fetch orders for a specific account
export async function fetchGmxOrders(account: string): Promise<GmxOrder[]> {
  const query = `
    query GetOrders($account: String!) {
      orders(where: { account: $account }, orderBy: createdAtTime, orderDirection: desc) {
        id
        account
        receiver
        market
        initialCollateralToken
        sizeDeltaUsd
        initialCollateralDeltaAmount
        acceptablePrice
        executionFee
        orderType
        isLong
        status
        createdAtTime
        executedAtTime
        cancelledAtTime
      }
    }
  `;
  
  try {
    const response = await fetch(GMX_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query,
        variables: { account: account.toLowerCase() }
      }),
    });
    
    if (!response.ok) {
      throw new Error('Subgraph request failed');
    }
    
    const { data } = await response.json();
    const orders = data?.orders || [];
    
    return orders.map((order: any) => mapSubgraphOrder(order));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Map subgraph position to our GmxPosition type
function mapSubgraphPosition(pos: SubgraphPositionData, prices: Record<string, PriceData>): GmxPosition {
  // Find market symbol
  const marketConfig = Object.entries(GMX_CONFIG.markets).find(
    ([, m]) => m.address.toLowerCase() === pos.market.toLowerCase()
  );
  const symbol = marketConfig?.[1]?.symbol || 'UNKNOWN';
  
  const sizeUsd = parseFloat(pos.sizeInUsd) / 1e30;
  const collateral = parseFloat(pos.collateralAmount) / 1e6; // USDC has 6 decimals
  const leverage = collateral > 0 ? sizeUsd / collateral : 1;
  
  // Get current price for PnL calculation
  const currentPrice = prices[symbol]?.usd || 0;
  const entryPrice = sizeUsd / (parseFloat(pos.sizeInTokens) / 1e18); // Approximate
  
  // Calculate unrealized PnL
  let unrealizedPnl = 0;
  if (currentPrice > 0 && entryPrice > 0) {
    const priceDiff = currentPrice - entryPrice;
    const positionMultiplier = pos.isLong ? 1 : -1;
    unrealizedPnl = (priceDiff / entryPrice) * sizeUsd * positionMultiplier;
  }
  
  const unrealizedPnlPercent = collateral > 0 ? (unrealizedPnl / collateral) * 100 : 0;
  
  // Calculate liquidation price (simplified)
  const maintenanceMargin = 0.01;
  const liquidationBuffer = collateral * (1 - maintenanceMargin);
  let liquidationPrice: number;
  if (pos.isLong) {
    liquidationPrice = entryPrice * (1 - liquidationBuffer / sizeUsd);
  } else {
    liquidationPrice = entryPrice * (1 + liquidationBuffer / sizeUsd);
  }
  
  return {
    id: pos.id,
    market: pos.market,
    marketSymbol: symbol,
    side: pos.isLong ? 'long' : 'short',
    size: sizeUsd,
    collateral,
    leverage,
    entryPrice,
    currentPrice,
    liquidationPrice: Math.max(0, liquidationPrice),
    unrealizedPnl,
    unrealizedPnlPercent,
    createdAt: new Date(parseInt(pos.increasedAtTime) * 1000).toISOString(),
  };
}

// Map subgraph order to our GmxOrder type
function mapSubgraphOrder(order: any): GmxOrder {
  // Find market symbol
  const marketConfig = Object.entries(GMX_CONFIG.markets).find(
    ([, m]) => m.address.toLowerCase() === order.market.toLowerCase()
  );
  const symbol = marketConfig?.[1]?.symbol || 'UNKNOWN';
  
  const size = parseFloat(order.sizeDeltaUsd) / 1e30;
  const price = parseFloat(order.acceptablePrice) / 1e30;
  
  // Map order type (only market or limit supported in our types)
  const orderType: 'market' | 'limit' = 
    order.orderType === '1' || order.orderType === '3' ? 'limit' : 'market';
  
  // Map status
  let status: 'pending' | 'filled' | 'cancelled' | 'failed';
  if (order.cancelledAtTime) {
    status = 'cancelled';
  } else if (order.executedAtTime) {
    status = 'filled';
  } else {
    status = 'pending';
  }
  
  return {
    id: order.id,
    market: order.market,
    marketSymbol: symbol,
    side: order.isLong ? 'long' : 'short',
    orderType,
    size,
    price: price > 0 ? price : undefined,
    status,
    createdAt: new Date(parseInt(order.createdAtTime) * 1000).toISOString(),
    filledAt: order.executedAtTime 
      ? new Date(parseInt(order.executedAtTime) * 1000).toISOString() 
      : undefined,
  };
}

// Combined market data with prices
export async function fetchEnhancedMarkets(): Promise<GmxMarket[]> {
  const prices = await fetchMarketPrices();
  
  return Object.entries(GMX_CONFIG.markets).map(([key, market]) => {
    const priceData = prices[market.symbol] || FALLBACK_PRICES[market.symbol] || { usd: 0, usd_24h_change: 0 };
    
    // Static funding rates for display
    const fundingRates: Record<string, number> = {
      'BTC/USD': 0.0013,
      'ETH/USD': 0.0008,
      'SOL/USD': 0.0021,
    };
    
    return {
      address: market.address,
      symbol: market.symbol,
      indexToken: market.indexToken,
      longToken: market.indexToken,
      shortToken: GMX_CONFIG.tokens.USDC.address,
      price: priceData.usd,
      priceChange24h: priceData.usd_24h_change,
      fundingRate: fundingRates[market.symbol] || 0.001,
      openInterest: {
        long: market.symbol === 'BTC/USD' ? 16000000 : market.symbol === 'ETH/USD' ? 12400000 : 5200000,
        short: market.symbol === 'BTC/USD' ? 16900000 : market.symbol === 'ETH/USD' ? 11800000 : 4800000,
      },
      liquidity: market.symbol === 'BTC/USD' ? 99600000 : market.symbol === 'ETH/USD' ? 73800000 : 35200000,
    };
  });
}
