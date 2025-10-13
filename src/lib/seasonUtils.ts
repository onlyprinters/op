/**
 * Season utilities for onlyPrinters
 * A season is a 24-hour period starting at 00:00 UTC (midnight) each day
 */

/**
 * Get the current season ID
 * Returns the date string in YYYY-MM-DD format for the current 24h season
 * 
 * Example:
 * - If current time is 2025-10-09 23:59 UTC → returns "2025-10-09" (current season)
 * - If current time is 2025-10-10 00:00 UTC → returns "2025-10-10" (new season starts at midnight)
 * - If current time is 2025-10-10 12:00 UTC → returns "2025-10-10" (same season continues)
 */
export function getCurrentSeasonId(): string {
  const now = new Date();
  
  // Season ID is simply the current UTC date (00:00 - 23:59:59 UTC)
  return formatSeasonId(now);
}

/**
 * Get season start time (00:00 UTC) for a given season ID
 */
export function getSeasonStartTime(seasonId: string): Date {
  const [year, month, day] = seasonId.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return date;
}

/**
 * Get season end time (23:59:59.999 UTC same day) for a given season ID
 */
export function getSeasonEndTime(seasonId: string): Date {
  const startTime = getSeasonStartTime(seasonId);
  const endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000 - 1); // +24h -1ms
  return endTime;
}

/**
 * Format a date as season ID (YYYY-MM-DD)
 */
export function formatSeasonId(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a given date is within a specific season
 */
export function isDateInSeason(date: Date, seasonId: string): boolean {
  const startTime = getSeasonStartTime(seasonId);
  const endTime = getSeasonEndTime(seasonId);
  return date >= startTime && date <= endTime;
}

/**
 * Get the season ID for a specific date
 */
export function getSeasonIdForDate(date: Date): string {
  // Season ID is the UTC date (00:00 - 23:59:59 UTC)
  return formatSeasonId(date);
}

/**
 * Get time remaining in current season (in milliseconds)
 */
export function getTimeRemainingInSeason(): number {
  const currentSeasonId = getCurrentSeasonId();
  const endTime = getSeasonEndTime(currentSeasonId);
  return endTime.getTime() - Date.now();
}

/**
 * Get season display name
 * Example: "2025-10-09" → "Season Oct 9, 2025"
 */
export function getSeasonDisplayName(seasonId: string): string {
  const date = getSeasonStartTime(seasonId);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
