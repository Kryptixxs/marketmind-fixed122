'use server';

import { makePrototypeEconomicEvents, makePrototypeEarnings, makeSimQuote } from '@/lib/prototype-data';

export async function fetchDashboardData() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    stocks: ['AAPL', 'MSFT', 'SPX500', 'NAS100'].map((s) => {
      const q = makeSimQuote(s);
      return { symbol: s, price: q.price, change: q.change, changePercent: q.changePercent };
    }),
    crypto: ['BTCUSD', 'ETHUSD', 'SOLUSD'].map((s) => {
      const q = makeSimQuote(s);
      return { symbol: s, price: q.price, change: q.change, changePercent: q.changePercent };
    }),
    economicEvents: makePrototypeEconomicEvents(today).slice(0, 5).map((e) => ({
      date: e.date,
      time: e.time,
      title: e.title,
      impact: e.impact,
      forecast: e.forecast || 'N/A',
    })),
    earnings: makePrototypeEarnings(today).slice(0, 5).map((e) => ({
      date: e.date,
      company: e.name,
      symbol: e.ticker,
      epsEstimate: e.epsEst?.toFixed(2) || 'N/A',
    })),
  };
}
