'use server';

import { yahooFinance } from '@/lib/yahoo-client';

export async function searchEarningsDate(query: string): Promise<{ date: string, symbol: string } | null> {
  try {
    // Search Yahoo Finance for the ticker
    const searchRes = await yahooFinance.search(query);
    const quoteMatch = searchRes.quotes.find(q => q.isYahooFinance);
    const symbol = quoteMatch?.symbol || searchRes.quotes[0]?.symbol;
    
    if (!symbol) return null;

    // Get the exact quote to find the upcoming earnings timestamp
    const quote = await yahooFinance.quote(symbol);
    const ts = quote.earningsTimestamp || quote.earningsTimestampStart;
    
    if (ts) {
      const d = new Date(ts);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return { date: `${year}-${month}-${day}`, symbol: symbol.toUpperCase() };
    }
  } catch (error) {
    console.warn(`[SearchEarnings] Failed to lookup date for ${query}`);
  }
  return null;
}