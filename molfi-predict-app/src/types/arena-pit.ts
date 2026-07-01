/**
 * Arena Pit Types
 * Professional live trading competition interface
 */

// ============================================================================
// EPOCH SYSTEM
// ============================================================================

export enum EpochState {
  PRE_EPOCH = 'pre',      // 30s countdown before epoch starts
  ACTIVE = 'active',      // 4-hour competition in progress
  COOLDOWN = 'cooldown',  // 10s freeze for settlement
  SETTLING = 'settling'   // Backend computing final ranks
}

export interface Epoch {
  id: string
  startTimestamp: number
  endTimestamp: number
  duration: number // 4 hours in milliseconds
  state: EpochState
  lockedRanking: string[] // Trader addresses in locked order
  finalRanking?: TraderRank[] // Only available after settling
}

export interface TraderRank {
  address: string
  rank: number
  pnl: number
  roi: number
  volume: number
}

// ============================================================================
// TRADER STATE
// ============================================================================

export interface TraderExposure {
  longSize: number
  shortSize: number
  avgLongEntry: number
  avgShortEntry: number
  pnl: number
  unrealizedPnl: number
}

export interface TraderMarketExposure {
  BTC: TraderExposure
  ETH: TraderExposure
  SOL: TraderExposure
}

// ============================================================================
// PREDICTION MARKET TYPES
// ============================================================================

export interface TraderHistoricalStats {
  competitionsPlayed: number
  wins: number
  top3Finishes: number
  winRate: number // percentage
  avgRank: number
  lifetimePnL: number
}

export interface TraderMarketData {
  marketId: string          // Multi-outcome market ID
  outcomeIndex: number       // This trader's outcome index (0-49)
  probability: number        // 0.0 to 1.0 (e.g., 0.42 = 42%)
  yesPrice: number          // Price to bet YES
  noPrice: number           // Price to bet NO
  volume: number            // Total bet on this outcome
  oddsChange: number        // % change since epoch start

  userPosition?: {
    shares: number
    side: 'YES' | 'NO'
    avgPrice: number
    currentValue: number
    unrealizedPnL: number
  }
}

export interface TraderState {
  address: string
  name: string
  avatarUrl?: string

  // Balances
  unusedBalance: number
  totalEquity: number

  // Exposure
  exposure: TraderMarketExposure

  // Performance
  totalPnl: number
  totalPnlPercentage: number
  epochVolume: number
  epochTradeCount: number

  // Ranking
  currentRank: number
  epochStartRank: number
  rankDelta: number // Positive = moved up, negative = moved down

  // Status
  isLive: boolean
  lastUpdateTimestamp: number

  // Risk
  leverage: number
  liquidationRisk: boolean // True if near liquidation

  // Funding
  fundingPaid: number
  fundingReceived: number
  netFunding: number

  // Historical & Market Data
  historicalStats?: TraderHistoricalStats
  marketData?: TraderMarketData
}

// ============================================================================
// PERFORMANCE BANDS & BADGES
// ============================================================================

export enum PerformanceBand {
  TOP = 'top',       // Top 25%
  MIDDLE = 'middle', // Middle 50%
  BOTTOM = 'bottom'  // Bottom 25%
}

export enum PerformanceBadge {
  LEADING = 'leading',   // Top 3
  CLIMBING = 'climbing', // Moved up ≥2 ranks
  HOLDING = 'holding',   // ±1 rank
  FALLING = 'falling',   // Dropped ≥2 ranks
  RISK = 'risk'          // Near liquidation
}

export function getPerformanceBand(rank: number, totalTraders: number): PerformanceBand {
  const percentile = rank / totalTraders
  if (percentile <= 0.25) return PerformanceBand.TOP
  if (percentile <= 0.75) return PerformanceBand.MIDDLE
  return PerformanceBand.BOTTOM
}

export function getPerformanceBadge(trader: TraderState): PerformanceBadge {
  if (trader.liquidationRisk) return PerformanceBadge.RISK
  if (trader.currentRank <= 3) return PerformanceBadge.LEADING
  if (trader.rankDelta >= 2) return PerformanceBadge.CLIMBING
  if (trader.rankDelta <= -2) return PerformanceBadge.FALLING
  return PerformanceBadge.HOLDING
}

