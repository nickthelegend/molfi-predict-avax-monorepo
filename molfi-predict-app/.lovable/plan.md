# GMX Perpetuals Trading Integration for Predifi Arena

## Overview
This plan outlines the frontend implementation for integrating GMX V2 perpetual trading within the Predifi Arena. The integration introduces a multi-wallet architecture with proper distinction between authentication methods (EOA vs Dynamic AA) and trading wallets.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐   ┌────────────────┐   ┌──────────────┐  │
│  │  Connected Wallet│──▶│  Proxy/Router  │   │ Arena Wallet │  │
│  │  (EOA or AA)     │   │  + Ledger Bal  │   │ (Per Comp)   │  │
│  │                  │   │   (Protocol)   │   │ (On-chain SC)│  │
│  └──────────────────┘   └────────────────┘   └──────────────┘  │
│         │                       │                    │          │
│    Signs All Txs           Prediction Mkt        GMX Trading   │
│                             Trading              (Arbitrum)     │
│         ▼                       ▼                    ▼          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              @gmx-io/sdk + Ethers Provider               │  │
│  │            (Arbitrum Mainnet Integration)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Wallet Types:**
- **Connected Wallet**: User's signing wallet - can be:
  - EOA (MetaMask, Rainbow, Coinbase Wallet via WalletConnect)
  - AA Wallet (Dynamic Embedded Wallet for social login users)
- **Proxy/Router**: Protocol-controlled address mapped 1:1 to user (deposit endpoint)
- **Ledger Balance**: Off-chain balance in protocol vaults (prediction market funds)
- **Arena Wallet**: On-chain smart contract wallet per competition (GMX trading funds)

---

## Phase 1: Wallet Context & Types

### New Files to Create

**src/types/predifi-wallet.ts**

```typescript
// User's connected wallet (authentication layer)
interface ConnectedWallet {
  address: string;           // EOA or AA wallet address
  type: 'eoa' | 'aa';       // Wallet type
  provider: 'metamask' | 'walletconnect' | 'dynamic' | 'coinbase';
}

// Protocol wallet system
interface PredifiWalletSystem {
  connectedWallet: ConnectedWallet;   // User's signing wallet
  proxyAddress: string;               // 1:1 deposit router (cross-chain)
  ledgerBalance: number;              // Internal balance (USDC in vaults)
  arenaWallets: ArenaWallet[];       // Per-competition wallets
}

// Arena wallet (smart contract)
interface ArenaWallet {
  address: string;          // On-chain contract address
  competitionId: string;
  balance: number;          // USDC balance in ArenaWallet
  equity: number;           // Balance + unrealized PnL
  roi: number;              // % change from initial deposit
  rank: number;             // Competition ranking (1-50)
  initialDeposit: number;   // Always $100
  depositsLocked: boolean;  // True after competition starts
  isForfeited: boolean;     // True if withdrawn or liquidated
}

interface SupportedNetwork {
  name: string;
  chainId: number;
  usdcAddress: string;
  isArenaCompatible: boolean;  // Only Arbitrum true for GMX
}
```

**src/contexts/PredifiWalletContext.tsx**

```typescript
// Manages all wallet state
- Track connectedWallet (from Dynamic or WalletConnect)
- Track proxyAddress (fetched from backend)
- Track ledgerBalance (fetched from backend)
- Track arenaWallets[] (fetched from arena_registrations)
- Provide switchWalletContext(walletAddress) for UI
```

### Modifications

**src/hooks/useWallet.ts**

```typescript
// Extend existing hook
- Add getConnectedWallet() → Returns ConnectedWallet
- Add getProxyAddress() → Returns proxy/router address
- Add getLedgerBalance() → Returns prediction market balance
- Add getArenaWallets() → Returns user's arena wallets
- Add getWalletBalance(address) → On-chain balance query
```

---

## Phase 2: Global Account UI Components

### New Components

**src/components/account/UserAccountMenu.tsx**

Dropdown menu from header showing:
```
Connected: 0x1234...5678 (MetaMask) [or (Dynamic AA)]
Network: Arbitrum

━━━━━━━━━━━━━━━━━━━━━
Prediction Market
Balance: $523.45 USDC
[Deposit] [Withdraw]

━━━━━━━━━━━━━━━━━━━━━
Arena Wallets
┌─────────────────────┐
│ Competition #42     │
│ $123.40 (+23.4% ROI)│
│ Rank: #12/50        │
└─────────────────────┘
┌─────────────────────┐
│ Competition #38     │
│ $87.20 (-12.8% ROI) │
│ Ended               │
└─────────────────────┘

━━━━━━━━━━━━━━━━━━━━━
[Disconnect]
```

