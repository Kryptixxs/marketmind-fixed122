'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import YahooFinance from 'yahoo-finance2';
import { fetchNews } from "./fetchNews";

const USER_KEY = "AIzaSyAX3dCFS5Yi8HryL9wC98IVAua71dki-zU";

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

export async function analyzeMarketPositioning() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || USER_KEY;
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const [vix, dxy, news] = await Promise.all([
      yahooFinance.quote('^VIX'),
      yahooFinance.quote('DX-Y.NYB'),
      fetchNews('General')
    ]);

    const newsContext = news.slice(0, 10).map(n => n.title).join('\n');

    const prompt = `You are a macro positioning expert. Estimate current market positioning based on these indicators and news.
      
      Indicators:
      - VIX: ${vix?.regularMarketPrice}
      - DXY: ${dxy?.regularMarketPrice}
      
      News Context:
      ${newsContext}
      
      Provide a JSON response with:
      - dxyPositioning: string
      - futuresPositioning: string
      - optionsImplied: string
      - volatilityRegime: string
      - liquidityIndex: number
      - gammaExposure: string
      - riskRegime: "STABLE" | "VOLATILE" | "EXTREME"
      - metrics: { dxy: string, futures: string, options: string, volatility: string, liquidity: string, gamma: string }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Positioning analysis error:", error);
    return null;
  }
}
