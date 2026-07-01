/**
 * Clock Synchronization Service
 * NTP-style clock sync for fair epoch timing across all clients
 */

interface ClockSyncResult {
  serverTime: number
  offset: number
  roundTripTime: number
  timestamp: number
}

class ClockSyncService {
  private offset: number = 0
  private lastSync: number = 0
  private syncInterval: number = 60000 // Re-sync every minute
  private syncInProgress: boolean = false

  /**
   * Synchronize with server time
   */
  async sync(): Promise<ClockSyncResult> {
    if (this.syncInProgress) {
      // Return cached result if sync in progress
      return {
        serverTime: this.getServerTime(),
        offset: this.offset,
        roundTripTime: 0,
        timestamp: this.lastSync
      }
    }

    this.syncInProgress = true

    try {
      const clientSendTime = Date.now()

      // Call server time endpoint
      const response = await fetch('/api/arena/time', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const clientReceiveTime = Date.now()

      if (!response.ok) {
        throw new Error('Failed to sync time with server')
      }

      const data = await response.json()
      const serverTime = data.serverTime

      // Compute offset using NTP algorithm
      // offset = serverTime - (clientSendTime + clientReceiveTime) / 2
      const roundTripTime = clientReceiveTime - clientSendTime
      const estimatedServerReceiveTime = clientSendTime + (roundTripTime / 2)
      this.offset = serverTime - estimatedServerReceiveTime

      this.lastSync = Date.now()

      return {
        serverTime,
        offset: this.offset,
        roundTripTime,
        timestamp: this.lastSync
      }
    } catch (error) {
      console.error('Clock sync failed:', error)
      // If sync fails, assume no offset (use client time)
      return {
        serverTime: Date.now(),
        offset: this.offset, // Keep previous offset if available
        roundTripTime: 0,
        timestamp: this.lastSync
      }
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Get current server time (client time + offset)
   */
  getServerTime(): number {
    return Date.now() + this.offset
  }

  /**
   * Get time until next epoch event
   */
  getTimeUntil(targetTimestamp: number): number {
    const serverTime = this.getServerTime()
    return Math.max(0, targetTimestamp - serverTime)
  }

  /**
   * Format time remaining as HH:MM:SS
   */
  formatTimeRemaining(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  /**
   * Check if we need to re-sync
   */
  needsSync(): boolean {
    const timeSinceLastSync = Date.now() - this.lastSync
    return timeSinceLastSync > this.syncInterval || this.lastSync === 0
  }

  /**
   * Get offset for debugging
   */
  getOffset(): number {
    return this.offset
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): number {
    return this.lastSync
  }

  /**
   * Auto-sync loop (call this on component mount)
   */
  startAutoSync(): () => void {
    // Initial sync
    this.sync()

    // Set up interval
    const intervalId = setInterval(() => {
      if (this.needsSync()) {
        this.sync()
      }
    }, 10000) // Check every 10 seconds

    // Return cleanup function
    return () => clearInterval(intervalId)
  }
}

// Singleton instance
export const clockSync = new ClockSyncService()

// React hook for clock sync
export function useClockSync() {
  const [serverTime, setServerTime] = React.useState(clockSync.getServerTime())
  const [offset, setOffset] = React.useState(clockSync.getOffset())
  const [lastSync, setLastSync] = React.useState(clockSync.getLastSyncTime())

  React.useEffect(() => {
    // Start auto-sync
    const cleanup = clockSync.startAutoSync()

    // Update local state every second
    const intervalId = setInterval(() => {
      setServerTime(clockSync.getServerTime())
      setOffset(clockSync.getOffset())
      setLastSync(clockSync.getLastSyncTime())
    }, 1000)

    return () => {
      cleanup()
      clearInterval(intervalId)
    }
  }, [])

  return {
    serverTime,
    offset,
    lastSync,
    getTimeUntil: (targetTimestamp: number) => clockSync.getTimeUntil(targetTimestamp),
    formatTimeRemaining: (ms: number) => clockSync.formatTimeRemaining(ms),
    sync: () => clockSync.sync()
  }
}

// Import React for hook
import React from 'react'
