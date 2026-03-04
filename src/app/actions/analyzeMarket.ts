'use server';

import { generateAIJSON } from "@/lib/ai-utils";

export async function analyzeMarket(symbol: string, label: string, price: number, changePercent: number) {
  const prompt = `You are an elite quantitative analyst. Analyze the current market state for ${label} (${symbol}). 
    Current Price: ${price}
    Daily Change: ${changePercent}%
    
    Provide a JSON response strictly matching this structure:
    {
      "strength": number, // A trend strength score from 0 to 100
      "sentiment": string, // "Bullish", "Bearish", or "Neutral"
      "analysis": string // A highly customized, 2-sentence technical/macro analysis of the current price action for THIS specific asset. Mention key liquidity concepts if applicable.
    }`;

  const fallback = {
    strength: 50,
    sentiment: changePercent >= 0 ? "Bullish" : "Bearish",
    analysis: `${symbol} is trading at ${price} with a daily change of ${changePercent}%. Market structure is currently developing.`
  };

  return await generateAIJSON(prompt, fallback);
}