**src/components/account/WalletSelector.tsx**

Reusable selector for context switching:
```typescript
<WalletSelector 
  wallets={[
    { type: 'ledger', label: 'Prediction Market', balance: 523.45 },
    { type: 'arena', label: 'Competition #42', balance: 123.40, roi: 23.4 }
  ]}
  selected="arena-42"
  onSelect={(id) => switchContext(id)}
/>
```

**src/components/account/ArenaEquityBadge.tsx** (renamed from ArenaBalanceBadge)

Shows equity, not just balance:
```
┌─────────────────────┐
│ Arena #42           │
│ $123.40 (+23.4%)   │
│ Rank: #12/50        │
└─────────────────────┘
```

**src/components/account/DepositModal.tsx**

Multi-step deposit with corrected flow:

```
Step 1: Select Funding Source
  ○ Internal Transfer (from Prediction Market balance: $523.45)
  ○ External Deposit (fresh USDC)

{if Internal Transfer}
  Step 2: Confirm Internal Transfer
    Amount: $100 USDC (required for competition)
    From: Prediction Market Vault
    To: Arena Wallet (Competition #42)
    
    New ledger balance: $423.45
    
    [Confirm Transfer] [Cancel]
    
    Note: This is instant and gas-free

{if External Deposit}
  Step 2: Select Target Wallet
    ○ Prediction Market (via Proxy/Router)
    ○ Arena Wallet (Competition #42) - Arbitrum only
  
  Step 3: Select Network
    {if Prediction Market selected}
      ○ Ethereum, Arbitrum, Base, Polygon (all supported)
    {if Arena Wallet selected}
      ○ Arbitrum only (GMX native chain)
  
  Step 4: Deposit Instructions
    Send exactly $100 USDC on {network} to:
    
    {arenaWalletAddress}
    
    [Copy Address] [Show QR] [Send via Wallet]
    
    Waiting for deposit...
    (Balance polling active)
```

### Header Integration

**src/components/Header.tsx modifications:**

Post-login: Replace wallet button area with:
- User avatar/icon (clickable → UserAccountMenu)
- Deposit button (→ DepositModal)
- ArenaEquityBadge (shows equity + ROI + rank)
- Keep existing Dynamic widget for authentication

---

## Phase 3: GMX SDK Integration

### New Dependencies

```json
{
  "@gmx-io/sdk": "^latest",
  "qrcode.react": "^3.1.0"
}
```

### Configuration

**src/config/gmx.ts**

```typescript
export const GMX_CONFIG = {
  chainId: 42161, // Arbitrum
  router: '0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8',
  subaccountRouter: '0x47c031236e19d024b42f8AE6780E44A573170703',
  
  markets: {
    BTC_USD: '0x...',
    ETH_USD: '0x...',
    SOL_USD: '0x...'
  },
  
  tokens: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
  },
  
  leverage: {
    min: 1,
    max: 50
  }
};
```

### SDK Integration

**src/services/gmx-sdk.ts**

```typescript
// Initialize SDK with connected wallet provider
const initGmxSdk = (provider: ethers.Provider) => {
  return new GmxSdk({
    chainId: GMX_CONFIG.chainId,
    provider,
    markets: GMX_CONFIG.markets
  });
};

// Create order with ArenaWallet as account, connected wallet as signer
const createLongOrder = async (
  arenaWalletAddress: string,  // Account (owns position)
  signer: ethers.Signer,        // Connected wallet (signs tx)
  params: OrderParams
) => {
  return sdk.orders.long({
    account: arenaWalletAddress,  // Position owner
    ...params
  });
  // Signer signs the transaction
};
```

**src/hooks/useGmxSdk.ts**

```typescript
const useGmxSdk = () => {
  const { connectedWallet } = usePredifiWallet();
  const provider = useEthersProvider(); // From connected wallet
  
  return useMemo(() => initGmxSdk(provider), [provider]);
};
```

**src/hooks/useGmxMarkets.ts**

- Fetch and cache GMX market data
- Real-time price updates via GMX oracles/subgraph
- Return: markets[], loading, error

