'use server';

import { GoogleGenAI, Type } from "@google/genai";

export async function analyzeEconomicEvent(eventTitle: string, eventCountry: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in your .env.local file.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    // Use a valid, available model name
    model: "gemini-2.0-flash",
    contents: `You are a professional financial analyst. Analyze the economic event: "${eventTitle}" for country "${eventCountry}". 
    
Provide:
1. An impact rating from 1 to 10 based on typical market importance
2. A list of the most likely impacted assets (e.g. USD, Gold, S&P 500, EUR/USD)
3. A general market sentiment (Bullish, Bearish, or Neutral)
4. A 2-sentence market analysis explaining the expected impact

Be concise and professional.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          impactRating: {
            type: Type.NUMBER,
            description: "Impact rating from 1 to 10",
          },
          impactedAssets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of impacted assets (e.g., USD, Gold, S&P 500)",
          },
          sentiment: {
            type: Type.STRING,
            description: "General sentiment: Bullish, Bearish, or Neutral",
          },
          analysis: {
            type: Type.STRING,
            description: "A 2-sentence market sentiment analysis",
          },
        },
        required: ["impactRating", "impactedAssets", "sentiment", "analysis"],
      },
    },
  });

  if (!response.text) {
    throw new Error('No response from Gemini');
  }

  return JSON.parse(response.text);
}
