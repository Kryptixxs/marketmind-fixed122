'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { EconomicEvent } from "@/lib/types";
import { fetchNews } from "./fetchNews";
import { getEventIntel } from "@/lib/event-intelligence";
import { unstable_cache } from "next/cache";

async function fetchEventIntelFromGemini(event: EconomicEvent, prompt: string, fallbackResponse: any) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return fallbackResponse;

  let retries = 3;
  while (retries > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      if (response.text) {
        let text = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          text = text.substring(startIdx, endIdx + 1);
        }
        
        const parsed = JSON.parse(text);
        if (parsed.reportStatus && parsed.scenarios) {
          return parsed;
        }
      }
    } catch (error: any) {
      console.warn(`[Event Intel] AI fetch failed. Retries remaining: ${retries - 1}.`);
      retries--;
      if (retries === 0) break;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return fallbackResponse;
}

export async function generateFullEventIntel(event: EconomicEvent) {
  const ruleEngineData = getEventIntel(event);
  const fallbackResponse = {
    ...ruleEngineData,
    reportStatus: event.actual ? "POST-RELEASE" : "PRE-RELEASE",
    actualValue: event.actual || "Pending",
    consensusValue: event.forecast || "N/A",
    previousValue: event.previous || "N/A",
    revision: "Awaiting data.",
    liveBias: "Neutral",
    predictionAccuracy: 85,
    smartMoneyPositioning: ruleEngineData.positioning || "Institutions are awaiting data execution.",
    specificPrediction: `(Auto-Fallback Mode) ${ruleEngineData.logic}`
  };

  let newsContext = "No recent news available.";
  try {
    const news = await fetchNews('General');
    newsContext = news.slice(0, 5).map(n => n.title).join('\n');
  } catch (e) {
    console.warn("Failed to fetch news for context.");
  }

  const prompt = `You are the lead quantitative macro strategist for a major hedge fund.
  Your task is to find the LATEST actual released data for the following economic event using Google Search, and generate a highly specific intelligence briefing.
  
  EVENT DATA:
  Title: ${event.title}
  Country: ${event.country} | Currency: ${event.currency}
  NASDAQ Actual: ${event.actual || 'Pending'}
  NASDAQ Forecast: ${event.forecast || 'N/A'}
  NASDAQ Previous: ${event.previous || 'N/A'}
  
  LIVE NEWS CONTEXT:
  ${newsContext}

  INSTRUCTIONS:
  1. Use your Google Search tool to query exactly: "${event.country} ${event.title} latest release results".
  2. If the data is already out today, you MUST extract the actual headline value, the consensus/forecast, and crucially, any revisions to the previous month.
  3. If it is NOT out yet, use the consensus estimates and mark actual as "Pending".
  4. Generate the institutional synthesis.

  CRITICAL: You must output ONLY a valid, raw JSON object. Do not include markdown formatting like \`\`\`json. Do not include any conversational text.

  OUTPUT EXACTLY IN THIS JSON FORMAT:
  {
    "reportStatus": "PRE-RELEASE or POST-RELEASE",
    "actualValue": "e.g. 250K or 3.2%",
    "consensusValue": "e.g. 200K or 3.1%",
    "previousValue": "e.g. 210K or 3.3%",
    "revision": "e.g. Previous revised up to 220K, or None",
    "liveBias": "Highly Bullish, Bullish, Neutral, Bearish, or Highly Bearish",
    "predictionAccuracy": 85,
    "smartMoneyPositioning": "1 sentence on hedge fund positioning",
    "specificPrediction": "2 sentences predicting market reaction",
    "narrative": "Macro context explaining why this matters",
    "volatility": "Low, Moderate, High, or Extreme",
    "macroImpact": 8,
    "surpriseThresholdPct": 5,
    "scenarios": [
      { "label": "Hot", "probability": 30, "reaction": "...", "bias": "BULLISH" },
      { "label": "In-Line", "probability": 50, "reaction": "...", "bias": "NEUTRAL" },
      { "label": "Cool", "probability": 20, "reaction": "...", "bias": "BEARISH" }
    ],
    "sensitivities": [
      { "symbol": "DXY", "sensitivity": "HIGH", "expectedMove": "+0.5%", "weight": 9 }
    ]
  }`;

  const getCached = unstable_cache(
    async () => fetchEventIntelFromGemini(event, prompt, fallbackResponse),
    [`event-intel-v2-${event.id}`],
    { revalidate: 3600 }
  );

  return getCached();
}