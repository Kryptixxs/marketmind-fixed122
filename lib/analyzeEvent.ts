'use server';

import { Type } from "@google/genai";
import { callGeminiJSON } from "@/app/actions/ai";

export async function analyzeEconomicEvent(eventTitle: string, eventCountry: string) {
  const system = "You are a professional macro economist analyzing high-impact economic data.";
  const user = `Analyze the economic event: "${eventTitle}" for country "${eventCountry}". Provide impact rating (1-10), impacted assets, sentiment, and a 2-sentence analysis.`;
  
  const schema = {
    type: Type.OBJECT,
    properties: {
      impactRating: { type: Type.NUMBER },
      impactedAssets: { type: Type.ARRAY, items: { type: Type.STRING } },
      sentiment: { type: Type.STRING },
      analysis: { type: Type.STRING },
    },
    required: ["impactRating", "impactedAssets", "sentiment", "analysis"],
  };

  const { data } = await callGeminiJSON<any>({
    system,
    user,
    schema,
    cacheKey: `event-analysis-${eventTitle}-${eventCountry}`
  });

  return data;
}