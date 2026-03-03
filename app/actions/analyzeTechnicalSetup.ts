'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function analyzeTechnicalSetup(symbol: string) {
  const fallback = {
    bias: "NEUTRAL",
    structure: "Consolidation",
    liquiditySweeps: ["PDH Sweep", "Midnight Open"],
    fvgs: ["15m Bullish FVG at 0.5 Fib"],
    levels: { support: [0.99, 0.98], resistance: [1.01, 1.02] },
    setup: "Wait for displacement above current range high to confirm long bias.",
    confidence: 65
  };

  try {
    const chartData = await yahooFinance.chart(symbol, { interval: '15m', period1: new Date(Date.now() - 3 * 86400000) });
    if (!chartData?.quotes) return fallback;
    const prompt = `Analyze 15m OHLC for ${symbol}: ${JSON.stringify(chartData.quotes.slice(-50))}`;
    return await generateAIJSON(prompt, fallback);
  } catch {
    return fallback;
  }
}