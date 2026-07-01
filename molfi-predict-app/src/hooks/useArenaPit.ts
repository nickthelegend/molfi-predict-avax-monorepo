/**
 * Arena Pit Custom Hooks
 * React hooks for managing Arena Pit state and real-time updates
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  TraderState,
  GlobalPrices,
  ArenaPitState,
  DensityMode,
  ArenaPitUIState,
  DEFAULT_ARENA_PIT_CONFIG,
  GRID_LAYOUTS
} from '@/types/arena-pit'
import {
  fetchArenaPitState,
  fetchGlobalPricesSafe,
  transformApiResponseToTraderState,
  updateTraderRankings,
  calculateAggregateStats,
  calculateTotalPnl,
  calculateStateChecksum
} from '@/services/arena-pit-aggregator'
import { epochStateMachine } from '@/services/epoch-state-machine'
import { useEpochState } from '@/services/epoch-state-machine'
import { toast } from 'sonner'

/**
 * Main Arena Pit hook - manages all state and data fetching
 */
export function useArenaPit(userAddress?: string) {
  const [traders, setTraders] = useState<TraderState[]>([])
  const [prices, setPrices] = useState<GlobalPrices | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [totalBetVolume, setTotalBetVolume] = useState(0)

  const { epoch, timeRemaining, state: epochState } = useEpochState()

  const previousRankingsRef = useRef<Map<string, number>>(new Map())

  /**
   * Fetch initial data
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch both arena state and prices in parallel
      const [arenaData, globalPrices] = await Promise.all([
        fetchArenaPitState(0, userAddress),
        fetchGlobalPricesSafe()
      ])

      // Calculate total bet volume from market data
      if (arenaData.marketData?.outcomes) {
        const betVolume = arenaData.marketData.outcomes.reduce(
          (sum: number, outcome: any) => sum + (outcome.volume || 0),
          0
        )
        setTotalBetVolume(betVolume)
      }

      // Initialize epoch if not already done
      if (!epoch) {
        epochStateMachine.initializeEpoch({
          epochId: arenaData.epochId,
          startTimestamp: arenaData.epochStartTimestamp,
          endTimestamp: arenaData.epochEndTimestamp
        })
      }

      // Transform API data to TraderState
      let transformedTraders = arenaData.traders.map((traderData, index) => {
        const previousRank = previousRankingsRef.current.get(traderData.address)
        return transformApiResponseToTraderState(
          traderData,
          globalPrices,
          index + 1,
          previousRank
        )
      })

      // Update rankings
      transformedTraders = updateTraderRankings(
        transformedTraders,
        previousRankingsRef.current
      )

      // Store current rankings for next update
      transformedTraders.forEach((trader) => {
        previousRankingsRef.current.set(trader.address, trader.currentRank)
      })

      setTraders(transformedTraders)
      setPrices(globalPrices)
      setLastUpdate(Date.now())
    } catch (err) {
      console.error('Failed to fetch arena pit data:', err)
      setError('Failed to load arena data')
      toast.error('Failed to load arena data')
    } finally {
      setLoading(false)
    }
  }, [epoch, userAddress])

  /**
   * Update prices only (lighter than full data fetch)
   */
  const updatePrices = useCallback(async () => {
    try {
      const globalPrices = await fetchGlobalPricesSafe()

      // Recalculate PnL for all traders with new prices
      setTraders((prevTraders) =>
        prevTraders.map((trader) => {
          const totalPnl = calculateTotalPnl(trader.exposure, globalPrices)
          const totalEquity = trader.unusedBalance + totalPnl
          const totalPnlPercentage =
            trader.unusedBalance > 0 ? (totalPnl / trader.unusedBalance) * 100 : 0

          return {
            ...trader,
            totalPnl,
            totalEquity,
            totalPnlPercentage,
            lastUpdateTimestamp: Date.now()
          }
        })
      )

      setPrices(globalPrices)
      setLastUpdate(Date.now())
    } catch (err) {
      console.error('Failed to update prices:', err)
    }
  }, [])

  /**
   * Initial fetch on mount
   */
  useEffect(() => {
    fetchData()
  }, [fetchData])

  /**
   * Set up price update interval (every 500ms)
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      updatePrices()
    }, DEFAULT_ARENA_PIT_CONFIG.priceUpdateInterval)

    return () => clearInterval(intervalId)
  }, [updatePrices])

  /**
   * Set up full state reconciliation (every 30s)
   */
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchData() // Full refetch to reconcile state
    }, DEFAULT_ARENA_PIT_CONFIG.stateReconciliationInterval)

    return () => clearInterval(intervalId)
  }, [fetchData])

  /**
   * Calculate aggregate stats
   */
  const aggregateStats = useMemo(() => calculateAggregateStats(traders), [traders])

  /**
   * Refresh data manually
   */
  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    traders,
    prices,
    loading,
    error,
    lastUpdate,
    epoch,
    timeRemaining,
    epochState,
    aggregateStats,
    totalBetVolume,
    refresh
  }
}

/**
 * Hook for managing UI state (pagination, density mode, etc.)
 */
