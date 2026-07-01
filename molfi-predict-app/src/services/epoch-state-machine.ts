/**
 * Epoch State Machine
 * Manages deterministic epoch transitions:
 * PRE_EPOCH → ACTIVE → COOLDOWN → SETTLING → PRE_EPOCH (next)
 */

import { Epoch, EpochState, TraderRank, DEFAULT_ARENA_PIT_CONFIG } from '@/types/arena-pit'
import { clockSync } from './clock-sync'

type EpochTransitionCallback = (fromState: EpochState, toState: EpochState, epoch: Epoch) => void
type EpochEventCallback = (event: EpochEvent) => void

interface EpochEvent {
  type: 'warning' | 'transition' | 'tick'
  state: EpochState
  timeRemaining: number
  epoch: Epoch
}

class EpochStateMachine {
  private currentEpoch: Epoch | null = null
  private transitionCallbacks: EpochTransitionCallback[] = []
  private eventCallbacks: EpochEventCallback[] = []
  private tickInterval: NodeJS.Timeout | null = null
  private lastWarningTime: number = 0

  constructor() {
    this.startTicker()
  }

  /**
   * Initialize epoch from backend data
   */
  initializeEpoch(data: {
    epochId: string
    startTimestamp: number
    endTimestamp: number
    lockedRanking?: string[]
  }): Epoch {
    const serverTime = clockSync.getServerTime()
    const timeRemaining = data.endTimestamp - serverTime

    let state: EpochState

    // Determine current state based on timestamps
    if (serverTime < data.startTimestamp - DEFAULT_ARENA_PIT_CONFIG.preEpochDuration) {
      // Too early, shouldn't happen
      state = EpochState.PRE_EPOCH
    } else if (serverTime < data.startTimestamp) {
      state = EpochState.PRE_EPOCH
    } else if (serverTime < data.endTimestamp) {
      state = EpochState.ACTIVE
    } else if (serverTime < data.endTimestamp + DEFAULT_ARENA_PIT_CONFIG.cooldownDuration) {
      state = EpochState.COOLDOWN
    } else {
      state = EpochState.SETTLING
    }

    this.currentEpoch = {
      id: data.epochId,
      startTimestamp: data.startTimestamp,
      endTimestamp: data.endTimestamp,
      duration: data.endTimestamp - data.startTimestamp,
      state,
      lockedRanking: data.lockedRanking || []
    }

    return this.currentEpoch
  }

  /**
   * Get current epoch
   */
  getCurrentEpoch(): Epoch | null {
    return this.currentEpoch
  }

  /**
   * Get time remaining in current state
   */
  getTimeRemaining(): number {
    if (!this.currentEpoch) return 0

    const serverTime = clockSync.getServerTime()

    switch (this.currentEpoch.state) {
      case EpochState.PRE_EPOCH:
        return Math.max(0, this.currentEpoch.startTimestamp - serverTime)

      case EpochState.ACTIVE:
        return Math.max(0, this.currentEpoch.endTimestamp - serverTime)

      case EpochState.COOLDOWN:
        return Math.max(
          0,
          this.currentEpoch.endTimestamp +
            DEFAULT_ARENA_PIT_CONFIG.cooldownDuration -
            serverTime
        )

      case EpochState.SETTLING:
        // Indefinite until backend provides new epoch
        return 0

      default:
        return 0
    }
  }

  /**
   * Check and transition states
   */
  private checkTransitions(): void {
    if (!this.currentEpoch) return

    const serverTime = clockSync.getServerTime()
    const currentState = this.currentEpoch.state
    let newState: EpochState | null = null

    switch (currentState) {
      case EpochState.PRE_EPOCH:
        if (serverTime >= this.currentEpoch.startTimestamp) {
          newState = EpochState.ACTIVE
        }
        break

      case EpochState.ACTIVE:
        // Check for 30s warning
        const timeUntilEnd = this.currentEpoch.endTimestamp - serverTime
        if (timeUntilEnd <= 30000 && timeUntilEnd > 29000) {
          if (serverTime - this.lastWarningTime > 5000) {
            // Avoid spamming warnings
            this.emitEvent({
              type: 'warning',
              state: currentState,
              timeRemaining: timeUntilEnd,
              epoch: this.currentEpoch
            })
            this.lastWarningTime = serverTime
          }
        }

        if (serverTime >= this.currentEpoch.endTimestamp) {
          newState = EpochState.COOLDOWN
        }
        break

      case EpochState.COOLDOWN:
        const cooldownEnd =
          this.currentEpoch.endTimestamp + DEFAULT_ARENA_PIT_CONFIG.cooldownDuration
        if (serverTime >= cooldownEnd) {
          newState = EpochState.SETTLING
        }
        break

      case EpochState.SETTLING:
        // Stay in settling until backend provides new epoch
        // (handled by initializeEpoch from external source)
        break
    }

    if (newState && newState !== currentState) {
      this.transition(newState)
    }
  }

