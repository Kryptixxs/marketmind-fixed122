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

    if (!chartData?.quotes || chartData.quotes.length < 20) return null;

    const quotes = chartData.quotes.filter(q => q.close !== null);
    const prices = quotes.map(q => q.close as number);
    const highs = quotes.map(q => q.high as number);
    const lows = quotes.map(q => q.low as number);
    
    const currentPrice = prices[prices.length - 1];
    const prevHigh = Math.max(...highs.slice(-20, -1));
    const prevLow = Math.min(...lows.slice(-20, -1));

    const isBOS = currentPrice > prevHigh;
    const isMSS = currentPrice < prevLow;
    
    const fvgs: string[] = [];
    for (let i = 2; i < quotes.length; i++) {
      if (lows[i] > highs[i-2]) fvgs.push(`Bullish: ${highs[i-2].toFixed(2)}-${lows[i].toFixed(2)}`);
      if (highs[i] < lows[i-2]) fvgs.push(`Bearish: ${lows[i].toFixed(2)}-${highs[i-2].toFixed(2)}`);
    }

    // Deterministic Fallback (The Math)
    const fallback = {
      bias: isBOS ? "BULLISH" : isMSS ? "BEARISH" : "NEUTRAL",
      structure: isBOS ? "BOS (Bullish)" : isMSS ? "MSS (Bearish)" : "Consolidation",
      liquiditySweeps: currentPrice > prevHigh ? ["Buy-side Liquidity"] : currentPrice < prevLow ? ["Sell-side Liquidity"] : [],
      fvgs: fvgs.slice(-2),
      levels: { 
        support: [prevLow, prevLow * 0.995].map(n => Number(n.toFixed(2))), 
        resistance: [prevHigh, prevHigh * 1.005].map(n => Number(n.toFixed(2))) 
      },
      setup: isBOS ? "Look for long entries on FVG retest." : isMSS ? "Look for short entries on premium retest." : "Wait for expansion out of range.",
      confidence: 75
    };

    const prompt = `Analyze this algorithmic data for ${symbol}:
      Current Price: ${currentPrice}
      Structure: ${fallback.structure}
      FVGs: ${JSON.stringify(fallback.fvgs)}
      Provide a JSON response with bias, structure, liquiditySweeps, fvgs, levels, setup, and confidence.`;

    return await generateAIJSON(prompt, fallback);
  } catch (error) {
    console.error("Technical analysis error:", error);
    return null;
  }
}