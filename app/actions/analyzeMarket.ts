'use server';

import { Type } from "@google/genai";
import { callGeminiJSON } from "./ai";

export async function analyzeMarket(symbol: string, label: string, price: number, changePercent: number) {
  const system = "You are a professional financial analyst providing concise technical insights.";
  const user = `Analyze ${label} (${symbol}). Price: ${price}, Change: ${changePercent}%. Provide trend strength (0-100), sentiment, and a 2-sentence analysis.`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      strength: { type: Type.NUMBER },
      sentiment: { type: Type.STRING },
      analysis: { type: Type.STRING },
    },
    required: ["strength", "sentiment", "analysis"],
  };

  try {
    const { data } = await callGeminiJSON<any>({
      system,
      user,
      schema,
      cacheKey: `market-analysis-${symbol}`
    });
    return data;
  } catch (error) {
    console.error("Market analysis error:", error);
    return {
      sentiment: changePercent >= 0 ? 'Bullish' : 'Bearish',
      strength: 50,
      analysis: "AI analysis currently unavailable. Showing baseline technical sentiment."
    };
  }
}