'use server';

import { GoogleGenAI, Type } from "@google/genai";

export interface HistoricalPrint {
  date: string;
  actual: string;
  forecast: string;
}

export async function fetchEventHistory(eventName: string, country: string): Promise<HistoricalPrint[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[History] No API key found.");
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Use Google Search to find the last 5 historical data release prints (the actual reported value and the forecast/consensus value) for the economic event: "${eventName}" in "${country}".
      Return strictly as a JSON array of objects. Format dates as YYYY-MM-DD. If you cannot find the exact values, omit that month. DO NOT invent data.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "YYYY-MM-DD format" },
              actual: { type: Type.STRING },
              forecast: { type: Type.STRING }
            },
            required: ["date", "actual", "forecast"]
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.error("[History] Failed to fetch historical data:", error);
  }
  
  return [];
}