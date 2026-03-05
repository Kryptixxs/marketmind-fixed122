'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { EconomicEvent } from "@/lib/types";
import { fetchNews } from "./fetchNews";

export async function generateFullEventIntel(event: EconomicEvent) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No Gemini API key found.");
    return null;
  }

  // Fetch real-time news to inform the AI's predictions
  const news = await fetchNews('General');
  const newsContext = news.slice(0, 8).map(n => n.title).join('\n');

  const prompt = `You are the lead quantitative macro strategist for a major hedge fund.
  Generate a highly specific, customized intelligence briefing for the following upcoming economic event.
  You must output a precise, asset-specific analysis based on the live news context provided.
  
  EVENT DATA:
  Title: ${event.title}
  Country: ${event.country} | Currency: ${event.currency}
  Actual: ${event.actual || 'Pending'} | Forecast: ${event.forecast || 'N/A'} | Previous: ${event.previous || 'N/A'}
  
  LIVE NEWS CONTEXT (Use this to determine current market sentiment and Smart Money positioning):
  ${newsContext}`;

  const ai = new GoogleGenAI({ apiKey });

  // Implement a 3-attempt retry loop to handle brief rate limits (429s) without breaking the UI
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              liveBias: { type: Type.STRING, description: "Highly Bullish, Bullish, Neutral, Bearish, or Highly Bearish" },
              predictionAccuracy: { type: Type.NUMBER, description: "1-100 score" },
              smartMoneyPositioning: { type: Type.STRING, description: "1 sentence on exactly how hedge funds are positioned RIGHT NOW" },
              specificPrediction: { type: Type.STRING, description: "2 sentences predicting exactly what will happen" },
              narrative: { type: Type.STRING, description: "Macro context explaining why this indicator matters" },
              volatility: { type: Type.STRING, description: "Low, Moderate, High, or Extreme" },
              macroImpact: { type: Type.NUMBER, description: "1 to 10" },
              surpriseThresholdPct: { type: Type.NUMBER, description: "What % deviation from forecast triggers a massive reaction" },
              scenarios: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    probability: { type: Type.NUMBER },
                    reaction: { type: Type.STRING },
                    bias: { type: Type.STRING, description: "BULLISH, BEARISH, or NEUTRAL" }
                  },
                  required: ["label", "probability", "reaction", "bias"]
                }
              },
              sensitivities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    symbol: { type: Type.STRING },
                    sensitivity: { type: Type.STRING, description: "HIGH, MODERATE, or LOW" },
                    expectedMove: { type: Type.STRING },
                    weight: { type: Type.NUMBER }
                  },
                  required: ["symbol", "sensitivity", "expectedMove", "weight"]
                }
              }
            },
            required: ["liveBias", "predictionAccuracy", "smartMoneyPositioning", "specificPrediction", "narrative", "volatility", "macroImpact", "surpriseThresholdPct", "scenarios", "sensitivities"]
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (error: any) {
      console.warn(`[Event Intel] AI fetch failed. Retries remaining: ${retries - 1}. Error: ${error.message}`);
      retries--;
      if (retries === 0) {
        return null;
      }
      // Wait 1.5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  return null;
}