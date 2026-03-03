'use server';

import { Type } from "@google/genai";
import { callGeminiJSON } from "./ai";

export interface MarketAnalysis {
  bias: 'Bullish' | 'Bearish' | 'Neutral';
  confidence: number;
  levels: {
    support: number[];
    resistance: number[];
  };
  regime: 'Trend' | 'Range' | 'Volatile';
  thesis: string;
  invalidation: string;
  nextSteps: string[];
  risks: string[];
}

export async function analyzeMarket(
  symbol: string, 
  label: string, 
  price: number, 
  changePercent: number,
  technicalData: {
    rsi: number;
    maSlope: number;
    volatility: number;
    high52w: number;
    low52w: number;
  }
) {
  const system = `You are a senior institutional market strategist. 
  Provide a grounded, data-driven technical analysis based on the provided metrics. 
  Avoid generic advice. Focus on price structure, momentum, and risk levels.
  Return a strict JSON response.`;

  const user = `
    Asset: ${label} (${symbol})
    Current Price: ${price}
    24h Change: ${changePercent}%
    
    Technical Inputs:
    - RSI (14): ${technicalData.rsi.toFixed(2)}
    - MA Slope (20d): ${technicalData.maSlope.toFixed(4)}
    - Volatility (ATR Proxy): ${technicalData.volatility.toFixed(4)}
    - 52-Week Range: ${technicalData.low52w} - ${technicalData.high52w}
    
    Analyze the current market regime and provide tactical levels.
  `;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      bias: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
      confidence: { type: Type.NUMBER },
      levels: {
        type: Type.OBJECT,
        properties: {
          support: { type: Type.ARRAY, items: { type: Type.NUMBER } },
          resistance: { type: Type.ARRAY, items: { type: Type.NUMBER } },
        },
        required: ["support", "resistance"]
      },
      regime: { type: Type.STRING, enum: ["Trend", "Range", "Volatile"] },
      thesis: { type: Type.STRING },
      invalidation: { type: Type.STRING },
      nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
      risks: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["bias", "confidence", "levels", "regime", "thesis", "invalidation", "nextSteps", "risks"],
  };

  try {
    const { data } = await callGeminiJSON<MarketAnalysis>({
      system,
      user,
      schema,
      cacheKey: `market-intel-v2-${symbol}`
    });
    return data;
  } catch (error) {
    console.error("Market analysis error:", error);
    return null;
  }
}