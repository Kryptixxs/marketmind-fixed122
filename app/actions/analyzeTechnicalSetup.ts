'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

export async function analyzeTechnicalSetup(symbol: string) {
  try {
    const chartData = await yahooFinance.chart(symbol, { 
      period1: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      interval: '15m' 
    });

    if (!chartData?.quotes || chartData.quotes.length === 0) return null;

    const ohlcData = chartData.quotes.map(q => ({
      t: q.date,
      o: q.open,
      h: q.high,
      l: q.low,
      c: q.close,
    })).slice(-100);

    const prompt = `You are a professional ICT/SMC (Inner Circle Trader / Smart Money Concepts) analyst. 
      Analyze the following 15m OHLC data for ${symbol} and identify key technical setups.
      
      Data (Last 100 candles):
      ${JSON.stringify(ohlcData)}
      
      Identify:
      1. Liquidity Sweeps: Have any significant old highs or lows been taken recently?
      2. Fair Value Gaps (FVGs): Are there any unfilled gaps in price action?
      3. Market Structure: Is it Bullish, Bearish, or Ranging? Has there been a Market Structure Shift (MSS)?
      4. Key Levels: Immediate Support and Resistance.
      5. Setup: What is the high-probability trade setup right now?
      
      Provide a JSON response with:
      - bias: "BULLISH" | "BEARISH" | "NEUTRAL"
      - structure: string
      - liquiditySweeps: string[]
      - fvgs: string[]
      - levels: { support: number[], resistance: number[] }
      - setup: string
      - confidence: number`;

    return await generateAIJSON(prompt);
  } catch (error) {
    console.error("Technical analysis error:", error);
    return null;
  }
}