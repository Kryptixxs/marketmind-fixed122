'use server';

import { GoogleGenAI, Type } from "@google/genai";
import YahooFinance from 'yahoo-finance2';
import { fetchNews } from "./fetchNews";

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

export async function analyzeMarketPositioning() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Fetch key macro indicators
    const [vix, dxy, news] = await Promise.all([
      yahooFinance.quote('^VIX'),
      yahooFinance.quote('DX-Y.NYB'),
      fetchNews('General')
    ]);

    const newsContext = news.slice(0, 10).map(n => n.title).join('\n');

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a macro positioning expert. Estimate current market positioning based on these indicators and news.
      
      Indicators:
      - VIX: ${vix?.regularMarketPrice}
      - DXY: ${dxy?.regularMarketPrice}
      
      News Context:
      ${newsContext}
      
      Provide a JSON object with:
      - dxyPositioning: string (e.g., "Net Long (82nd Pctl)")
      - futuresPositioning: string (e.g., "ES: +12.4k Contracts")
      - optionsImplied: string (e.g., "Straddle: +/- 1.2%")
      - volatilityRegime: string (e.g., "Mean Reverting")
      - liquidityIndex: number (0-1)
      - gammaExposure: string (e.g., "+$2.4B (Long Gamma)")
      - riskRegime: "STABLE" | "VOLATILE" | "EXTREME"
      - status: "positive" | "negative" | "neutral" | "warning" (for each metric)`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dxyPositioning: { type: Type.STRING },
            futuresPositioning: { type: Type.STRING },
            optionsImplied: { type: Type.STRING },
            volatilityRegime: { type: Type.STRING },
            liquidityIndex: { type: Type.NUMBER },
            gammaExposure: { type: Type.STRING },
            riskRegime: { type: Type.STRING },
            metrics: {
              type: Type.OBJECT,
              properties: {
                dxy: { type: Type.STRING },
                futures: { type: Type.STRING },
                options: { type: Type.STRING },
                volatility: { type: Type.STRING },
                liquidity: { type: Type.STRING },
                gamma: { type: Type.STRING },
              }
            }
          },
          required: ["dxyPositioning", "futuresPositioning", "optionsImplied", "volatilityRegime", "liquidityIndex", "gammaExposure", "riskRegime", "metrics"],
        },
      },
    });

    if (result && result.text) {
      return JSON.parse(result.text);
    }
    return null;
  } catch (error) {
    console.error("Positioning analysis error:", error);
    return null;
  }
}
