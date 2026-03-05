'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { EconomicEvent } from "@/lib/types";
import { fetchNews } from "./fetchNews";

export async function predictEventOutcome(event: EconomicEvent) {
  // Fetch real-time general macro news
  const news = await fetchNews('General');
  const newsContext = news.slice(0, 8).map(n => n.title).join('\n');

  const prompt = `You are an elite quantitative macro analyst. 
  Analyze this upcoming economic event against current live news headlines to predict the exact market reaction.
  
  EVENT: ${event.title} (${event.country})
  ACTUAL: ${event.actual || 'Pending'} | FORECAST: ${event.forecast || 'N/A'} | PREVIOUS: ${event.previous || 'N/A'}
  
  RECENT NEWS HEADLINES (Use this to gauge current market positioning and fear/greed):
  ${newsContext}
  
  Provide a JSON response with:
  - liveBias: "Highly Bullish" | "Bullish" | "Neutral" | "Bearish" | "Highly Bearish" (for the native currency/market)
  - predictionAccuracy: number 1-100 (your confidence based on news clarity)
  - smartMoneyPositioning: 1 sentence on how institutions are likely positioned *right now* based on the news.
  - specificPrediction: A 2-sentence highly specific prediction of what will happen to Bonds, Equities, and Currency when this prints.`;

  const fallback = {
    liveBias: "Neutral",
    predictionAccuracy: 50,
    smartMoneyPositioning: "Institutions are awaiting definitive data before committing capital.",
    specificPrediction: "Expect elevated volatility immediately following the print. Markets will likely consolidate until the data confirms or denies the current trend."
  };

  // Cache globally for 1 hour based on the specific event ID
  return await generateAIJSON(prompt, fallback, `predict-outcome-v1-${event.id}`, 3600);
}