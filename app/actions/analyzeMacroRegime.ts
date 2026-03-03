'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchNews } from "./fetchNews";

const USER_KEY = "AIzaSyAX3dCFS5Yi8HryL9wC98IVAua71dki-zU";

export async function analyzeMacroRegime(activeSymbol: string, price: number) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || USER_KEY;
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const news = await fetchNews('General');
  const newsContext = news.slice(0, 10).map(n => n.title).join('\n');

  try {
    const prompt = `You are a senior macro strategist. Analyze the current market regime based on these headlines and the price of ${activeSymbol} ($${price}).
      
      Headlines:
      ${newsContext}
      
      Provide a JSON response with:
      1. narrative: A 1-word description (e.g., Disinflationary, Reflationary, Stagflationary, Easing).
      2. stance: Current Central Bank stance (e.g., Hawkish Pause, Dovish Pivot, Aggressive Tightening).
      3. regime: Current market regime (e.g., Risk-On, Risk-Off, Volatility Expansion).
      4. bias: Overall market bias (e.g., Bullish, Bearish, Neutral).
      5. score: A sentiment score from 0-100.
      6. insight: A 1-sentence professional insight.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Macro analysis error:", error);
    return null;
  }
}
