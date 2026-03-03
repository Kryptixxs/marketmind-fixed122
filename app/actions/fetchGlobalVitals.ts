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
    const quotes = await yahooFinance.quote(symbols);

    const vixQuote = quotes.find(q => q.symbol === '^VIX');
    const dxyQuote = quotes.find(q => q.symbol === 'DX-Y.NYB');
    const tnxQuote = quotes.find(q => q.symbol === '^TNX');

    let vix = vixQuote?.regularMarketPrice;
    let dxy = dxyQuote?.regularMarketPrice;
    let us10y = tnxQuote?.regularMarketPrice ? tnxQuote.regularMarketPrice / 10 : undefined;

    let stale = false;

    // Validation
    if (vix !== undefined && (vix < 5 || vix > 120)) {
      vix = undefined;
      stale = true;
    }
    if (dxy !== undefined && (dxy < 50 || dxy > 150)) {
      dxy = undefined;
      stale = true;
    }
    if (us10y !== undefined && (us10y < 0 || us10y > 20)) {
      us10y = undefined;
      stale = true;
    }

    if (!vix || !dxy || !us10y) stale = true;

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