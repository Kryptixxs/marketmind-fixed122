'use server';

import yahooFinance from 'yahoo-finance2';

export interface GlobalVitals {
  vix?: number;
  dxy?: number;
  us10y?: number;
  liquidityLabel: "High" | "Normal" | "Risk-Off" | "---";
  stale: boolean;
}

export async function fetchGlobalVitals(): Promise<GlobalVitals> {
  try {
    const symbols = ['^VIX', 'DX-Y.NYB', '^TNX'];
    const quotes = await yahooFinance.quote(symbols, {}, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!Array.isArray(quotes)) return { liquidityLabel: "---", stale: true };

    const vixQuote = quotes.find(q => q.symbol === '^VIX');
    const dxyQuote = quotes.find(q => q.symbol === 'DX-Y.NYB');
    const tnxQuote = quotes.find(q => q.symbol === '^TNX');

    let vix = vixQuote?.regularMarketPrice;
    let dxy = dxyQuote?.regularMarketPrice;
    let us10y = tnxQuote?.regularMarketPrice ? tnxQuote.regularMarketPrice / 10 : undefined;

    let stale = false;

    // Validation with wider ranges to ensure data isn't filtered out unnecessarily
    if (vix !== undefined && (vix < 1 || vix > 200)) {
      vix = undefined;
      stale = true;
    }
    if (dxy !== undefined && (dxy < 30 || dxy > 200)) {
      dxy = undefined;
      stale = true;
    }
    if (us10y !== undefined && (us10y < -1 || us10y > 30)) {
      us10y = undefined;
      stale = true;
    }

    if (vix === undefined || dxy === undefined || us10y === undefined) stale = true;

    // Liquidity Logic
    let liquidityLabel: GlobalVitals['liquidityLabel'] = "---";
    if (vix !== undefined) {
      if (vix < 15) liquidityLabel = "High";
      else if (vix <= 25) liquidityLabel = "Normal";
      else liquidityLabel = "Risk-Off";
    }

    return {
      vix,
      dxy,
      us10y,
      liquidityLabel,
      stale
    };
  } catch (error) {
    console.error("Failed to fetch global vitals:", error);
    return { liquidityLabel: "---", stale: true };
  }
}