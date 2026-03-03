'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { EconomicEvent } from "@/lib/types";

export async function analyzeEventIntel(event: EconomicEvent) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze the economic event: ${event.title} (${event.country}).
      
      Provide a JSON object with:
      - volatility: "Low" | "Moderate" | "High" | "Extreme"
      - macroImpact: number (1-10)
      - narrative: string (detailed context)
      - positioning: string (estimated market positioning)
      - surpriseThresholdPct: number
      - sensitivities: array of objects
        - symbol: string
        - sensitivity: "HIGH" | "MODERATE" | "LOW"
        - expectedMove: string
        - weight: number
      - scenarios: array of objects
        - label: string
        - probability: number
        - reaction: string
        - bias: "BULLISH" | "BEARISH" | "NEUTRAL"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            volatility: { type: Type.STRING },
            macroImpact: { type: Type.NUMBER },
            narrative: { type: Type.STRING },
            positioning: { type: Type.STRING },
            surpriseThresholdPct: { type: Type.NUMBER },
            sensitivities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  sensitivity: { type: Type.STRING },
                  expectedMove: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                }
              }
            },
            scenarios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  probability: { type: Type.NUMBER },
                  reaction: { type: Type.STRING },
                  bias: { type: Type.STRING },
                }
              }
            },
          },
          required: ["volatility", "macroImpact", "narrative", "positioning", "surpriseThresholdPct", "sensitivities", "scenarios"],
        },
      },
    });

    if (result && result.text) {
      return JSON.parse(result.text);
    }
    return null;
  } catch (error) {
    console.error("Event intel analysis error:", error);
    return null;
  }
}
