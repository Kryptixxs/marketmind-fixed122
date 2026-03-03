'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { fetchNews } from "./fetchNews";

export async function analyzeMacroRegime(activeSymbol: string, price: number) {
  const news = await fetchNews('General');
  const newsContext = news.slice(0, 10).map(n => n.title).join('\n');

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

  return await generateAIJSON(prompt);
}