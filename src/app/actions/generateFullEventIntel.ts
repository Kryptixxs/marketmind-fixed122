'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { EconomicEvent } from "@/lib/types";
import { fetchNews } from "./fetchNews";
import { getEventIntel } from "@/lib/event-intelligence";
import { unstable_cache } from "next/cache";

async function fetchEventIntelFromGemini(event: EconomicEvent, prompt: string, fallbackResponse: any) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return fallbackResponse;

  let retries = 3;
  while (retries > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey });
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
      console.warn(`[Event Intel] AI fetch failed. Retries remaining: ${retries - 1}.`);
      retries--;
      if (retries === 0) break;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return fallbackResponse;
}

export async function generateFullEventIntel(event: EconomicEvent) {
  // 1. Prepare Deterministic Fallback
  const ruleEngineData = getEventIntel(event);
  const fallbackResponse = {
    ...ruleEngineData,
    liveBias: "Neutral",
    predictionAccuracy: 85,
    smartMoneyPositioning: ruleEngineData.positioning || "Institutions are awaiting data execution.",
    specificPrediction: `(Auto-Fallback Mode) ${ruleEngineData.logic}`
  };

  // Fetch real-time news to inform the AI's predictions
  let newsContext = "No recent news available.";
  try {
    const news = await fetchNews('General');
    newsContext = news.slice(0, 5).map(n => n.title).join('\n');
  } catch (e) {
    console.warn("Failed to fetch news for context.");
  }

  const prompt = `You are the lead quantitative macro strategist for a major hedge fund.
  Generate a highly specific, customized intelligence briefing for the following upcoming economic event.
  You must output a precise, asset-specific analysis based on the live news context provided.
  
  EVENT DATA:
  Title: ${event.title}
  Country: ${event.country} | Currency: ${event.currency}
  Actual: ${event.actual || 'Pending'} | Forecast: ${event.forecast || 'N/A'} | Previous: ${event.previous || 'N/A'}
  
  LIVE NEWS CONTEXT (Use this to determine current market sentiment and Smart Money positioning):
  ${newsContext}`;

  // Use Next.js global server cache! Updates once an hour per unique event.
  const getCached = unstable_cache(
    async () => fetchEventIntelFromGemini(event, prompt, fallbackResponse),
    [`event-intel-v1-${event.id}`],
    { revalidate: 3600 } 
  );

  return getCached();
}