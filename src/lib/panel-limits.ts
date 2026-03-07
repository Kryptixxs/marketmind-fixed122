/**
 * Configurable limits for Bloomberg-class panel density.
 * Increase these to show more data; panels use overflow-y-auto for scrolling.
 */
export const PANEL_LIMITS = {
  /** Max tape rows before truncation (order flow / time & sales) */
  tape: 200,
  /** Max system feed / log lines */
  systemFeed: 200,
  /** Max headlines in DES Corporate Events */
  headlines: 50,
  /** Max news items in NewsModule wire */
  wireNews: 100,
  /** Max quotes in watchlist/security list panels */
  quotesList: 50,
  /** Max execution events in HP module */
  executionEvents: 50,
  /** Max liquidity zones in ICT panel */
  liquidityZones: 6,
  /** Max FVGs in ICT panel */
  fvgs: 8,
  /** Max day events in earnings calendar */
  dayEvents: 30,
  /** Max news items in NewsFeed */
  newsFeed: 50,
} as const;

/** Convenience exports for TerminalStore */
export const TAPE_MAX_ROWS = PANEL_LIMITS.tape;
export const SYSTEM_FEED_MAX_ROWS = PANEL_LIMITS.systemFeed;
