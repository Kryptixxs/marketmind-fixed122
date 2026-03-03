'use server';

import { generateAIJSON } from "@/lib/ai-utils";

export async function analyzeMarket(symbol: string, label: string, price: number, changePercent: number) {
  const prompt = `Analyze the current market state for ${label} (${symbol}). 
    Current Price: ${price}
    Daily Change: ${changePercent}%
    
    Provide a JSON response with:
    1. strength: A trend strength score from 0 to 100.
    2. sentiment: Market sentiment (Bullish, Bearish, or Neutral).
    3. analysis: A 2-sentence technical analysis of the current price action, factoring in ICT concepts like liquidity and FVGs if applicable.`;

  return await generateAIJSON(prompt);
}