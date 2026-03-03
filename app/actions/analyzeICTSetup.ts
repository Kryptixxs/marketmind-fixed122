'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { fetchNews } from "./fetchNews";

export async function analyzeICTSetup(symbol: string, currentPrice: number, candles: any[], mathData: any) {
  // 1. Fetch real-time news for context
  const symName = symbol.split('=')[0].split('-')[0];
  const news = await fetchNews('General');
  const relevantNews = news.filter(n => n.title.includes(symName)).slice(0, 5);
  const newsContext = relevantNews.length > 0 
    ? relevantNews.map(n => n.title).join('\n') 
    : "No major breaking news specific to this asset in the last few hours. Trading on pure technicals.";

  // 2. Format the recent candles for the AI
  const candleContext = candles.map(c => `O:${c.open.toFixed(2)} H:${c.high.toFixed(2)} L:${c.low.toFixed(2)} C:${c.close.toFixed(2)}`).join(' | ');

  const prompt = `You are an elite quantitative ICT/SMC trader.
  Analyze this highly specific live data for ${symbol}.
  
  CURRENT PRICE: $${currentPrice.toFixed(2)}
  
  RECENT CANDLES (Last 10):
  ${candleContext}
  
  ALGORITHMIC SMC ARRAYS:
  - Buy-Side Liquidity (BSL): ${mathData.buysideLiquidity}
  - Sell-Side Liquidity (SSL): ${mathData.sellsideLiquidity}
  - Market Structure: ${mathData.structure}
  - Pricing: ${mathData.isDiscount ? "DISCOUNT" : "PREMIUM"}
  - Unmitigated FVGs: ${JSON.stringify(mathData.fvgs)}
  
  LIVE NEWS HEADLINES (Use this to filter false breakouts):
  ${newsContext}
  
  Generate a custom, highly accurate trading bias. 
  Provide a JSON response strictly matching this structure:
  {
    "algoBias": "string", // A short 2-4 word conviction label (e.g., 'HIGH CONVICTION LONG', 'SCALP SHORT (PREMIUM)')
    "biasColor": "string", // Must be exactly one of: 'text-positive', 'text-negative', 'text-warning'
    "customAnalysis": "string" // A 2-sentence specific breakdown of what the chart + news is telling you right now. Mention the exact liquidity levels or FVGs.
  }`;

  const fallback = {
    algoBias: "WAIT / NEUTRAL",
    biasColor: "text-text-secondary",
    customAnalysis: "Awaiting clear structural shifts. Current price action is heavily bound within internal liquidity pools."
  };

  return await generateAIJSON(prompt, fallback);
}