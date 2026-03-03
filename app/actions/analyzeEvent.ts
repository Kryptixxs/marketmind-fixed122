'use server';

import { Type } from "@google/genai";
import { callGeminiJSON } from "./ai";
import { EconomicEvent, EventAIIntelligence } from "@/lib/types";

export async function analyzeEvent(event: EconomicEvent): Promise<EventAIIntelligence> {
  const system = `You are a senior macro strategist at a top-tier investment bank. 
  Your task is to provide deep, event-specific intelligence for economic releases. 
  NEVER use generic templates. Tailor every insight to the specific country, currency, and current macro environment.`;

  const user = `Analyze this economic event:
  Title: ${event.title}
  Country: ${event.country}
  Currency: ${event.currency}
  Impact: ${event.impact}
  Actual: ${event.actual || 'Pending'}
  Forecast: ${event.forecast || 'N/A'}
  Previous: ${event.previous || 'N/A'}

  Provide a detailed risk and opportunity profile. Ensure impacted assets are relevant to the ${event.currency} region.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      whyItMatters: { type: Type.ARRAY, items: { type: Type.STRING } },
      marketLogic: { type: Type.STRING },
      volatility: { type: Type.STRING, enum: ["Low", "Moderate", "High", "Extreme"] },
      macroImpact: { type: Type.NUMBER },
      riskLevel: { type: Type.STRING, enum: ["Standard", "Elevated", "Critical"] },
      surpriseThresholdPct: { type: Type.NUMBER },
      scenarios: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, enum: ["Beat", "Inline", "Miss"] },
            probability: { type: Type.NUMBER },
            reaction: { type: Type.STRING }
          },
          required: ["name", "probability", "reaction"]
        }
      },
      impactedAssets: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING },
            direction: { type: Type.STRING, enum: ["UP", "DOWN", "MIXED"] },
            weight: { type: Type.NUMBER },
            note: { type: Type.STRING }
          },
          required: ["symbol", "direction", "weight", "note"]
        }
      },
      tradeSetups: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            setup: { type: Type.STRING },
            trigger: { type: Type.STRING },
            risk: { type: Type.STRING }
          },
          required: ["setup", "trigger", "risk"]
        }
      },
      confidence: { type: Type.NUMBER }
    },
    required: [
      "summary", "whyItMatters", "marketLogic", "volatility", 
      "macroImpact", "riskLevel", "surpriseThresholdPct", 
      "scenarios", "impactedAssets", "tradeSetups", "confidence"
    ]
  };

  // Cache key includes actual value to re-trigger analysis if data updates
  const cacheKey = `event-intel-${event.id}-${event.actual || 'pending'}`;

  try {
    const { data, stale } = await callGeminiJSON<EventAIIntelligence>({
      system,
      user,
      schema,
      cacheKey
    });
    return { ...data, stale };
  } catch (error) {
    console.error("Event analysis failed:", error);
    throw error;
  }
}