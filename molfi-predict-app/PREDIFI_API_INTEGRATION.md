# PrediFi API Integration Guide (v2)

**Base URL:** `https://api.predifi.com`  
**Version:** v2  
**Last Updated:** February 8, 2026

## Frontend Service

All API calls go through `src/services/predifi-api.ts` (singleton `predifiApi`).

```typescript
import { predifiApi } from '@/services/predifi-api';
```

## Endpoints Covered

### Health & Monitoring
- `GET /health` → `predifiApi.healthCheck()`
- `GET /health/websocket` → `predifiApi.websocketHealth()`
- `GET /api/websocket/stats` → `predifiApi.websocketStats()`

### Markets
- `GET /api/aggregated` → `predifiApi.listAggregatedMarkets({ venue, category, status, limit, offset })`
- `GET /api/markets` → `predifiApi.listNativeMarkets({ category, status, limit, offset })`

### Leverage Trading
- `POST /api/leverage/calculate-liquidation` → `predifiApi.calculateLiquidation({ side, entryPrice, leverage })`
- `GET /api/leverage/positions?userId=` → `predifiApi.getLeveragePositions(userId)`
- `POST /api/leverage/positions` → `predifiApi.openLeveragePosition({ userId, marketId, side, margin, leverage })`
- `POST /api/leverage/positions/:id/close` → `predifiApi.closeLeveragePosition(positionId, userId)`

### Leaderboard & Copy Trading
- `GET /api/leaderboard` → `predifiApi.getLeaderboard({ sortBy, limit })`
- `POST /api/leaderboard/copy-trade/create` → `predifiApi.createCopyTrade({ followerId, leaderId, allocationPercentage, maxPositionSize })`
- `GET /api/leaderboard/copy-trade/list/:address` → `predifiApi.listCopyTrades(address)`
- `GET /api/leaderboard/copy-trade/:id/executions` → `predifiApi.getCopyTradeExecutions(relationshipId)`
- `POST /api/leaderboard/copy-trade/:id/pause` → `predifiApi.pauseCopyTrade(relationshipId, userId)`
- `DELETE /api/leaderboard/copy-trade/:id` → `predifiApi.deleteCopyTrade(relationshipId, userId)`

### Balance
- `GET /api/balance/:userId` → `predifiApi.getBalance(userId)`
- `POST /api/balance/lock` → `predifiApi.lockBalance({ userId, amount, refType, refId, reason })`
- `POST /api/balance/unlock` → `predifiApi.unlockBalance({ userId, refType, refId, reason })`

### Positions
- `GET /api/positions?userId=&status=` → `predifiApi.getPositions(userId, status)`

### Price Feeds
- `GET /api/prices/test` → `predifiApi.testPriceFeeds()`
- `GET /api/prices/:productId` → `predifiApi.getPrice(productId, source)`

### Oracle
- `GET /api/oracle/:marketId` → `predifiApi.getOracleData(marketId)`

### Withdrawals
- `POST /api/withdrawals/initiate` → `predifiApi.initiateWithdrawal({ userId, amount, destinationAddress })`
- `GET /api/withdrawals/:id` → `predifiApi.getWithdrawalStatus(withdrawalId)`

## WebSocket

**URL:** `wss://api.predifi.com`

```typescript
import { wsService } from '@/services/websocket';

await wsService.connect();
wsService.subscribeToMarkets(['markets', 'orderbook'], ['predifi-4ab98475']);

wsService.subscribe('market_update', (event) => {
  console.log(event.yes_price, event.no_price);
});
```

**Channels:** `markets`, `orderbook`, `trades`, `positions`

## React Hooks

```typescript
import { usePredifiMarkets } from '@/hooks/usePredifiMarkets';

const { markets, isLoading, loadMore, pagination } = usePredifiMarkets({
  status: 'active',
  venue: 'predifi',
  limit: 50,
});
```

## Response Format

All responses follow: `{ success: boolean, ...data }`. Markets use snake_case fields (`yes_price`, `volume_24h`, `image_url`, etc.).
