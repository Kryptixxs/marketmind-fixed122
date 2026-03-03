'use server';

import { GoogleGenAI } from "@google/genai";
import { EconomicEvent } from "@/lib/types";

const USER_KEY = "AIzaSyAX3dCFS5Yi8HryL9wC98IVAua71dki-zU";

export async function analyzeEventIntel(event: EconomicEvent) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || USER_KEY;
  
  const ai = new GoogleGenAI(apiKey);
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Event intel analysis error:", error);
    return null;
  }
}
