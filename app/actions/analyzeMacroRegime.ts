'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { fetchNews } from "./fetchNews";

export async function analyzeMacroRegime(activeSymbol: string, price: number) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  
  // Fetch the latest general and stock news to give the AI context
  const news = await fetchNews('General');
  const newsContext = news.slice(0, 10).map(n => n.title).join('\n');

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `You are a senior macro strategist. Analyze the current market regime based on these headlines and the price of ${activeSymbol} ($${price}).
      
      Headlines:
      ${newsContext}
      
      Provide a JSON object with:
      1. narrative: A 1-word description (e.g., Disinflationary, Reflationary, Stagflationary, Easing).
      2. stance: Current Central Bank stance (e.g., Hawkish Pause, Dovish Pivot, Aggressive Tightening).
      3. regime: Current market regime (e.g., Risk-On, Risk-Off, Volatility Expansion).
      4. bias: Overall market bias (e.g., Bullish, Bearish, Neutral).
      5. score: A sentiment score from 0-100.
      6. insight: A 1-sentence professional insight.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: { type: Type.STRING },
            stance: { type: Type.STRING },
            regime: { type: Type.STRING },
            bias: { type: Type.STRING },
            score: { type: Type.NUMBER },
            insight: { type: Type.STRING },
          },
          required: ["narrative", "stance", "regime", "bias", "score", "insight"],
        },
      },
    });

    if (result && result.text) {
      return JSON.parse(result.text);
    }
    return null;
  } catch (error) {
    console.error("Macro analysis error:", error);
    return null;
  }
}