**src/hooks/useGmxPositions.ts**

- Fetch open positions for a given arena wallet
- Calculate unrealized PnL, liquidation prices
- Real-time position updates

**src/hooks/useGmxOrders.ts**

- Manage order creation and cancellation
- Order history and status tracking
- Pending order monitoring

---

## Phase 4: Arena Trading Interface

### New Components

**src/components/arena/trading/MarketsOverview.tsx**

Grid of BTC/ETH/SOL perpetual markets. For each market show:
- Current price
- 24h change (%)
- Funding rate
- Open interest
- Available liquidity
- Click to select market for trading

**src/components/arena/trading/TradingInterface.tsx**

Main trading panel with:
- Market selector dropdown
- Side toggle (Long/Short)
- Collateral input (USDC from Arena Wallet)
- Leverage slider (1x-50x with presets)
- Order type tabs (Market/Limit)
- Position preview: Size, Entry price estimate, Liquidation price, GMX fees breakdown
- Place Order button (calls GMX SDK with arena wallet as account, connected wallet as signer)

```typescript
// Place Order button logic
const handlePlaceOrder = async () => {
  const { connectedWallet, currentArenaWallet } = usePredifiWallet();
  const signer = await getSigner(connectedWallet); // EOA or AA signer
  
  await gmxSdk.orders.long({
    account: currentArenaWallet.address,  // ArenaWallet owns position
    payAmount: collateralAmount,
    marketAddress: selectedMarket,
    // ... other params
  });
  // Connected wallet (EOA or AA) signs transaction
};
```

**src/components/arena/trading/PositionsTable.tsx**

Table of open positions for current Arena Wallet.

Columns:
- Market
- Side
- Size
- Entry Price
- Current Price
- Leverage
- Unrealized PnL
- Liquidation Price

Row actions:
- Close (full/partial)
- Add collateral

Real-time PnL updates with color coding

**src/components/arena/trading/OrderHistory.tsx**

Tabs: Open Orders, Filled, Cancelled

Order details:
- Market
- Side
- Size
- Price
- Status
- Timestamp
- Cancel button for open orders

**src/components/arena/trading/PositionDetailModal.tsx**

- Full position details
- Close position form (partial/full)
- Add collateral form
- Position history

---

## Phase 5: Critical Additions (Missing from Original)

### New Components Required

**src/components/arena/ArenaLeaderboard.tsx**

Real-time leaderboard (critical for prediction markets):
```typescript
<ArenaLeaderboard 
  competitionId={id}
  refreshInterval={10000}  // 10 seconds
  columns={['Rank', 'Trader', 'ROI%', 'Equity', 'Status']}
/>
```

**src/components/arena/CompetitionStatus.tsx**

Competition info header:
```
Competition #42 | Ends in: 4d 12h 45m
Your Rank: #12 / 50 | ROI: +23.4% | Equity: $123.40
Deposits: 🔒 Locked (started 3 days ago)
```

**src/components/arena/ForfeitWarningModal.tsx**

Shows on withdrawal attempt:
```
⚠️ FORFEIT WARNING

Withdrawing funds will permanently remove you from Competition #42.

You will:
  ✗ Lose eligibility for top 5 prizes
  ✗ Be removed from leaderboard
  ✓ Receive your current balance: $123.40

Current standings:
  Rank: #12 / 50
  ROI: +23.4%
  Prize pool: $500 (top 5 share)

This action cannot be undone.

[Cancel] [Withdraw & Forfeit]
```

**src/components/arena/DepositLockBanner.tsx**

Warning when deposits are locked:
```
🔒 Deposits Locked
Competition has started. Additional deposits not allowed.
You can still trade with your current balance: $123.40
```

---

## Phase 6: Page Updates

**src/pages/arena/CompetitorHome.tsx refactor:**

- Import new trading components
- Add CompetitionStatus header
- Add ArenaLeaderboard
- Replace mock trading interface with TradingInterface
- Replace mock positions with PositionsTable
- Replace mock trade history with OrderHistory
- Add MarketsOverview as expandable section
- Gate all trading UI behind Arena Wallet existence check
- Show ForfeitWarningModal on withdrawal attempt

---

## Phase 7: Data Flow & State Management

### React Query Keys

