'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function analyzeTechnicalSetup(symbol: string) {
  try {
    const chartData = await yahooFinance.chart(symbol, { 
      interval: '15m', 
      period1: new Date(Date.now() - 3 * 86400000) 
    });

    if (!chartData?.quotes) return null;

    const prices = chartData.quotes.map(q => q.close).filter((c): c is number => c !== null);
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const currentPrice = prices[prices.length - 1];

    // Deterministic Fallback Logic
    const fallback = {
      bias: currentPrice > (high + low) / 2 ? "BULLISH" : "BEARISH",
      structure: currentPrice > high * 0.98 ? "BOS" : "Consolidation",
      liquiditySweeps: currentPrice < low * 1.01 ? ["Sell-side Liquidity"] : [],
      fvgs: [],
      levels: { support: [low], resistance: [high] },
      setup: `Price is currently testing ${currentPrice > (high + low) / 2 ? 'upper' : 'lower'} range boundaries.`,
      confidence: 70
    };

    const prompt = `Analyze the 15m technical structure for ${symbol}.
      Current Range: High ${high}, Low ${low}.
      Recent Price Action: ${JSON.stringify(chartData.quotes.slice(-10))}
      Provide a JSON response with bias, structure, liquiditySweeps, fvgs, levels, setup, and confidence.`;

    return await generateAIJSON(prompt, fallback);
  } catch (error) {
    return null;
  }
}