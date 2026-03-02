'use server';

import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeMarket(symbol: string, label: string, price: number, changePercent: number) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  // Fallback data if API key is missing or call fails
  const fallback = {
    sentiment: changePercent >= 0 ? 'Bullish' : 'Bearish',
    strength: Math.min(Math.abs(changePercent) * 15 + 40, 95),
    analysis: `The market for ${label} is currently showing ${changePercent >= 0 ? 'positive' : 'negative'} momentum at ${price.toLocaleString()}. Technical indicators suggest a ${Math.abs(changePercent) > 1 ? 'strong' : 'moderate'} ${changePercent >= 0 ? 'uptrend' : 'downtrend'} in the current session.`
  };

  if (!apiKey) {
    return {
      ...fallback,
      analysis: "(Demo Mode) " + fallback.analysis
    };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const result = await ai.models.generateContent({
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

    // The SDK returns the text directly in the response object for this version
    if (result && result.text) {
      return JSON.parse(result.text);
    }
    
    return fallback;
  } catch (error) {
    console.error("Market analysis error:", error);
    return fallback;
  }
}