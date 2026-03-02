'use server';

import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeMarket(symbol: string, label: string, price: number, changePercent: number) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return {
      sentiment: changePercent >= 0 ? 'Bullish' : 'Bearish',
      strength: Math.min(Math.abs(changePercent) * 20, 100),
      analysis: "AI Analysis unavailable. Please configure API key."
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze the current market state for ${label} (${symbol}). 
      Current Price: ${price}
      Daily Change: ${changePercent}%
      
      Provide:
      1. A trend strength score from 0 to 100.
      2. Market sentiment (Bullish, Bearish, or Neutral).
      3. A 2-sentence technical analysis of the current price action.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strength: { type: Type.NUMBER },
            sentiment: { type: Type.STRING },
            analysis: { type: Type.STRING },
          },
          required: ["strength", "sentiment", "analysis"],
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Market analysis error:", error);
    return null;
  }
}