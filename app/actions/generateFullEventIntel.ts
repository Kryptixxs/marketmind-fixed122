'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { EconomicEvent } from "@/lib/types";
import { fetchNews } from "./fetchNews";

export async function generateFullEventIntel(event: EconomicEvent) {
  // Fetch real-time news to inform the AI's predictions
  const news = await fetchNews('General');
  const newsContext = news.slice(0, 8).map(n => n.title).join('\n');

  const prompt = `You are the lead quantitative macro strategist for a major hedge fund.
  Generate a highly specific, customized intelligence briefing for the following upcoming economic event.
  Do NOT use generic fallback text. You must output a precise, asset-specific analysis based on the live news context provided.
  
  EVENT DATA:
  Title: ${event.title}
  Country: ${event.country} | Currency: ${event.currency}
  Actual: ${event.actual || 'Pending'} | Forecast: ${event.forecast || 'N/A'} | Previous: ${event.previous || 'N/A'}
  
  LIVE NEWS CONTEXT (Use this to determine current market sentiment and Smart Money positioning):
  ${newsContext}
  
  Provide a JSON response strictly matching this structure. Make the text highly detailed and specific to this exact event:
  {
    "liveBias": "string", // "Highly Bullish", "Bullish", "Neutral", "Bearish", or "Highly Bearish" for the local currency.
    "predictionAccuracy": number, // 1-100 score of your confidence based on the clarity of the news.
    "smartMoneyPositioning": "string", // 1 sentence on exactly how hedge funds are positioned RIGHT NOW for this print.
    "specificPrediction": "string", // 2 sentences predicting exactly what will happen to Equities, Bonds, and the Currency when the data drops.
    "narrative": "string", // A 2-sentence historical/macro context explaining why this specific indicator matters right now.
    "volatility": "string", // "Low", "Moderate", "High", or "Extreme"
    "macroImpact": number, // 1 to 10
    "surpriseThresholdPct": number, // What % deviation from forecast would trigger a massive reaction?
    "scenarios": [
      // Generate exactly 3 probabilistic scenarios (e.g., Beat, In-Line, Miss)
      { "label": "string", "probability": number, "reaction": "string", "bias": "BULLISH" | "BEARISH" | "NEUTRAL" }
    ],
    "sensitivities": [
      // Generate exactly 4 specific assets that will move the most (e.g., "NQ", "USD/JPY", "Gold")
      { "symbol": "string", "sensitivity": "HIGH" | "MODERATE" | "LOW", "expectedMove": "string (e.g., '+1.5% on Beat')", "weight": number }
    ]
  }`;

  // The ultimate fallback in case of rate limits
  const fallback = {
    liveBias: "Neutral",
    predictionAccuracy: 50,
    smartMoneyPositioning: "Institutions are maintaining delta-neutral profiles ahead of the print.",
    specificPrediction: "Awaiting data. Significant deviations from consensus will trigger algorithmic re-pricing across related FX pairs and bond yields.",
    narrative: `Standard release for ${event.currency}. Markets will analyze the data against prevailing central bank policy expectations.`,
    volatility: event.impact === 'High' ? 'High' : 'Moderate',
    macroImpact: event.impact === 'High' ? 8 : 5,
    surpriseThresholdPct: 10,
    scenarios: [
      { label: "Hot Print", probability: 33, reaction: `Positive momentum for ${event.currency}.`, bias: "BULLISH" },
      { label: "In-Line", probability: 34, reaction: "Muted reaction, focus shifts.", bias: "NEUTRAL" },
      { label: "Cool Print", probability: 33, reaction: `Negative pressure on ${event.currency}.`, bias: "BEARISH" }
    ],
    sensitivities: [
      { symbol: event.currency, sensitivity: "HIGH", expectedMove: "Directional", weight: 9 }
    ]
  };

  return await generateAIJSON(prompt, fallback);
}