'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { fetchNews } from "./fetchNews";

export async function analyzeICTSetup(symbol: string, currentPrice: number, candles: any[], mathData: any) {
  const symName = symbol.split('=')[0].split('-')[0];
  const news = await fetchNews('General');
  const relevantNews = news.filter(n => n.title.includes(symName)).slice(0, 5);
  const newsContext = relevantNews.length > 0 
    ? relevantNews.map(n => n.title).join('\n') 
    : "No major breaking news specific to this asset in the last few hours. Trading on pure technicals.";

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
  - Sweeps: ${mathData.sweep ? JSON.stringify(mathData.sweep) : "None"}
  - Unmitigated FVGs: ${JSON.stringify(mathData.fvgs)}
  
  LIVE NEWS HEADLINES:
  ${newsContext}
  
  CRITICAL TRADING RULES:
  1. NEWS IS KING. If the news is highly bullish or bearish, it overrides minor technicals.
  2. LIQUIDITY SWEEPS (Turtle Soup) are extremely high-probability reversal signals. Weight them heavily.
  3. UNMITIGATED FVGs act as magnets. If price is near an FVG, it will likely fill it.
  
  Generate a custom, highly accurate trading bias based on these weights. 
  Provide a JSON response strictly matching this structure:
  {
    "algoBias": "string", // A short 2-4 word conviction label (e.g., 'HIGH CONVICTION SHORT', 'SCALP LONG (SWEEP)')
    "biasColor": "string", // Must be exactly one of: 'text-positive', 'text-negative', 'text-warning'
    "customAnalysis": "string" // A 2-sentence highly specific breakdown of the chart + news. Mention exact liquidity levels, sweeps, or FVGs.
  }`;

  const fallback = {
    algoBias: mathData.algoBias || "DATA SYNCING",
    biasColor: mathData.biasColor || "text-text-secondary",
    customAnalysis: `(System Override) AI unavailable. Algorithmic bias derived strictly from local execution engine. Structure is ${mathData.structure} in a ${mathData.isDiscount ? 'Discount' : 'Premium'} array.`
  };

  // Cache globally for 1 hour based on the symbol
  return await generateAIJSON(prompt, fallback, `ict-setup-v1-${symbol}`, 3600);
}