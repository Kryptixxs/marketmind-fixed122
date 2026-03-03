'use server';

import { GoogleGenAI } from "@google/genai";
import YahooFinance from 'yahoo-finance2';

const USER_KEY = "AIzaSyAX3dCFS5Yi8HryL9wC98IVAua71dki-zU";

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

export async function analyzeAssetSensitivity() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || USER_KEY;
  
  const ai = new GoogleGenAI(apiKey);
  const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const assets = ['GC=F', 'ES=F', 'NQ=F', 'DX-Y.NYB', '^TNX', 'BTC-USD'];
    const quotes = await Promise.all(assets.map(a => yahooFinance.quote(a)));

    const context = quotes.map(q => `${q.symbol}: ${q.regularMarketPrice} (${q.regularMarketChangePercent?.toFixed(2)}%)`).join('\n');

    const prompt = `Analyze the current sensitivity of major assets to macro volatility.
      
      Current Market Context:
      ${context}
      
      Provide a JSON response with:
      - sensitivities: array of objects
        - symbol: string
        - sensitivity: "HIGH" | "MODERATE" | "LOW"
        - expectedMove: string
        - weight: number
      - aggregateSensitivity: "HIGH" | "MODERATE" | "LOW"
      - aggregateScore: number`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Sensitivity analysis error:", error);
    return null;
  }
}