export function useArenaPitUI(totalTraders: number) {
  const [densityMode, setDensityMode] = useState<DensityMode>(DensityMode.BALANCED)
  const [currentPage, setCurrentPage] = useState(0)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false)
  const [selectedTrader, setSelectedTrader] = useState<string | null>(null)
  const [expandedTrader, setExpandedTrader] = useState<string | null>(null)
  const [highlightedTrader, setHighlightedTrader] = useState<string | null>(null)
  const [favoriteTraders, setFavoriteTraders] = useState<string[]>([])
  const [showShortcutsOverlay, setShowShortcutsOverlay] = useState(false)

  const layout = GRID_LAYOUTS[densityMode]
  const totalPages = Math.ceil(totalTraders / layout.visiblePanels)

  /**
   * Auto-scroll logic
   */
  useEffect(() => {
    if (!autoScrollEnabled) return

    const intervalId = setInterval(() => {
      setCurrentPage((prev) => {
        const next = prev + 1
        return next >= totalPages ? 0 : next
      })
    }, DEFAULT_ARENA_PIT_CONFIG.defaultAutoScrollInterval)

    return () => clearInterval(intervalId)
  }, [autoScrollEnabled, totalPages])

  /**
   * Navigate to specific page
   */
  const goToPage = useCallback(
    (page: number) => {
      if (page >= 0 && page < totalPages) {
        setCurrentPage(page)
        setAutoScrollEnabled(false) // Disable auto-scroll on manual navigation
      }
    },
    [totalPages]
  )

  /**
   * Navigate to next page
   */
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  /**
   * Navigate to previous page
   */
  const previousPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  /**
   * Jump to trader (find their page and highlight)
   */
  const jumpToTrader = useCallback(
    (traderAddress: string, traderRank: number) => {
      const traderIndex = traderRank - 1
      const page = Math.floor(traderIndex / layout.visiblePanels)
      setCurrentPage(page)
      setHighlightedTrader(traderAddress)

      // Clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedTrader(null)
      }, 3000)
    },
    [layout.visiblePanels]
  )

  /**
   * Toggle favorite trader
   */
  const toggleFavorite = useCallback((traderAddress: string) => {
    setFavoriteTraders((prev) => {
      if (prev.includes(traderAddress)) {
        return prev.filter((addr) => addr !== traderAddress)
      } else {
        return [...prev, traderAddress]
      }
    })
  }, [])

  /**
   * Expand trader panel
   */
  const expandTrader = useCallback((traderAddress: string | null) => {
    setExpandedTrader(traderAddress)
  }, [])

  /**
   * Toggle density mode
   */
  const toggleDensityMode = useCallback(() => {
    setDensityMode((prev) => {
      if (prev === DensityMode.COMPACT) return DensityMode.BALANCED
      if (prev === DensityMode.BALANCED) return DensityMode.DETAILED
      return DensityMode.COMPACT
    })
    setCurrentPage(0) // Reset to first page when changing layout
  }, [])

  /**
   * Get visible traders for current page
   */
  const getVisibleTraders = useCallback(
    (allTraders: TraderState[]) => {
      const start = currentPage * layout.visiblePanels
      const end = start + layout.visiblePanels
      return allTraders.slice(start, end)
    },
    [currentPage, layout.visiblePanels]
  )

  return {
    densityMode,
    setDensityMode,
    currentPage,
    totalPages,
    autoScrollEnabled,
    setAutoScrollEnabled,
    selectedTrader,
    setSelectedTrader,
    expandedTrader,
    expandTrader,
    highlightedTrader,
    favoriteTraders,
    toggleFavorite,
    showShortcutsOverlay,
    setShowShortcutsOverlay,
    layout,
    goToPage,
    nextPage,
    previousPage,
    jumpToTrader,
    toggleDensityMode,
    getVisibleTraders
  }
}

/**
 * Hook for keyboard shortcuts
 */
export function useArenaPitKeyboard(ui: ReturnType<typeof useArenaPitUI>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      switch (event.key) {
        case ' ':
          event.preventDefault()
          ui.setAutoScrollEnabled((prev) => !prev)
          toast.info(ui.autoScrollEnabled ? 'Auto-scroll paused' : 'Auto-scroll resumed')
          break

        case 'ArrowLeft':
          event.preventDefault()
          ui.previousPage()
          break

        case 'ArrowRight':
          event.preventDefault()
          ui.nextPage()
          break

        case 'Escape':
          event.preventDefault()
          ui.expandTrader(null)
          ui.setShowShortcutsOverlay(false)
          break

        case 'd':
        case 'D':
          event.preventDefault()
          ui.toggleDensityMode()
          break

        case '?':
          event.preventDefault()
          ui.setShowShortcutsOverlay((prev) => !prev)
          break

        case 'f':
        case 'F':
          event.preventDefault()
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
          } else {
            document.exitFullscreen()
          }
          break

        // Jump to rank 1-9
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          event.preventDefault()
          const rank = parseInt(event.key)
          // Would need trader data here to jump to specific trader
          break

        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ui])
}

/**
 * Hook for connection status
 */
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true)
  const [latency, setLatency] = useState(0)
  const [quality, setQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>(
    'excellent'
  )

  useEffect(() => {
    // Monitor connection by tracking fetch response times
    const checkConnection = async () => {
      const start = Date.now()
      try {
        await fetch('/api/health', { method: 'HEAD' })
        const responseTime = Date.now() - start
        setLatency(responseTime)
        setIsConnected(true)

        // Determine quality based on latency
        if (responseTime < 100) setQuality('excellent')
        else if (responseTime < 300) setQuality('good')
        else setQuality('poor')
      } catch {
        setIsConnected(false)
        setQuality('offline')
      }
    }

    // Check every 5 seconds
    const intervalId = setInterval(checkConnection, 5000)
    checkConnection() // Initial check

    return () => clearInterval(intervalId)
  }, [])

  return { isConnected, latency, quality }
}
