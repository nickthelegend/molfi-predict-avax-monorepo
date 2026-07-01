# API Integration Guide

This guide explains how to integrate your backend APIs with the frontend.

## Architecture Overview

The frontend now has a complete infrastructure for all backend API features:

- **Type System**: Full TypeScript types for markets, trading, portfolio, and vault operations
- **API Service Layer**: REST API client with all endpoints
- **WebSocket Service**: Real-time updates for orderbook, trades, and positions
- **React Hooks**: Easy-to-use hooks for all features
- **State Management**: Efficient data fetching and caching

## Configuration

### 1. Set API URLs

Update the API endpoints in your environment:

```typescript
// In src/services/api.ts
const API_BASE_URL = "https://your-api.predifi.io";

// In src/services/websocket.ts  
const WS_URL = "wss://ws.your-api.predifi.io";
```

### 2. Enable API Mode

To switch from mock data to real API:

```typescript
// In any page (e.g., src/pages/Index.tsx)
const { markets, hasMore, loadMore, isLoading } = useInfiniteMarkets({
  initialMarkets,
  batchSize: 24,
  useApi: true, // Set to true to use real API
  filters: {
    venue: ["polymarket"],
    status: ["open"],
  },
  sort: {
    field: "volume",
    direction: "desc",
  },
});
```

## Available Hooks

### Market Data

```typescript
// List markets with filters, sorting, and pagination
import { useMarkets } from "@/hooks/useMarkets";
const { markets, loadMore, hasMore } = useMarkets(filters, sort, limit);

// Get single market details
import { useMarketDetails } from "@/hooks/useMarketDetails";
const { market, stats } = useMarketDetails(marketId);

// Real-time orderbook
import { useOrderbook } from "@/hooks/useOrderbook";
const { orderbook } = useOrderbook(marketId);

// Trade history with real-time updates
import { useTradeHistory } from "@/hooks/useTradeHistory";
const { trades } = useTradeHistory(marketId);

// OHLC chart data
import { useOHLC } from "@/hooks/useOHLC";
const { data } = useOHLC(marketId, "1h");
```

### Trading

```typescript
// Get price quotes
import { useQuote } from "@/hooks/useQuote";
const { quote, getQuote } = useQuote();

await getQuote({
  marketId: "market_123",
  side: "buy",
  amount: 100,
  slippage: 0.5,
});
```

### Portfolio

```typescript
// User portfolio with real-time updates
import { usePortfolio } from "@/hooks/usePortfolio";
const { positions, transactions, summary, analytics } = usePortfolio(userAddress);
```

### Vault

```typescript
// Vault operations
import { useVault } from "@/hooks/useVault";
const { vaults, userPositions, transactions } = useVault(userAddress);
```

### WebSocket

```typescript
// Access WebSocket service
import { useWebSocket } from "@/providers/WebSocketProvider";
const { isConnected, service } = useWebSocket();

// Subscribe to custom events
service.subscribe("market:123", (event) => {
  console.log("Market update:", event);
});
```

## API Endpoints

All API endpoints are defined in `src/services/api.ts`:

### Markets
- `GET /markets` - List markets with filters
- `GET /markets/trending` - Trending markets
- `GET /markets/search` - Search markets
- `GET /markets/:id` - Market details
- `GET /markets/:id/orderbook` - Orderbook
- `GET /markets/:id/trades` - Trade history
- `GET /markets/:id/ohlc` - OHLC data

### Trading
- `POST /trading/quote` - Get price quote
- `POST /trading/deposit` - Build deposit transaction
- `GET /trading/orders/:address` - User orders
- `POST /trading/orders/:id/cancel` - Cancel order

### Portfolio
- `GET /portfolio/:address/positions` - User positions
- `GET /portfolio/:address/transactions` - Transaction history
- `GET /portfolio/:address/summary` - Portfolio summary
- `GET /portfolio/:address/analytics` - User analytics

### Redemption
- `POST /redemption/quote` - Redemption quote
- `POST /redemption/:marketId` - Redeem position

### Vault
- `GET /vaults` - List vaults
- `GET /vaults/:id` - Vault details
- `GET /vaults/positions/:address` - User vault positions
- `POST /vaults/:id/deposit` - Deposit to vault
- `POST /vaults/:id/withdraw` - Withdraw from vault

## WebSocket Events

The WebSocket service handles these event types:

- `orderbook_update` - Real-time orderbook changes
- `trade` - New trade executed
- `market_status` - Market status changes
- `position_update` - User position updates
- `order_update` - Order status updates

## Type System

All types are defined in:
- `src/types/market.ts` - Market-related types
- `src/types/trading.ts` - Trading types
- `src/types/portfolio.ts` - Portfolio types
- `src/types/vault.ts` - Vault types

## Migration Path

Current state: **UI Complete + API Ready**

1. ✅ Type system defined
2. ✅ API service layer built
3. ✅ WebSocket infrastructure ready
4. ✅ All hooks implemented
5. ⏳ Connect your backend API URLs
6. ⏳ Test with real data
7. ⏳ Enable `useApi: true` in production

The UI will work identically with both mock and real data!

## Example: Updating Index Page

```typescript
// src/pages/Index.tsx
const { markets, hasMore, loadMore } = useInfiniteMarkets({
  initialMarkets: [],
  batchSize: 24,
  useApi: true, // Enable API
  filters: {
    venue: ["polymarket", "limitless"],
    status: ["open"],
  },
  sort: {
    field: "volume",
    direction: "desc",
  },
});
```

## Testing

1. **With Mock Data**: Set `useApi: false` (current default)
2. **With Real API**: Set `useApi: true` and configure API URLs

No UI changes required - everything is backward compatible!
