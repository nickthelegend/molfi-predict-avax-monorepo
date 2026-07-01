/**
 * Expanded Panel Component
 * Modal overlay showing trader trade history + prediction market betting
 */

import { TraderState, GlobalPrices, PairSymbol, Epoch } from '@/types/arena-pit'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useState, useMemo } from 'react'
import { TraderAvatar } from './TraderAvatar'

interface ExpandedPanelProps {
  trader: TraderState | null
  prices: GlobalPrices
  epoch: Epoch | null
  onClose: () => void
  onTradeClick?: (pair: PairSymbol) => void
  onTraderSwitch?: (address: string) => void
  topContenders?: TraderState[]
  userBalance?: number
}

// Generate deterministic mock trade history from trader data
interface TradeEntry {
  id: string
  timestamp: number
  pair: PairSymbol
  side: 'Long' | 'Short'
  size: number
  entryPrice: number
  exitPrice: number | null
  pnl: number
  status: 'Open' | 'Closed'
}

function generateMockTradeHistory(trader: TraderState, prices: GlobalPrices): TradeEntry[] {
  const trades: TradeEntry[] = []
  const now = Date.now()
  const pairs: PairSymbol[] = ['BTC', 'ETH', 'SOL']

  // Seed from trader name for determinism
  let seed = 0
  for (let i = 0; i < trader.name.length; i++) {
    seed = ((seed << 5) - seed + trader.name.charCodeAt(i)) | 0
  }
  const rng = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed & 0x7fffffff) / 0x7fffffff
  }

  const tradeCount = Math.max(3, trader.epochTradeCount)

  // Fallback prices if live prices are 0
  const safePrices: Record<PairSymbol, number> = {
    BTC: prices.BTC.price > 0 ? prices.BTC.price : 99850,
    ETH: prices.ETH.price > 0 ? prices.ETH.price : 3620,
    SOL: prices.SOL.price > 0 ? prices.SOL.price : 212,
  }

  for (let i = 0; i < tradeCount; i++) {
    const pair = pairs[Math.floor(rng() * 3)]
    const isLong = rng() > 0.45
    const currentPrice = safePrices[pair]
    const entryOffset = (rng() - 0.5) * 0.04
    const entryPrice = currentPrice * (1 + entryOffset)
    const isClosed = rng() > 0.3
    const exitOffset = (rng() - 0.45) * 0.03
    const exitPrice = isClosed ? currentPrice * (1 + exitOffset) : null

    // Notional $5-$30 relative to $100 account, then convert to base units
    const notional = 5 + rng() * 25
    const size = notional / entryPrice

    let pnl = 0
    if (isClosed && exitPrice) {
      pnl = isLong
        ? size * (exitPrice - entryPrice)
        : size * (entryPrice - exitPrice)
    } else {
      pnl = isLong
        ? size * (currentPrice - entryPrice)
        : size * (entryPrice - currentPrice)
    }

    trades.push({
      id: `${trader.address}-${i}`,
      timestamp: now - (tradeCount - i) * (3600000 + rng() * 7200000),
      pair,
      side: isLong ? 'Long' : 'Short',
      size: Math.round(size * 1e6) / 1e6,
      entryPrice: Math.round(entryPrice * 100) / 100,
      exitPrice: exitPrice ? Math.round(exitPrice * 100) / 100 : null,
      pnl: Math.round(pnl * 100) / 100,
      status: isClosed ? 'Closed' : 'Open'
    })
  }

  return trades.sort((a, b) => b.timestamp - a.timestamp)
}

