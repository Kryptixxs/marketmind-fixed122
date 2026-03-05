'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { unstable_cache } from "next/cache";

async function executeMiniAnalysis(eventTitle: string, eventCountry: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  // Deterministic fallback if API fails
  const fallback = {
    impactRating: 5,
    impactedAssets: [eventCountry === 'United States' ? 'USD' : 'Local Currency'],
    sentiment: "Neutral",
    analysis: "(Fallback) Awaiting official print. Watch for deviations from consensus to dictate market direction."
  };

  if (!apiKey) return fallback;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
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
            impactRating: { type: Type.NUMBER },
            impactedAssets: { type: Type.ARRAY, items: { type: Type.STRING } },
            sentiment: { type: Type.STRING },
            analysis: { type: Type.STRING },
          },
          required: ["impactRating", "impactedAssets", "sentiment", "analysis"],
        },
      },
    });

    if (response.text) return JSON.parse(response.text);
  } catch (e) {
    console.warn("Mini event analysis failed, returning fallback.");
  }
  
  return fallback;
}

export async function analyzeEconomicEvent(eventTitle: string, eventCountry: string) {
  // Cache the result for 1 hour
  const getCached = unstable_cache(
    async () => executeMiniAnalysis(eventTitle, eventCountry),
    [`mini-intel-v1-${eventTitle}-${eventCountry}`],
    { revalidate: 3600 }
  );

  return getCached();
}