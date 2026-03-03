'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function analyzeMarketPositioning(symbol: string) {
  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote) return null;

    const volRatio = (quote.regularMarketVolume || 0) / (quote.averageDailyVolume3Month || 1);

    const fallback = {
      dxyPositioning: "Neutral",
      futuresPositioning: quote.regularMarketChangePercent! > 0 ? "Net Long" : "Net Short",
      optionsImplied: "Balanced",
      volatilityRegime: quote.regularMarketChangePercent! > 1 ? "Expansion" : "Contraction",
      liquidityIndex: 65,
      gammaExposure: "Positive",
      riskRegime: "STABLE",
      metrics: { 
        dxy: "neutral", 
        futures: quote.regularMarketChangePercent! > 0 ? "positive" : "negative", 
        options: "neutral", 
        volatility: "neutral", 
        liquidity: "positive", 
        gamma: "positive" 
      }
    };

    const prompt = `Analyze institutional positioning for ${symbol}. Price: ${quote.regularMarketPrice}. Vol Ratio: ${volRatio}.
      Provide a JSON response with positioning details and risk metrics.`;

    return await generateAIJSON(prompt, fallback);
  } catch (error) {
    return null;
  }
}