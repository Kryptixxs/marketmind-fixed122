'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { EconomicEvent } from "@/lib/types";

export async function analyzeEventIntel(event: EconomicEvent) {
  const prompt = `Analyze the economic event: ${event.title} (${event.country}).
    
    Provide a JSON response with:
    - volatility: "Low" | "Moderate" | "High" | "Extreme"
    - macroImpact: number
    - narrative: string
    - positioning: string
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
      - bias: "BULLISH" | "BEARISH" | "NEUTRAL"`;

  return await generateAIJSON(prompt, null, `event-intel-v1-${event.id}`, 3600);
}