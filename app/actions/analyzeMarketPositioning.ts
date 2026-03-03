'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function analyzeMarketPositioning(symbol: string) {
  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote) return null;

    const volRatio = (quote.regularMarketVolume || 0) / (quote.averageDailyVolume3Month || 1);
    const dayRange = (quote.regularMarketDayHigh || 0) - (quote.regularMarketDayLow || 0);
    const volRegime = dayRange / (quote.regularMarketPrice || 1) > 0.02 ? 'Expansion' : 'Contraction';

    const fallback = {
      dxyPositioning: "Neutral / Balanced",
      futuresPositioning: quote.regularMarketChangePercent! > 0 ? "Net Long" : "Net Short",
      optionsImplied: "Balanced Gamma",
      volatilityRegime: volRegime,
      liquidityIndex: 65,
      gammaExposure: "Positive",
      riskRegime: volRegime === 'Expansion' ? "VOLATILE" : "STABLE",
      metrics: { 
        dxy: "neutral", 
        futures: quote.regularMarketChangePercent! > 0 ? "positive" : "negative", 
        options: "neutral", 
        volatility: volRegime === 'Expansion' ? "warning" : "positive", 
        liquidity: "positive", 
        gamma: "positive" 
      }
    };

    const prompt = `Analyze institutional positioning for ${symbol}. Price: ${quote.regularMarketPrice}. Vol Ratio: ${volRatio.toFixed(2)}.
      Provide a JSON response with positioning details and risk metrics.`;

    return await generateAIJSON(prompt, fallback);
  } catch (error) {
    return null;
  }
}