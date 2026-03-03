'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { fetchEconomicCalendarBatch } from "./fetchEconomicCalendar";
import { toISODateString } from "@/lib/date-utils";

export async function analyzeEventScenarios() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Fetch today's and tomorrow's events to find the next high-impact one
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const calendar = await fetchEconomicCalendarBatch([toISODateString(today), toISODateString(tomorrow)]);
    const allEvents = Object.values(calendar).flat();
    const nextHighImpact = allEvents
      .filter(e => e.impact === 'High')
      .sort((a, b) => a.time.localeCompare(b.time))[0];

    if (!nextHighImpact) return null;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze the upcoming economic event: ${nextHighImpact.title} (${nextHighImpact.country}).
      
      Provide a JSON object with:
      - eventName: string
      - scenarios: array of 3 scenarios (Hot, In-Line, Cool or similar)
        - label: string
        - probability: number (0-100)
        - reaction: string (market impact)
        - bias: "BULLISH" | "BEARISH" | "NEUTRAL"
      - tradeImplication: string (detailed trade advice)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eventName: { type: Type.STRING },
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
            tradeImplication: { type: Type.STRING },
          },
          required: ["eventName", "scenarios", "tradeImplication"],
        },
      },
    });

    if (result && result.text) {
      return JSON.parse(result.text);
    }
    return null;
  } catch (error) {
    console.error("Scenario analysis error:", error);
    return null;
  }
}
