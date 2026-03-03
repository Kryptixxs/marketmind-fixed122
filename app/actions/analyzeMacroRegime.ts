'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { fetchNews } from "./fetchNews";

export async function analyzeMacroRegime(activeSymbol: string, price: number) {
  const fallback = {
    narrative: "Disinflationary",
    stance: "Hawkish Pause",
    regime: "Risk-On",
    bias: "Neutral",
    score: 55,
    insight: "Markets are currently pricing in a soft landing despite restrictive policy rates."
  };

  const news = await fetchNews('General');
  const newsContext = news.slice(0, 10).map(n => n.title).join('\n');

  const prompt = `Analyze market regime for ${activeSymbol} ($${price}). Headlines: ${newsContext}`;

  return await generateAIJSON(prompt, fallback);
}