// ============================================================================
// DISPLAY MODES
// ============================================================================

export enum DensityMode {
  COMPACT = 'compact',   // 4x3 grid, minimal data
  BALANCED = 'balanced', // 4x3 grid, standard (default)
  DETAILED = 'detailed'  // 3x2 grid, expanded inline
}

export interface GridLayout {
  columns: number
  rows: number
  visiblePanels: number
}

export const GRID_LAYOUTS: Record<DensityMode, GridLayout> = {
  [DensityMode.COMPACT]: { columns: 4, rows: 3, visiblePanels: 12 },
  [DensityMode.BALANCED]: { columns: 4, rows: 3, visiblePanels: 12 },
  [DensityMode.DETAILED]: { columns: 3, rows: 2, visiblePanels: 6 }
}

// ============================================================================
// MARKET DATA
// ============================================================================

export type PairSymbol = 'BTC' | 'ETH' | 'SOL'

export interface MarketPrice {
  symbol: PairSymbol
  price: number
  change24h: number
  change24hPercentage: number
  lastUpdate: number
}

export interface GlobalPrices {
  BTC: MarketPrice
  ETH: MarketPrice
  SOL: MarketPrice
}

// ============================================================================
// ARENA PIT STATE
// ============================================================================

export interface ArenaPitState {
  // Epoch
  currentEpoch: Epoch

  // Traders
  traders: TraderState[]
  totalTraders: number

  // Aggregate stats
  totalPnl: number
  totalVolume: number

  // Prices
  prices: GlobalPrices

  // Metadata
  serverTimestamp: number
  checksum: string // Backend-computed hash for reconciliation
  version: string
  dataSourceLatency: number // ms since GMX query
  cacheHit: boolean
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface ArenaPitApiResponse {
  traders: Array<{
    address: string
    name: string
    unusedBalance: number
    exposure: {
      BTC: {
        longSize: number
        shortSize: number
        avgLongEntry: number
        avgShortEntry: number
      }
      ETH: {
        longSize: number
        shortSize: number
        avgLongEntry: number
        avgShortEntry: number
      }
      SOL: {
        longSize: number
        shortSize: number
        avgLongEntry: number
        avgShortEntry: number
      }
    }
    totalVolumeEpoch: number
    tradeCountEpoch: number
    fundingPaid: number
    fundingReceived: number
  }>
  totalCount: number
  epochEndTimestamp: number
  epochStartTimestamp: number
  epochId: string
  serverTimestamp: number
  checksum: string
  version: string
  dataSourceLatency: number
  cacheHit: boolean
}

// ============================================================================
// WEBSOCKET EVENTS
// ============================================================================

export enum ArenaPitEventType {
  TRADER_UPDATE = 'trader_update',
  PRICE_UPDATE = 'price_update',
  EPOCH_TRANSITION = 'epoch_transition',
  RANK_CHANGE = 'rank_change',
  LARGE_TRADE = 'large_trade',
  LIQUIDATION_WARNING = 'liquidation_warning',
  CONNECTION_STATUS = 'connection_status'
}

export interface TraderUpdateEvent {
  type: ArenaPitEventType.TRADER_UPDATE
  address: string
  updates: Partial<TraderState>
  timestamp: number
}

export interface PriceUpdateEvent {
  type: ArenaPitEventType.PRICE_UPDATE
  prices: GlobalPrices
  timestamp: number
}

export interface EpochTransitionEvent {
  type: ArenaPitEventType.EPOCH_TRANSITION
  fromState: EpochState
  toState: EpochState
  epoch: Epoch
  timestamp: number
}

export interface RankChangeEvent {
  type: ArenaPitEventType.RANK_CHANGE
  address: string
  oldRank: number
  newRank: number
  timestamp: number
}

export interface LargeTradeEvent {
  type: ArenaPitEventType.LARGE_TRADE
  address: string
  traderName: string
  market: PairSymbol
  side: 'long' | 'short'
  size: number
  timestamp: number
}

export interface LiquidationWarningEvent {
  type: ArenaPitEventType.LIQUIDATION_WARNING
  address: string
  traderName: string
  market: PairSymbol
  liquidationPrice: number
  currentPrice: number
  timestamp: number
}

export interface ConnectionStatusEvent {
  type: ArenaPitEventType.CONNECTION_STATUS
  status: 'connected' | 'reconnecting' | 'disconnected'
  latency?: number
  timestamp: number
}

export type ArenaPitEvent =
  | TraderUpdateEvent
  | PriceUpdateEvent
  | EpochTransitionEvent
  | RankChangeEvent
  | LargeTradeEvent
  | LiquidationWarningEvent
  | ConnectionStatusEvent

// ============================================================================
// UI STATE
// ============================================================================

export interface ArenaPitUIState {
  // View settings
  densityMode: DensityMode
  currentPage: number
  autoScrollEnabled: boolean
  autoScrollInterval: number // milliseconds

