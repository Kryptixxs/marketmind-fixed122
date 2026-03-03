'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { fetchEconomicCalendarBatch } from "./fetchEconomicCalendar";
import { toISODateString } from "@/lib/date-utils";

export async function analyzeEventScenarios() {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const calendar = await fetchEconomicCalendarBatch([toISODateString(today), toISODateString(tomorrow)]);
    const allEvents = Object.values(calendar).flat();
    const nextHighImpact = allEvents
      .filter(e => e.impact === 'High')
      .sort((a, b) => a.time.localeCompare(b.time))[0];

    if (!nextHighImpact) return null;

    const prompt = `Analyze the upcoming economic event: ${nextHighImpact.title} (${nextHighImpact.country}).
      
      Provide a JSON response with:
      - eventName: string
      - scenarios: array of 3 scenarios
        - label: string
        - probability: number (0-100)
        - reaction: string
        - bias: "BULLISH" | "BEARISH" | "NEUTRAL"
      - tradeImplication: string`;

    return await generateAIJSON(prompt);
  } catch (error) {
    console.error("Scenario analysis error:", error);
    return null;
  }
}