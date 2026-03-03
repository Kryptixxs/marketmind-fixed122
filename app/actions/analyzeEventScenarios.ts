'use server';

import { GoogleGenAI } from "@google/genai";
import { fetchEconomicCalendarBatch } from "./fetchEconomicCalendar";
import { toISODateString } from "@/lib/date-utils";

const USER_KEY = "AIzaSyAX3dCFS5Yi8HryL9wC98IVAua71dki-zU";

export async function analyzeEventScenarios() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || USER_KEY;
  
  const ai = new GoogleGenAI(apiKey);
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        - probability: number
        - reaction: string
        - bias: "BULLISH" | "BEARISH" | "NEUTRAL"
      - tradeImplication: string`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Scenario analysis error:", error);
    return null;
  }
}