export function ExpandedPanel({
  trader, prices, epoch, onClose, onTraderSwitch, topContenders = [], userBalance = 0
}: ExpandedPanelProps) {
  const [betSide, setBetSide] = useState<'YES' | 'NO'>('YES')
  const [betAmount, setBetAmount] = useState('')

  const tradeHistory = useMemo(
    () => (trader ? generateMockTradeHistory(trader, prices) : []),
    [trader, prices]
  )

  if (!trader) return null

  const formatPnl = (value: number) => `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`
  const formatPrice = (value: number) =>
    value >= 1000 ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `$${value.toFixed(2)}`

  const marketData = trader.marketData || {
    probability: 0.08 + Math.random() * 0.3,
    yesPrice: 0.15,
    noPrice: 0.85,
    volume: Math.random() * 500,
    oddsChange: (Math.random() - 0.5) * 10,
    marketId: 'mock',
    outcomeIndex: 0,
  }

  const betAmountNum = Number(betAmount) || 0
  const currentPrice = betSide === 'YES' ? marketData.yesPrice : marketData.noPrice
  const calculatedShares = betAmountNum > 0 ? betAmountNum / currentPrice : 0
  const potentialProfit = betAmountNum > 0
    ? (betSide === 'YES' ? calculatedShares * (1 - marketData.yesPrice) : calculatedShares * (1 - marketData.noPrice))
    : 0

  const openTrades = tradeHistory.filter(t => t.status === 'Open')
  const closedTrades = tradeHistory.filter(t => t.status === 'Closed')
  const totalRealizedPnl = closedTrades.reduce((s, t) => s + t.pnl, 0)

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <Dialog open={!!trader} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 bg-card border-border overflow-hidden [&>button]:z-10">
        {/* Fixed Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <TraderAvatar name={trader.name} size="md" className="h-10 w-10 text-sm" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold text-foreground">{trader.name}</DialogTitle>
              <div className="flex items-center gap-3 mt-1 text-sm">
                <span className="text-muted-foreground">Rank #{trader.currentRank}</span>
                <span className={cn('font-mono font-semibold', trader.totalPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {formatPnl(trader.totalPnl)}
                </span>
                <span className="text-muted-foreground">Equity: ${trader.totalEquity.toFixed(2)}</span>
                {trader.isLive && (
                  <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-400 text-[10px] px-1.5 py-0">
                    <div className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" /> Live
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-5 space-y-5">

            {/* Quick Stats Row */}
            <div className="grid grid-cols-4 gap-3">
              <StatBox label="Trades" value={trader.epochTradeCount.toString()} />
              <StatBox label="Volume" value={`$${trader.epochVolume.toFixed(0)}`} />
              <StatBox label="Leverage" value={`${trader.leverage.toFixed(1)}x`} highlight={trader.leverage > 5} />
              <StatBox label="Realized" value={formatPnl(totalRealizedPnl)} pnl={totalRealizedPnl} />
            </div>

            {/* Open Positions */}
            {openTrades.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Open Positions ({openTrades.length})
                </h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground">
                        <th className="text-left p-2 font-medium">Pair</th>
                        <th className="text-left p-2 font-medium">Side</th>
                        <th className="text-right p-2 font-medium">Size</th>
                        <th className="text-right p-2 font-medium">Entry</th>
                        <th className="text-right p-2 font-medium">Current</th>
                        <th className="text-right p-2 font-medium">uPnL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openTrades.map((trade) => (
                        <tr key={trade.id} className="border-t border-border">
                          <td className="p-2 font-medium text-foreground">{trade.pair}/USD</td>
                          <td className="p-2">
                            <span className={cn('font-semibold', trade.side === 'Long' ? 'text-green-400' : 'text-red-400')}>
                              {trade.side}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono text-foreground">{trade.size.toFixed(5)}</td>
                          <td className="p-2 text-right font-mono text-muted-foreground">{formatPrice(trade.entryPrice)}</td>
                          <td className="p-2 text-right font-mono text-foreground">{formatPrice(prices[trade.pair].price)}</td>
                          <td className={cn('p-2 text-right font-mono font-semibold', trade.pnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                            {formatPnl(trade.pnl)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Trade History */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Trade History ({closedTrades.length})
              </h3>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      <th className="text-left p-2 font-medium">Time</th>
                      <th className="text-left p-2 font-medium">Pair</th>
                      <th className="text-left p-2 font-medium">Side</th>
                      <th className="text-right p-2 font-medium">Entry</th>
                      <th className="text-right p-2 font-medium">Exit</th>
                      <th className="text-right p-2 font-medium">PnL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedTrades.map((trade) => (
                      <tr key={trade.id} className="border-t border-border">
                        <td className="p-2 text-muted-foreground whitespace-nowrap">{formatTime(trade.timestamp)}</td>
                        <td className="p-2 font-medium text-foreground">{trade.pair}</td>
                        <td className="p-2">
                          <span className={cn('font-semibold', trade.side === 'Long' ? 'text-green-400' : 'text-red-400')}>
                            {trade.side}
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono text-muted-foreground">{formatPrice(trade.entryPrice)}</td>
                        <td className="p-2 text-right font-mono text-foreground">{formatPrice(trade.exitPrice!)}</td>
                        <td className={cn('p-2 text-right font-mono font-semibold', trade.pnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                          {formatPnl(trade.pnl)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prediction Market */}
            <div className="border-t border-border pt-5 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">🎯 Prediction Market</h3>
                <p className="text-xs text-muted-foreground">Will {trader.name} finish in Top 3?</p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground">Win probability</span>
                <span className="text-xl font-bold text-foreground font-mono">{(marketData.probability * 100).toFixed(1)}%</span>
              </div>

              {/* Bet Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setBetSide('YES')}
                  variant={betSide === 'YES' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('h-10 font-semibold', betSide === 'YES' && 'bg-green-600 hover:bg-green-700 text-white')}
                >
                  YES — ${marketData.yesPrice.toFixed(2)}
                </Button>
                <Button
                  onClick={() => setBetSide('NO')}
                  variant={betSide === 'NO' ? 'default' : 'outline'}
                  size="sm"
                  className={cn('h-10 font-semibold', betSide === 'NO' && 'bg-red-600 hover:bg-red-700 text-white')}
                >
                  NO — ${marketData.noPrice.toFixed(2)}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Amount (USDC)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="font-mono h-9"
                />
                {betAmountNum > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>~{calculatedShares.toFixed(1)} shares</span>
                    <span className="text-green-400 font-mono">Potential: +${potentialProfit.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Button
                disabled={!betAmount || betAmountNum <= 0}
                className="w-full h-9 font-semibold"
              >
                Place Bet →
              </Button>
            </div>

            {/* Top Contenders */}
            {topContenders.length > 0 && (
              <div className="border-t border-border pt-4 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Other Top Traders</h4>
                <div className="flex flex-wrap gap-1.5">
                  {topContenders.slice(0, 5).filter(c => c.address !== trader.address).map((c) => (
                    <button
                      key={c.address}
                      onClick={() => onTraderSwitch?.(c.address)}
                      className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs hover:bg-muted transition"
                    >
                      <TraderAvatar name={c.name} size="sm" className="h-4 w-4 text-[7px]" />
                      <span className="text-muted-foreground">#{c.currentRank}</span>
                      <span className="text-foreground font-medium">{c.name}</span>
                      <span className={cn('font-mono', c.totalPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {formatPnl(c.totalPnl)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatBox({ label, value, pnl, highlight }: { label: string; value: string; pnl?: number; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-2.5 text-center">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={cn(
        'mt-0.5 font-mono text-sm font-bold',
        pnl !== undefined ? (pnl >= 0 ? 'text-green-400' : 'text-red-400') : highlight ? 'text-orange-400' : 'text-foreground'
      )}>
        {value}
      </div>
    </div>
  )
}
