'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

export async function analyzeAssetSensitivity() {
  try {
    const assets = ['GC=F', 'ES=F', 'NQ=F', 'DX-Y.NYB', '^TNX', 'BTC-USD'];
    const quotes = await Promise.all(assets.map(a => yahooFinance.quote(a)));

    const context = quotes.map(q => `${q.symbol}: ${q.regularMarketPrice} (${q.regularMarketChangePercent?.toFixed(2)}%)`).join('\n');

    const prompt = `Analyze the current sensitivity of major assets to macro volatility.
      
      Current Market Context:
      ${context}
      
      Provide a JSON response with:
      - sensitivities: array of objects
        - symbol: string
        - sensitivity: "HIGH" | "MODERATE" | "LOW"
        - expectedMove: string
        - weight: number
      - aggregateSensitivity: "HIGH" | "MODERATE" | "LOW"
      - aggregateScore: number`;

    return await generateAIJSON(prompt);
  } catch (error) {
    console.error("Sensitivity analysis error:", error);
    return null;
  }
}