```typescript
// GMX data queries
['gmx', 'markets'] // All supported markets
['gmx', 'market', marketAddress] // Single market data
['gmx', 'positions', arenaWalletAddress] // User positions
['gmx', 'orders', arenaWalletAddress] // User orders
['gmx', 'tradeHistory', arenaWalletAddress] // Trade history

// Wallet queries
['predifi', 'wallets', userAddress] // User's wallets
['predifi', 'balance', walletAddress, token] // Wallet balance
['predifi', 'ledger', userAddress] // Prediction market balance
['predifi', 'equity', arenaWalletAddress] // Equity + unrealized PnL

// Arena queries
['arena', 'leaderboard', competitionId] // Real-time rankings
['arena', 'competition', competitionId] // Competition details
['arena', 'status', arenaWalletAddress] // Forfeit status, locks
```

### Order Execution Flow

1. User configures order in TradingInterface
2. Frontend validates inputs, calculates estimates
3. Frontend calls sdk.orders.long() or sdk.orders.short()
   - account: arenaWalletAddress (ArenaWallet smart contract)
   - Uses connected wallet as signer (EOA or AA)
4. User signs transaction in wallet (MetaMask popup or Dynamic modal)
5. Order submitted to GMX
6. Frontend polls/subscribes for order status
7. Position appears in PositionsTable when filled
8. Real-time PnL updates start
9. Leaderboard updates with new equity/ROI

---

## Implementation Sequence

### Week 1: Foundation
- Create wallet types and context
- Implement PredifiWalletContext
- Build WalletSelector component
- Build DepositModal (all steps with internal transfer option)
- Integrate UserAccountMenu into Header

### Week 2: GMX Integration
- Add @gmx-io/sdk dependency
- Create GMX config and service layer
- Implement useGmxSdk, useGmxMarkets hooks
- Build MarketsOverview component
- Test market data fetching
- Test order execution with EOA and AA wallets

### Week 3: Trading Interface
- Build TradingInterface with order form
- Implement useGmxPositions, useGmxOrders
- Build PositionsTable with real-time updates
- Build OrderHistory component
- Wire up order execution flow
- Add error handling for GMX rejections

### Week 4: Arena Features
- Build ArenaLeaderboard with real-time updates
- Build CompetitionStatus component
- Build ForfeitWarningModal
- Add deposit lock enforcement
- Add forfeit detection and UI updates
- Real-time equity/ROI calculations

### Week 5: Integration & Polish
- Refactor CompetitorHome with all new components
- Add Arena Wallet conditional rendering
- Implement ArenaEquityBadge
- End-to-end testing (EOA + AA wallets)
- Error handling and edge cases
- Performance optimization (polling intervals)

---

## Technical Considerations

### Wallet Address Handling

```typescript
// Authentication layer
const connectedWallet = {
  address: await getAddress(),  // From Dynamic or WalletConnect
  type: isMetaMask ? 'eoa' : isDynamic ? 'aa' : 'eoa',
  provider: 'metamask' | 'dynamic' | 'walletconnect'
};

// Protocol layer
const proxyAddress = await fetchProxyAddress(connectedWallet.address);
const ledgerBalance = await fetchLedgerBalance(connectedWallet.address);

// Arena layer  
const arenaWallets = await fetchArenaWallets(connectedWallet.address);
```

### GMX Order Structure

```typescript
// Long position example
sdk.orders.long({
  account: arenaWalletAddress,      // ArenaWallet smart contract
  payAmount: collateralInWei,
  marketAddress: GMX_MARKETS.ETH_USD,
  payTokenAddress: USDC_ADDRESS,
  collateralTokenAddress: USDC_ADDRESS,
  allowedSlippageBps: 125,          // 1.25%
  leverage: 20000n,                 // 2x (leverage * 10000)
});
```

### GMX Order Execution

```typescript
// Works with BOTH EOA and AA wallets
const signer = await provider.getSigner(); // Connected wallet signer
const tx = await gmxSdk.orders.long({
  account: arenaWalletAddress,  // Smart contract (owns position)
  // ... params
});
await signer.sendTransaction(tx); // EOA or AA signs
```

### Balance Polling Strategy

- Poll every 10s when DepositModal is open
- Poll every 30s for ArenaEquityBadge
- Poll every 10-15s for ArenaLeaderboard
- Immediate refetch after transaction confirmation
- WebSocket subscription for real-time position updates (if GMX supports)

### Error Handling

