/**
 * Arena Pit Page
 * Live trading competition interface with 50 traders, 12 per page
 */

import { useMemo } from 'react'
import { LeaderboardSidebar } from '@/components/arena/pit/LeaderboardSidebar'
import { TraderPanel } from '@/components/arena/pit/TraderPanel'
import { ExpandedPanel } from '@/components/arena/pit/ExpandedPanel'
import { useArenaPit, useArenaPitUI, useArenaPitKeyboard } from '@/hooks/useArenaPit'
import { useWallet } from '@/hooks/useWallet'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Keyboard } from 'lucide-react'
import Header from '@/components/Header'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const PANELS_PER_PAGE = 16

export default function ArenaPit() {
  const { address: userAddress } = useWallet()

  const {
    traders,
    prices,
    loading,
    error,
    epoch,
    timeRemaining,
    epochState,
    aggregateStats,
    totalBetVolume,
    refresh
  } = useArenaPit(userAddress)

  const ui = useArenaPitUI(traders.length)
  useArenaPitKeyboard(ui)

  const totalPages = Math.ceil(traders.length / PANELS_PER_PAGE)
  const visibleTraders = useMemo(() => {
    const start = ui.currentPage * PANELS_PER_PAGE
    return traders.slice(start, start + PANELS_PER_PAGE)
  }, [traders, ui.currentPage])

  const handleTraderClick = (address: string) => ui.expandTrader(address)
  const handleLeaderboardClick = (address: string, rank: number) => ui.jumpToTrader(address, rank)

  const expandedTrader = traders.find((t) => t.address === ui.expandedTrader) || null

  if (loading && traders.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading Arena Pit...</p>
        </div>
      </div>
    )
  }

  if (error && traders.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={refresh} variant="outline">Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Header />

      {/* Price bar removed */}

      {/* Main area: sidebar + grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* Leaderboard Sidebar */}
        <div className="w-[280px] flex-shrink-0 border-r border-border bg-card overflow-hidden flex flex-col">
          <div className="flex h-10 items-center justify-between border-b border-border px-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rankings</h2>
            <span className="text-yellow-400 text-sm">🏆</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-0.5 p-2">
              {[...traders].sort((a, b) => a.currentRank - b.currentRank).map((trader) => (
                <LeaderboardEntry
                  key={trader.address}
                  trader={trader}
                  isSelected={trader.address === ui.selectedTrader}
                  isHighlighted={trader.address === ui.highlightedTrader}
                  onClick={() => handleLeaderboardClick(trader.address, trader.currentRank)}
                  totalTraders={traders.length}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden p-3">
          {/* Top Controls */}
          <div className="mb-2 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-foreground">Arena Pit</h1>
              <span className="text-xs text-muted-foreground">
                {traders.length} traders • Page {ui.currentPage + 1}/{totalPages}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refresh}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => ui.setShowShortcutsOverlay(true)}>
                <Keyboard className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Trader Grid - 4 columns, 4 rows */}
          <div className="grid flex-1 grid-cols-4 grid-rows-4 gap-1.5 min-h-0">
            {visibleTraders.map((trader) => (
              <TraderPanel
                key={trader.address}
                trader={trader}
                prices={prices!}
                isHighlighted={trader.address === ui.highlightedTrader}
                onClick={() => handleTraderClick(trader.address)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-center gap-3 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => ui.goToPage(ui.currentPage - 1)}
                disabled={ui.currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => ui.goToPage(i)}
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded text-xs font-medium transition-colors',
                      i === ui.currentPage
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => ui.goToPage(ui.currentPage + 1)}
                disabled={ui.currentPage === totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Panel Modal */}
      {prices && (
        <ExpandedPanel
          trader={expandedTrader}
          prices={prices}
          epoch={epoch}
          onClose={() => ui.expandTrader(null)}
          onTradeClick={undefined}
          onTraderSwitch={(address) => ui.expandTrader(address)}
          topContenders={traders.slice(0, 10)}
          userBalance={100}
        />
      )}

      {/* Keyboard Shortcuts Overlay */}
      {ui.showShortcutsOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => ui.setShowShortcutsOverlay(false)}
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              <ShortcutRow keys="← →" description="Navigate pages" />
              <ShortcutRow keys="1-9" description="Jump to rank" />
              <ShortcutRow keys="F" description="Toggle fullscreen" />
              <ShortcutRow keys="Esc" description="Close panels/overlays" />
              <ShortcutRow keys="?" description="Show/hide this help" />
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={() => ui.setShowShortcutsOverlay(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ShortcutRow({ keys, description }: { keys: string; description: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-foreground">{keys}</kbd>
      <span className="text-muted-foreground">{description}</span>
    </div>
  )
}

// Inline leaderboard entry since we removed the external sidebar component dependency
import { TraderState, getPerformanceBadge, getPerformanceBand } from '@/types/arena-pit'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { TraderAvatar } from '@/components/arena/pit/TraderAvatar'
import { MiniSparkline, generateSparkline } from '@/components/arena/pit/TraderPanel'

/** Generate a deterministic win/loss streak from trader name */
function getStreak(trader: TraderState): { type: 'W' | 'L'; count: number } {
  let seed = 0
  for (let i = 0; i < trader.name.length; i++) seed = ((seed << 5) - seed + trader.name.charCodeAt(i)) | 0
  const rng = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 0x7fffffff }
  const isWinStreak = trader.totalPnl >= 0
  const count = Math.floor(1 + rng() * (isWinStreak ? 5 : 3))
  return { type: isWinStreak ? 'W' : 'L', count }
}

function LeaderboardEntry({ trader, isSelected, isHighlighted, onClick, totalTraders }: {
  trader: TraderState; isSelected: boolean; isHighlighted: boolean; onClick: () => void; totalTraders: number
}) {
  const band = getPerformanceBand(trader.currentRank, totalTraders)
  const streak = getStreak(trader)
  const sparklineData = generateSparkline(trader.name, trader.totalPnl)

  const formatPnl = (value: number) => `${value >= 0 ? '+' : ''}$${value.toFixed(2)}`

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative w-full rounded-lg border p-2 text-left transition-all duration-200',
        'hover:bg-accent/50',
        isSelected && 'border-primary/60 bg-primary/10',
        isHighlighted && 'animate-pulse border-yellow-500/60 bg-yellow-500/10',
        !isSelected && !isHighlighted && 'border-border',
        band === 'top' && !isSelected && !isHighlighted && 'border-green-500/20',
      )}
    >
      {/* Row 1: Avatar + Name + Rank */}
      <div className="flex items-center gap-1.5 mb-1">
        <TraderAvatar name={trader.name} size="sm" />
        <div className={cn(
          'flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold flex-shrink-0',
          trader.currentRank <= 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-muted text-muted-foreground'
        )}>
          {trader.currentRank <= 3 ? ['🥇','🥈','🥉'][trader.currentRank-1] : trader.currentRank}
        </div>
        <span className="text-[11px] font-medium text-foreground truncate flex-1">{trader.name}</span>
        {trader.isLive && <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400 flex-shrink-0" />}
      </div>

      {/* Row 2: PnL + Sparkline */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={cn('font-mono text-xs font-bold tabular-nums', trader.totalPnl >= 0 ? 'text-green-400' : 'text-red-400')}>
            {formatPnl(trader.totalPnl)}
          </span>
          <span className={cn(
            'text-[9px] font-bold px-1 py-px rounded',
            streak.type === 'W' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
          )}>
            {streak.count}{streak.type}
          </span>
        </div>
        <MiniSparkline data={sparklineData} positive={trader.totalPnl >= 0} width={40} height={14} />
      </div>
    </button>
  )
}
