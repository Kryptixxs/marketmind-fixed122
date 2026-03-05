'use server';

import yahooFinance from 'yahoo-finance2';
import { EarningsEvent } from '@/lib/types';
import { generateAIJSON } from '@/lib/ai-utils';

export async function fetchSingleCompanyEarnings(symbol: string): Promise<EarningsEvent | null> {
  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote) return null;

    let dateStr = 'TBD';

    // 1. Try quote summary calendar events first (Most reliable method)
    try {
      const summary = await yahooFinance.quoteSummary(symbol, { modules: ['calendarEvents'] });
      const earningsDates = summary?.calendarEvents?.earnings?.earningsDate;
      if (earningsDates && earningsDates.length > 0 && earningsDates[0]) {
        const d = new Date(earningsDates[0]);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      }
    } catch (err) {
      console.warn('[SingleEarnings] Calendar events module missing, falling back to quote timestamps.');
    }

    // 2. Try quote timestamp properties if summary failed (Fixing the Seconds vs Milliseconds bug)
    if (dateStr === 'TBD') {
      const ts = quote.earningsTimestamp || quote.earningsTimestampStart || quote.earningsTimestampEnd;
      if (ts) {
        // Yahoo returns seconds, JavaScript needs milliseconds. 
        // If it's less than 100,000,000,000 it's definitely in seconds.
        const ms = ts < 100000000000 ? ts * 1000 : ts;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      }
    }

    // 3. AI Fallback for unannounced dates (Busted cache key to v4 to clear old failures)
    if (dateStr === 'TBD') {
      const prompt = `You are a financial data extractor. Use Google Search to find the EXACT date of the most recent past earnings report, or the next upcoming earnings report for ticker symbol ${symbol}.
      Return ONLY a raw JSON object with a single key "date" in "YYYY-MM-DD" format. Do not use markdown blocks. Example: {"date": "2024-05-02"}`;
      
      const fallbackRes = await generateAIJSON(prompt, { date: 'TBD' }, `earnings-date-v4-${symbol}`, 86400);
      
      if (fallbackRes && fallbackRes.date && fallbackRes.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateStr = fallbackRes.date;
      }
    }

    // Format the market cap nicely for the UI card
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
      // ULTIMATE FALLBACK: If everything fails, put it on today so the user can still click it to read the AI report!
      date: dateStr !== 'TBD' ? dateStr : new Date().toISOString().split('T')[0],
      time: 'tbd',
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