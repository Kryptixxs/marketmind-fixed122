'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { fetchNews } from "./fetchNews";

export async function analyzeMacroRegime(activeSymbol: string, price: number) {
  // Fetch real news for context
  const news = await fetchNews('General');
  const newsContext = news.slice(0, 10).map(n => n.title).join('\n');

  const prompt = `You are a senior macro strategist. Analyze the current market regime for ${activeSymbol} trading at $${price}.
    
    Contextual Headlines:
    ${newsContext}
    
    Provide a JSON response with:
    - narrative: Current dominant narrative (e.g., "Disinflationary", "Hawkish Pressure").
    - stance: Central Bank stance relative to this asset.
    - regime: Current volatility regime (e.g., "Mean Reverting", "Trending").
    - bias: Directional bias (Bullish/Bearish/Neutral).
    - score: Sentiment score from 0-100.
    - insight: A 1-sentence high-conviction insight for ${activeSymbol}.`;

  return await generateAIJSON(prompt);
}