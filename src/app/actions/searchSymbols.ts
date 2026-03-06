'use server';

import { yahooFinance } from '@/lib/yahoo-client';

export async function searchSymbols(query: string) {
  if (!query || query.trim().length < 1) return [];
  
  try {
    const res = await yahooFinance.search(query.trim());
    return res.quotes
      .filter((q: any) => q.symbol)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType || 'EQUITY',
        exchange: q.exchDisp || ''
      }))
      .slice(0, 6);
  } catch(e) {
    console.error("Search symbols error:", e);
    return [];
  }
}