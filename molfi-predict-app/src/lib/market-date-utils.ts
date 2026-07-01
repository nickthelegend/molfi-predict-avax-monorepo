/**
 * Utilities for market date/expiry detection and display.
 * Uses ONLY API metadata fields (resolution_date, expires_at, resolved_at, status)
 * as the source of truth — never parses dates from titles.
 */

/**
 * Determine the best end date for a market using API metadata only.
 * Priority: resolution_date > expires_at
 */
export function getEffectiveEndDate(market: {
  resolution_date?: string | null;
  expires_at?: string;
}): string | null {
  if (market.resolution_date) return market.resolution_date;
  if (market.expires_at) return market.expires_at;
  return null;
}

/**
 * Check if a market is resolved/ended based on API status and metadata.
 * Does NOT use title-based heuristics or price extremes.
 */
export function isEffectivelyResolved(market: {
  resolution_date?: string | null;
  expires_at?: string;
  resolved_at?: string | null;
  status?: string;
}): boolean {
  // Trust API status first
  if (market.status === 'resolved' || market.status === 'expired' || market.status === 'closed') {
    return true;
  }

  // If resolved_at is set, it's resolved
  if (market.resolved_at) return true;

  // Check if the end date from metadata has passed
  const endDate = getEffectiveEndDate(market);
  if (endDate) {
    return new Date(endDate).getTime() < Date.now();
  }

  return false;
}
