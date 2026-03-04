import { EconomicEvent } from './types';

/**
 * Generates a stable, URL-friendly ID for an economic event.
 * Format: YYYY-MM-DD_COUNTRY_TITLE-SLUG
 */
export function makeEconomicEventId(event: EconomicEvent): string {
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  return `${event.date}_${event.country}_${slug}`;
}

/**
 * Parses a stable event ID back into its component parts.
 */
export function parseEconomicEventId(id: string) {
  const parts = id.split('_');
  if (parts.length < 3) return null;
  
  return {
    date: parts[0],
    country: parts[1],
    slug: parts.slice(2).join('_')
  };
}