'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function analyzeMarketPositioning(symbol: string) {
  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote) return null;

    // Real Math: Volume Ratio & Volatility
    const volRatio = (quote.regularMarketVolume || 0) / (quote.averageDailyVolume3Month || 1);
    const dayRange = (quote.regularMarketDayHigh || 0) - (quote.regularMarketDayLow || 0);
    const volRegime = dayRange / (quote.regularMarketPrice || 1) > 0.02 ? 'Expansion' : 'Contraction';

    const prompt = `Analyze institutional positioning for ${symbol}. 
      Price: ${quote.regularMarketPrice}
      Volume Ratio: ${volRatio.toFixed(2)}x (Relative to 3M Avg)
      Volatility Regime: ${volRegime}
      
      Provide a JSON response with:
      - dxyPositioning: string
      - futuresPositioning: string
      - optionsImplied: string
      - volatilityRegime: string
      - liquidityIndex: number (0-100)
      - gammaExposure: string
      - riskRegime: "STABLE" | "VOLATILE" | "CRITICAL"
      - metrics: { dxy: string, futures: string, options: string, volatility: string, liquidity: string, gamma: string }`;

    return await generateAIJSON(prompt);
  } catch (error) {
    return null;
  }
}