- **Network mismatch**: "Please switch to Arbitrum for Arena trading"
- **Insufficient balance**: Clear error message with balance display
- **GMX order rejection**: Parse and display GMX error codes
- **Transaction failures**: Show retry option with error details
- **Deposits locked**: "Competition started. Additional deposits not allowed."
- **Forfeit attempt**: Show ForfeitWarningModal
- **Wrong network for deposit**: "Arena deposits require Arbitrum"
- **Insufficient arena balance**: "Arena wallet balance: $50. Required for trade: $75"

---

## Files Summary

### New Files (21)

**Types & Context:**
1. src/types/predifi-wallet.ts
2. src/contexts/PredifiWalletContext.tsx

**Configuration & Services:**
3. src/config/gmx.ts
4. src/services/gmx-sdk.ts

**Hooks:**
5. src/hooks/useGmxSdk.ts
6. src/hooks/useGmxMarkets.ts
7. src/hooks/useGmxPositions.ts
8. src/hooks/useGmxOrders.ts

**Account Components:**
9. src/components/account/UserAccountMenu.tsx
10. src/components/account/WalletSelector.tsx
11. src/components/account/ArenaEquityBadge.tsx
12. src/components/account/DepositModal.tsx

**Trading Components:**
13. src/components/arena/trading/MarketsOverview.tsx
14. src/components/arena/trading/TradingInterface.tsx
15. src/components/arena/trading/PositionsTable.tsx
16. src/components/arena/trading/OrderHistory.tsx
17. src/components/arena/trading/PositionDetailModal.tsx

**Arena-Specific Components:**
18. src/components/arena/ArenaLeaderboard.tsx
19. src/components/arena/CompetitionStatus.tsx
20. src/components/arena/ForfeitWarningModal.tsx
21. src/components/arena/DepositLockBanner.tsx

### Modified Files (4)

1. src/hooks/useWallet.ts (extend with wallet utilities)
2. src/components/Header.tsx (integrate account menu)
3. src/pages/arena/CompetitorHome.tsx (use new trading components)
4. package.json (add dependencies)

---

## Out of Scope (Backend/Contracts)

- Backend wallet creation logic
- Custody and settlement systems
- Competition leaderboard calculation logic (backend computes ROI/rankings)
- Prize distribution mechanisms
- Liquidation monitoring engines
- Smart contract development (ArenaWallet, ArenaManager, Factory)
- Internal transfer execution (backend API handles vault → ArenaWallet transfers)
- Cross-chain bridge integrations

---

## API Endpoints Expected (Backend Must Provide)

```typescript
// Wallet management
GET  /api/user/proxy-address          // Returns proxy/router address
GET  /api/user/ledger-balance         // Returns internal balance
GET  /api/user/arena-wallets          // Returns user's arena wallets

// Arena operations
POST /api/arena/fund-internal         // Transfer from ledger to arena
GET  /api/arena/competition/:id       // Competition details
GET  /api/arena/leaderboard/:id       // Real-time rankings
GET  /api/arena/equity/:walletAddress // Equity calculation with unrealized PnL

// Position tracking
GET  /api/arena/positions/:walletAddress  // GMX positions for arena wallet
GET  /api/arena/pnl/:walletAddress        // Real-time PnL calculation
```

---

## Success Criteria

**Phase 1-2 (Wallet Foundation):**
- ✅ User can see connected wallet (EOA or AA)
- ✅ User can see prediction market balance
- ✅ User can see all arena wallets with equity/ROI
- ✅ User can switch context between wallets
- ✅ Deposit modal supports internal + external funding

**Phase 3-4 (GMX Trading):**
- ✅ Markets display with real-time prices
- ✅ User can create long/short orders
- ✅ Orders execute with ArenaWallet as account
- ✅ Connected wallet (EOA/AA) signs transactions successfully
- ✅ Positions display with real-time PnL
- ✅ Order history shows all trades

**Phase 5 (Arena Features):**
- ✅ Leaderboard updates every 10-15 seconds
- ✅ ROI% calculates correctly (including unrealized PnL)
- ✅ Forfeit warning shows on withdrawal attempt
- ✅ Deposit locks enforced after competition start
- ✅ Competition timer counts down accurately

**Overall:**
- ✅ Works seamlessly with both EOA and Dynamic AA wallets
- ✅ No confusion between wallet types in UI
- ✅ Real-time data critical for prediction markets
- ✅ Professional trading interface matching GMX standards