  // Selection
  selectedTrader: string | null
  expandedTrader: string | null
  highlightedTrader: string | null

  // User preferences (persistent)
  favoriteTraders: string[]

  // Connection
  isConnected: boolean
  lastReconnectTime: number | null
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline'
  latency: number

  // Data freshness
  lastUpdateTime: number
  isStale: boolean
  staleDuration: number // seconds

  // Keyboard shortcuts
  showShortcutsOverlay: boolean
}

// ============================================================================
// TOAST NOTIFICATION
// ============================================================================

export enum AlertLevel {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface ToastNotification {
  id: string
  level: AlertLevel
  message: string
  duration?: number // Auto-dismiss after ms (undefined = no auto-dismiss)
  action?: {
    label: string
    onClick: () => void
  }
}

// ============================================================================
// RECONCILIATION
// ============================================================================

export interface ReconciliationResult {
  drift: number // Percentage difference between client and server
  serverState: Partial<TraderState>
  clientState: Partial<TraderState>
  reconciled: boolean
  timestamp: number
}

export interface StateChecksum {
  hash: string
  timestamp: number
  traderCount: number
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface ArenaPitAnalytics {
  sessionDuration: number
  panelsExpanded: number
  interactionRate: number // Clicks per minute
  tradersViewed: string[]
  epochsWatched: number
  avgSessionLength: number
  returnVisits: number
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface ArenaPitConfig {
  // Timing
  epochDuration: number // 4 hours in ms
  preEpochDuration: number // 30s in ms
  cooldownDuration: number // 10s in ms

  // Updates
  priceUpdateInterval: number // 250-500ms
  stateReconciliationInterval: number // 30s

  // Performance
  maxTrackedTraders: number // 50
  maxConcurrentViewers: number // 1000
  renderBudgetMs: number // 16ms (60 FPS)

  // Grid
  defaultDensityMode: DensityMode
  defaultAutoScrollInterval: number // 60-90s

  // Thresholds
  largePnlSwingPercentage: number // 5%
  largeTradeMinSize: number // BTC equivalent
  liquidationWarningThreshold: number // 10% from liquidation

  // Connection
  maxReconnectAttempts: number
  reconnectBackoffMs: number[]
  staleDataThresholdMs: number // 60s

  // API
  apiEndpoint: string
  wsEndpoint: string
}

export const DEFAULT_ARENA_PIT_CONFIG: ArenaPitConfig = {
  epochDuration: 4 * 60 * 60 * 1000, // 4 hours
  preEpochDuration: 30 * 1000, // 30 seconds
  cooldownDuration: 10 * 1000, // 10 seconds

  priceUpdateInterval: 500, // 500ms
  stateReconciliationInterval: 30 * 1000, // 30 seconds

  maxTrackedTraders: 50,
  maxConcurrentViewers: 1000,
  renderBudgetMs: 16, // 60 FPS

  defaultDensityMode: DensityMode.BALANCED,
  defaultAutoScrollInterval: 75 * 1000, // 75 seconds

  largePnlSwingPercentage: 5,
  largeTradeMinSize: 0.5, // 0.5 BTC
  liquidationWarningThreshold: 0.1, // 10%

  maxReconnectAttempts: 5,
  reconnectBackoffMs: [2000, 4000, 8000, 16000, 32000], // Exponential backoff
  staleDataThresholdMs: 60 * 1000, // 60 seconds

  apiEndpoint: '/api/arena/pit',
  wsEndpoint: 'wss://api.molfi.com/arena/pit'
}
