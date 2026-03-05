'use server';

import yahooFinance from 'yahoo-finance2';
import { EarningsEvent } from '@/lib/types';

export async function fetchSingleCompanyEarnings(symbol: string): Promise<EarningsEvent | null> {
  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote) return null;

    const ts = quote.earningsTimestamp || quote.earningsTimestampStart;
    let dateStr = 'TBD';
    
    if (ts) {
      // Yahoo sometimes returns ms or seconds. Construct Date safely.
      const d = new Date(ts);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    }

    let mcap = '-';
    if (quote.marketCap) {
      if (quote.marketCap >= 1e12) mcap = (quote.marketCap / 1e12).toFixed(2) + 'T';
      else if (quote.marketCap >= 1e9) mcap = (quote.marketCap / 1e9).toFixed(2) + 'B';
      else if (quote.marketCap >= 1e6) mcap = (quote.marketCap / 1e6).toFixed(2) + 'M';
    }

    return {
      id: `single-yf-${symbol}-${dateStr}`,
      ticker: symbol.toUpperCase(),
      name: quote.shortName || quote.longName || symbol,
      date: dateStr,
      time: 'tbd', // We don't get exact time from Yahoo's base quote
      epsEst: quote.epsForward || quote.epsCurrentYear || null,
      epsAct: null,
      revEst: null,
      revAct: null,
      surprise: null,
      sector: 'Unknown',
      marketCap: mcap,
    };
  } catch (e) {
    console.error(`[SingleEarnings] Failed to lookup ${symbol}`, e);
    return null;
  }
}