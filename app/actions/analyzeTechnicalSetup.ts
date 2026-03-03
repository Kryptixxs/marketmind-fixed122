'use server';

import { GoogleGenAI, Type } from "@google/genai";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

export async function analyzeTechnicalSetup(symbol: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Fetch 15m data for the last 3 days to detect intraday patterns
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
    })).slice(-100); // Last 100 candles

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a professional ICT/SMC (Inner Circle Trader / Smart Money Concepts) analyst. 
      Analyze the following 15m OHLC data for ${symbol} and identify key technical setups.
      
      Data (Last 100 candles):
      ${JSON.stringify(ohlcData)}
      
      Identify:
      1. Liquidity Sweeps: Have any significant old highs or lows been taken recently?
      2. Fair Value Gaps (FVGs): Are there any unfilled gaps in price action?
      3. Market Structure: Is it Bullish, Bearish, or Ranging? Has there been a Market Structure Shift (MSS)?
      4. Key Levels: Immediate Support and Resistance.
      5. Setup: What is the high-probability trade setup right now?
      
      Provide a JSON object with:
      - bias: "BULLISH" | "BEARISH" | "NEUTRAL"
      - structure: string (e.g., "Bullish Trend with MSS")
      - liquiditySweeps: string[] (list of recent sweeps)
      - fvgs: string[] (list of active FVGs)
      - levels: { support: number[], resistance: number[] }
      - setup: string (detailed trade setup)
      - confidence: number (0-100)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bias: { type: Type.STRING },
            structure: { type: Type.STRING },
            liquiditySweeps: { type: Type.ARRAY, items: { type: Type.STRING } },
            fvgs: { type: Type.ARRAY, items: { type: Type.STRING } },
            levels: {
              type: Type.OBJECT,
              properties: {
                support: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                resistance: { type: Type.ARRAY, items: { type: Type.NUMBER } },
              }
            },
            setup: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
          },
          required: ["bias", "structure", "liquiditySweeps", "fvgs", "levels", "setup", "confidence"],
        },
      },
    });

    if (result && result.text) {
      return JSON.parse(result.text);
    }
    return null;
  } catch (error) {
    console.error("Technical analysis error:", error);
    return null;
  }
}
