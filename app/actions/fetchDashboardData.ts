'use server';

import { GoogleGenAI, Type } from '@google/genai';

export async function fetchDashboardData() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[AI] GEMINI_API_KEY is missing.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `You are a financial data API. Fetch the latest real-time data for the following:
1. Current stock prices, daily change amount, and daily change percentage for AAPL, MSFT, SPY, QQQ.
2. Current crypto prices, daily change amount, and daily change percentage for BTC, ETH, SOL.
3. The top 5 most important economic events happening this week (include date, time, event name, impact level, and forecast).
4. The top 5 major company earnings reports happening this week (include date, company name, symbol, and estimated EPS).

Return the data strictly as a JSON object matching this schema.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  change: { type: Type.NUMBER },
                  changePercent: { type: Type.NUMBER },
                },
                required: ["symbol", "price", "change", "changePercent"]
              }
            },
            crypto: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  symbol: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  change: { type: Type.NUMBER },
                  changePercent: { type: Type.NUMBER },
                },
                required: ["symbol", "price", "change", "changePercent"]
              }
            },
            economicEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  forecast: { type: Type.STRING },
                },
                required: ["date", "time", "title", "impact", "forecast"]
              }
            },
            earnings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  company: { type: Type.STRING },
                  symbol: { type: Type.STRING },
                  epsEstimate: { type: Type.STRING },
                },
                required: ["date", "company", "symbol", "epsEstimate"]
              }
            }
          },
          required: ["stocks", "crypto", "economicEvents", "earnings"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error fetching data from Gemini:", error);
    return null;
  }
}