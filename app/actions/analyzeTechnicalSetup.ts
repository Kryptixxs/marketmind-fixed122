'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function analyzeTechnicalSetup(symbol: string) {
  try {
    // 1. Fetch real 15m OHLC data for the last 3 days
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

    // 2. Algorithmic Detection (Provable Math)
    const isBOS = currentPrice > prevHigh;
    const isMSS = currentPrice < prevLow;
    
    const fvgs = [];
    for (let i = 2; i < quotes.length; i++) {
      // Bullish FVG: Low of candle 3 > High of candle 1
      if (lows[i] > highs[i-2]) {
        fvgs.push({ type: 'Bullish', top: lows[i], bottom: highs[i-2] });
      }
      // Bearish FVG: High of candle 3 < Low of candle 1
      if (highs[i] < lows[i-2]) {
        fvgs.push({ type: 'Bearish', top: lows[i-2], bottom: highs[i] });
      }
    }

    const recentFVGs = fvgs.slice(-3); // Only show the most recent 3

    // 3. AI Synthesis of the Math
    const prompt = `Analyze this algorithmic data for ${symbol}:
      Current Price: ${currentPrice}
      Structure: ${isBOS ? 'BOS (Bullish)' : isMSS ? 'MSS (Bearish)' : 'Consolidation'}
      Detected FVGs: ${JSON.stringify(recentFVGs)}
      
      Provide a JSON response with:
      - bias: "BULLISH" | "BEARISH" | "NEUTRAL"
      - structure: string (e.g. "BOS Detected at ${prevHigh}")
      - liquiditySweeps: string[] (Identify sweeps of ${prevHigh} or ${prevLow})
      - fvgs: string[] (Format as "Gap: [Price Range]")
      - levels: { support: number[], resistance: number[] }
      - setup: string (High-conviction trade idea)
      - confidence: number (0-100)`;

    return await generateAIJSON(prompt);
  } catch (error) {
    console.error("Technical analysis error:", error);
    return null;
  }
}