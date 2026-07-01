/**
 * Global Price Bar Component
 * Top sticky bar showing live prices, epoch timer, and aggregate stats
 */

import { useEffect, useState } from 'react'
import { GlobalPrices, EpochState } from '@/types/arena-pit'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface GlobalPriceBarProps {
  prices: GlobalPrices | null
  epochState: EpochState
  timeRemaining: number
  totalPnl: number
  totalVolume: number
  totalTraders?: number
  totalBetVolume?: number
}

export function GlobalPriceBar({
  prices,
  epochState,
  timeRemaining,
  totalPnl,
  totalVolume,
  totalTraders = 0,
  totalBetVolume = 0
}: GlobalPriceBarProps) {
  const [priceFlash, setPriceFlash] = useState<{
    BTC?: 'up' | 'down'
    ETH?: 'up' | 'down'
    SOL?: 'up' | 'down'
  }>({})

  const [prevPrices, setPrevPrices] = useState<GlobalPrices | null>(null)

  useEffect(() => {
    if (!prices || !prevPrices) {
      setPrevPrices(prices)
      return
    }

    const flash: typeof priceFlash = {}
    if (prices.BTC.price > prevPrices.BTC.price) flash.BTC = 'up'
    else if (prices.BTC.price < prevPrices.BTC.price) flash.BTC = 'down'
    if (prices.ETH.price > prevPrices.ETH.price) flash.ETH = 'up'
    else if (prices.ETH.price < prevPrices.ETH.price) flash.ETH = 'down'
    if (prices.SOL.price > prevPrices.SOL.price) flash.SOL = 'up'
    else if (prices.SOL.price < prevPrices.SOL.price) flash.SOL = 'down'

    setPriceFlash(flash)
    setPrevPrices(prices)

    const timeout = setTimeout(() => setPriceFlash({}), 150)
    return () => clearTimeout(timeout)
  }, [prices])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const getEpochLabel = () => {
    switch (epochState) {
      case EpochState.PRE_EPOCH: return 'STARTING IN'
      case EpochState.ACTIVE: return 'TIME REMAINING'
      case EpochState.COOLDOWN: return 'SETTLING...'
      case EpochState.SETTLING: return 'EPOCH COMPLETE'
      default: return 'EPOCH'
    }
  }

  const formatVolume = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : ''
    if (Math.abs(value) >= 1_000_000) return `${sign}$${(value / 1_000_000).toFixed(2)}M`
    if (Math.abs(value) >= 1_000) return `${sign}$${(value / 1_000).toFixed(1)}K`
    return `${sign}$${value.toFixed(0)}`
  }

  return (
    <div className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-[72px] items-center justify-between px-6">
        {/* Left: Live Prices */}
        <div className="flex items-center gap-8">
          {prices && (
            <>
              <PriceDisplay symbol="BTC" price={prices.BTC.price} change24h={prices.BTC.change24hPercentage} flash={priceFlash.BTC} />
              <PriceDisplay symbol="ETH" price={prices.ETH.price} change24h={prices.ETH.change24hPercentage} flash={priceFlash.ETH} />
              <PriceDisplay symbol="SOL" price={prices.SOL.price} change24h={prices.SOL.change24hPercentage} flash={priceFlash.SOL} />
            </>
          )}
        </div>

        {/* Center: Epoch Timer */}
        <div className="flex flex-col items-center">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {getEpochLabel()}
          </div>
          <div
            className={cn(
              'font-mono text-4xl font-bold tabular-nums text-foreground',
              epochState === EpochState.ACTIVE && timeRemaining < 60000 && 'text-destructive'
            )}
          >
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Right: Aggregate Stats */}
        <div className="flex items-center gap-8">
          <StatDisplay label="ARENA PNL" value={formatPnl(totalPnl)} positive={totalPnl >= 0} />
          <div className="flex flex-col items-end">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">VOLUME</div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-semibold tabular-nums text-foreground">
                {formatVolume(totalVolume)}
              </span>
              {totalBetVolume > 0 && (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <span className="font-mono text-sm font-semibold text-primary">
                    {formatVolume(totalBetVolume)} Bet
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PriceDisplay({ symbol, price, change24h, flash }: { symbol: string; price: number; change24h: number; flash?: 'up' | 'down' }) {
  const isPositive = change24h >= 0
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{symbol}</span>
        <span
          className={cn(
            'font-mono text-xl font-semibold tabular-nums transition-colors duration-150 text-foreground',
            flash === 'up' && 'text-green-400',
            flash === 'down' && 'text-red-400'
          )}
        >
          ${price.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {isPositive ? <TrendingUp className="h-3 w-3 text-green-400" /> : <TrendingDown className="h-3 w-3 text-red-400" />}
        <span className={cn('text-xs font-medium tabular-nums', isPositive ? 'text-green-400' : 'text-red-400')}>
          {isPositive ? '+' : ''}{change24h.toFixed(2)}%
        </span>
      </div>
    </div>
  )
}

function StatDisplay({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex flex-col items-end">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn(
        'font-mono text-xl font-semibold tabular-nums text-foreground',
        positive === true && 'text-green-400',
        positive === false && 'text-red-400'
      )}>
        {value}
      </div>
    </div>
  )
}
