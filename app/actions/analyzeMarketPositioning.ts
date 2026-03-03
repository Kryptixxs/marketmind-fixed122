'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function analyzeMarketPositioning(symbol: string) {
  try {
    const quote = await yahooFinance.quote(symbol);
    
    const prompt = `Analyze institutional positioning for ${symbol}.
      Current Price: ${quote.regularMarketPrice}
      Volume: ${quote.regularMarketVolume}
      Avg Volume: ${quote.averageDailyVolume3Month}
      
      Provide a JSON response with:
      - dxyPositioning: Relative USD strength impact.
      - futuresPositioning: Estimated net positioning (Long/Short).
      - optionsImplied: Estimated Put/Call sentiment.
      - volatilityRegime: Current regime (e.g., "Expansion", "Contraction").
      - liquidityIndex: Score from 0-100.
      - gammaExposure: Estimated Gamma (Positive/Negative).
      - riskRegime: "STABLE" | "VOLATILE" | "CRITICAL"
      - metrics: { dxy: string, futures: string, options: string, volatility: string, liquidity: string, gamma: string } (values: "positive" | "negative" | "neutral" | "warning")`;

    return await generateAIJSON(prompt);
  } catch (error) {
    console.error("Positioning analysis error:", error);
    return null;
  }
}