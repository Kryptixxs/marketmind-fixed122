'use server';

import { GoogleGenAI, Type } from "@google/genai";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

export async function analyzeAssetSensitivity() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Fetch current prices for key assets to give context
    const assets = ['GC=F', 'ES=F', 'NQ=F', 'DX-Y.NYB', '^TNX', 'BTC-USD'];
    const quotes = await Promise.all(assets.map(a => yahooFinance.quote(a)));

    const context = quotes.map(q => `${q.symbol}: ${q.regularMarketPrice} (${q.regularMarketChangePercent?.toFixed(2)}%)`).join('\n');

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze the current sensitivity of major assets to macro volatility.
      
      Current Market Context:
      ${context}
      
      Provide a JSON object with:
      - sensitivities: array of objects
        - symbol: string
        - sensitivity: "HIGH" | "MODERATE" | "LOW"
        - expectedMove: string (e.g., "+1.2% on Cool CPI")
        - weight: number (1-10)
      - aggregateSensitivity: "HIGH" | "MODERATE" | "LOW"
      - aggregateScore: number (0-100)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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
            aggregateSensitivity: { type: Type.STRING },
            aggregateScore: { type: Type.NUMBER },
          },
          required: ["sensitivities", "aggregateSensitivity", "aggregateScore"],
        },
      },
    });

    if (result && result.text) {
      return JSON.parse(result.text);
    }
    return null;
  } catch (error) {
    console.error("Sensitivity analysis error:", error);
    return null;
  }
}
