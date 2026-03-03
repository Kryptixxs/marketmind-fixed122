'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function analyzeTechnicalSetup(symbol: string) {
  try {
    // Fetch real 15m OHLC data for the last 3 days
    const chartData = await yahooFinance.chart(symbol, { 
      interval: '15m', 
      period1: new Date(Date.now() - 3 * 86400000) 
    });

    if (!chartData?.quotes) return null;

    // Extract key levels and structure mathematically before sending to AI
    const prices = chartData.quotes.map(q => q.close).filter((c): c is number => c !== null);
    const high = Math.max(...prices);
    const low = Math.min(...prices);

    const prompt = `Analyze the 15m technical structure for ${symbol}.
      Current Range: High ${high}, Low ${low}.
      Recent Price Action: ${JSON.stringify(chartData.quotes.slice(-20))}
      
      Provide a JSON response with:
      - bias: "BULLISH" | "BEARISH" | "NEUTRAL"
      - structure: Current market structure (e.g., "BOS", "MSS", "Consolidation").
      - liquiditySweeps: Array of detected liquidity sweeps.
      - fvgs: Array of detected Fair Value Gaps.
      - levels: { support: number[], resistance: number[] }
      - setup: A 1-sentence description of the high-probability setup.
      - confidence: Confidence score 0-100.`;

    return await generateAIJSON(prompt);
  } catch (error) {
    console.error("Technical analysis error:", error);
    return null;
  }
}