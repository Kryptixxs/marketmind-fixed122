'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const USER_KEY = "AIzaSyAX3dCFS5Yi8HryL9wC98IVAua71dki-zU";

export async function analyzeMarket(symbol: string, label: string, price: number, changePercent: number) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || USER_KEY;
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const prompt = `Analyze the current market state for ${label} (${symbol}). 
      Current Price: ${price}
      Daily Change: ${changePercent}%
      
      Provide a JSON response with:
      1. strength: A trend strength score from 0 to 100.
      2. sentiment: Market sentiment (Bullish, Bearish, or Neutral).
      3. analysis: A 2-sentence technical analysis of the current price action, factoring in ICT concepts like liquidity and FVGs if applicable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Market analysis error:", error);
    return null;
  }
}