  /**
   * Transition to new state
   */
  private transition(newState: EpochState): void {
    if (!this.currentEpoch) return

    const oldState = this.currentEpoch.state
    this.currentEpoch.state = newState

    console.log(`[EpochStateMachine] Transition: ${oldState} → ${newState}`)

    // Emit transition event
    this.transitionCallbacks.forEach((callback) => {
      try {
        callback(oldState, newState, this.currentEpoch!)
      } catch (error) {
        console.error('Error in transition callback:', error)
      }
    })

    this.emitEvent({
      type: 'transition',
      state: newState,
      timeRemaining: this.getTimeRemaining(),
      epoch: this.currentEpoch
    })
  }

  /**
   * Emit epoch event
   */
  private emitEvent(event: EpochEvent): void {
    this.eventCallbacks.forEach((callback) => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in event callback:', error)
      }
    })
  }

  /**
   * Start ticker (checks transitions every second)
   */
  private startTicker(): void {
    if (this.tickInterval) return

    this.tickInterval = setInterval(() => {
      this.checkTransitions()

      // Emit tick event
      if (this.currentEpoch) {
        this.emitEvent({
          type: 'tick',
          state: this.currentEpoch.state,
          timeRemaining: this.getTimeRemaining(),
          epoch: this.currentEpoch
        })
      }
    }, 1000) // Check every second
  }

  /**
   * Stop ticker
   */
  private stopTicker(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval)
      this.tickInterval = null
    }
  }

  /**
   * Subscribe to state transitions
   */
  onTransition(callback: EpochTransitionCallback): () => void {
    this.transitionCallbacks.push(callback)
    return () => {
      const index = this.transitionCallbacks.indexOf(callback)
      if (index > -1) {
        this.transitionCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Subscribe to epoch events
   */
  onEvent(callback: EpochEventCallback): () => void {
    this.eventCallbacks.push(callback)
    return () => {
      const index = this.eventCallbacks.indexOf(callback)
      if (index > -1) {
        this.eventCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Manually refresh ranking order (for "Refresh Order" button)
   */
  refreshRankingOrder(newRanking: string[]): void {
    if (this.currentEpoch) {
      this.currentEpoch.lockedRanking = newRanking
      console.log('[EpochStateMachine] Ranking order refreshed')
    }
  }

  /**
   * Set final ranking (when epoch settles)
   */
  setFinalRanking(finalRanking: TraderRank[]): void {
    if (this.currentEpoch) {
      this.currentEpoch.finalRanking = finalRanking
      console.log('[EpochStateMachine] Final ranking set:', finalRanking)
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopTicker()
    this.transitionCallbacks = []
    this.eventCallbacks = []
    this.currentEpoch = null
  }
}

// Singleton instance
export const epochStateMachine = new EpochStateMachine()

// React hook for epoch state
import { useState, useEffect } from 'react'

export function useEpochState() {
  const [epoch, setEpoch] = useState<Epoch | null>(epochStateMachine.getCurrentEpoch())
  const [timeRemaining, setTimeRemaining] = useState(epochStateMachine.getTimeRemaining())

  useEffect(() => {
    // Subscribe to transitions
    const unsubscribeTransition = epochStateMachine.onTransition(() => {
      setEpoch({ ...epochStateMachine.getCurrentEpoch()! })
    })

    // Subscribe to events (for time updates)
    const unsubscribeEvent = epochStateMachine.onEvent((event) => {
      if (event.type === 'tick') {
        setTimeRemaining(event.timeRemaining)
      }
    })

    return () => {
      unsubscribeTransition()
      unsubscribeEvent()
    }
  }, [])

  return {
    epoch,
    timeRemaining,
    state: epoch?.state || EpochState.PRE_EPOCH,
    isActive: epoch?.state === EpochState.ACTIVE,
    isSettling: epoch?.state === EpochState.SETTLING,
    isCooldown: epoch?.state === EpochState.COOLDOWN,
    isPreEpoch: epoch?.state === EpochState.PRE_EPOCH,
    refreshRankingOrder: (newRanking: string[]) =>
      epochStateMachine.refreshRankingOrder(newRanking)
  }
}
