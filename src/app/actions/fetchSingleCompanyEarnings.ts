'use server';

import yahooFinance from 'yahoo-finance2';
import { EarningsEvent } from '@/lib/types';
import { generateAIJSON } from '@/lib/ai-utils';

export async function fetchSingleCompanyEarnings(symbol: string): Promise<EarningsEvent | null> {
  const safeSymbol = symbol.toUpperCase().trim();
  if (!safeSymbol) return null;

  let dateStr = 'TBD';
  let companyName = safeSymbol;
  let mcap = '-';
  let epsEst: number | null = null;

  // 1. Try Quote
  try {
    const quote = await yahooFinance.quote(safeSymbol) as any;
    if (quote) {
      companyName = quote.shortName || quote.longName || safeSymbol;
      epsEst = quote.epsForward || quote.epsCurrentYear || null;

      if (quote.marketCap) {
        if (quote.marketCap >= 1e12) mcap = (quote.marketCap / 1e12).toFixed(2) + 'T';
        else if (quote.marketCap >= 1e9) mcap = (quote.marketCap / 1e9).toFixed(2) + 'B';
        else if (quote.marketCap >= 1e6) mcap = (quote.marketCap / 1e6).toFixed(2) + 'M';
      }

      const ts = quote.earningsTimestamp || quote.earningsTimestampStart || quote.earningsTimestampEnd;
      if (ts) {
        const ms = ts < 100000000000 ? ts * 1000 : ts;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      }
    }
  } catch (err) {
    console.warn(`[SingleEarnings] Yahoo quote failed for ${safeSymbol}, falling back to AI.`);
  }

  // 2. Try Quote Summary Calendar Events
  if (dateStr === 'TBD') {
    try {
      const summary = await yahooFinance.quoteSummary(safeSymbol, { modules: ['calendarEvents'] }) as any;
      const earningsDates = summary?.calendarEvents?.earnings?.earningsDate;
      if (earningsDates && earningsDates.length > 0 && earningsDates[0]) {
        const d = new Date(earningsDates[0]);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        }
      }
    } catch (err) {
      // Silently ignore
    }
  }

  // STALE DATA FILTER
  if (dateStr !== 'TBD') {
    const parsedDate = new Date(dateStr);
    const now = new Date();
    const diffDays = (now.getTime() - parsedDate.getTime()) / (1000 * 3600 * 24);
    
    if (diffDays > 100) {
      dateStr = 'TBD';
    }
  }

  // 3. AI Fallback
  if (dateStr === 'TBD') {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const prompt = `You are a financial data extractor. Today's date is ${todayStr}. 
      Use Google Search to find the EXACT date of the MOST RECENT (within the last 3 months) or NEXT UPCOMING earnings report for ticker symbol ${safeSymbol}.
      Return ONLY a raw JSON object with a single key "date" in "YYYY-MM-DD" format.`;
      
      const fallbackRes = await generateAIJSON(prompt, { date: 'TBD' }, `earnings-date-v6-${safeSymbol}`, 86400);
      
      if (fallbackRes && fallbackRes.date && fallbackRes.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateStr = fallbackRes.date;
      }
    } catch (err) { }
  }

  if (dateStr === 'TBD') {
    dateStr = new Date().toISOString().split('T')[0];
  }

  return {
    id: `single-yf-${safeSymbol}-${dateStr}-${Date.now()}`,
    ticker: safeSymbol,
    name: companyName,
    date: dateStr,
    time: 'tbd',
    epsEst: epsEst,
    epsAct: null,
    revEst: null,
    revAct: null,
    surprise: null,
    sector: 'Unknown',
    marketCap: mcap,
  };
}