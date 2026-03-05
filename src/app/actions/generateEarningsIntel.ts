'use server';

import { GoogleGenAI } from "@google/genai";
import { EarningsEvent } from "@/lib/types";
import { unstable_cache } from "next/cache";
import { fetchNews } from "./fetchNews";

async function executeEarningsIntel(event: EarningsEvent, newsContext: string) {
  const fallback = {
    reportStatus: event.epsAct ? "POST-EARNINGS" : "PRE-EARNINGS",
    actualEPS: event.epsAct ? `$${event.epsAct}` : "Pending",
    estimatedEPS: event.epsEst ? `$${event.epsEst}` : "Pending",
    actualRevenue: "Pending",
    revenueEstimate: "Pending",
    yoyGrowth: "Pending",
    guidanceSummary: "Awaiting forward guidance details.",
    sentiment: "Neutral",
    expectedMove: "+/- 4.5%",
    whisperNumber: "Pending",
    optionsData: { ivRank: "Elevated", putCallRatio: "1.0", skew: "Neutral" },
    bullCase: "Strong execution and beat on top/bottom line.",
    bearCase: "Miss on estimates or lowered forward guidance.",
    historicalReaction: "Volatile.",
    institutionalBias: "Awaiting data.",
    keyMetrics: ["Revenue", "Margins", "Guidance"],
    analysis: `Awaiting exact financial print for ${event.ticker}.`
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return fallback;

  const ai = new GoogleGenAI({ apiKey });
  
  // Notice we removed the strict Type schema from the config and put it directly in the prompt
  // This prevents the Gemini API from throwing a 400 error when combining Search + Schema
  const prompt = `You are a Senior Equity Research Analyst at a top-tier hedge fund. 
  Your task is to find and extract the LATEST earnings report numbers for ${event.name} (${event.ticker}).
  
  EVENT DATA:
  Ticker: ${event.ticker}
  NASDAQ EPS Estimate: ${event.epsEst || 'N/A'}
  NASDAQ EPS Actual: ${event.epsAct || 'Pending'}
  
  LIVE NEWS CONTEXT:
  ${newsContext}

  INSTRUCTIONS:
  1. Use your Google Search tool to query exactly: "${event.ticker} latest earnings release financial results".
  2. If the earnings are already out, you MUST extract the Actual Revenue, Actual EPS, YoY Growth %, and summarize the Forward Guidance.
  3. If they are NOT out yet, provide the consensus estimates.
  4. Find the options implied move (straddle pricing) or estimate it based on historical volatility.

  CRITICAL: You must output ONLY a valid, raw JSON object. Do not include markdown formatting like \`\`\`json. Do not include any conversational text.

  OUTPUT EXACTLY IN THIS JSON FORMAT:
  {
    "reportStatus": "PRE-EARNINGS or POST-EARNINGS",
    "actualEPS": "e.g. $0.23",
    "estimatedEPS": "e.g. $0.20",
    "actualRevenue": "e.g. $900M",
    "revenueEstimate": "e.g. $850M",
    "yoyGrowth": "e.g. +30% YoY",
    "guidanceSummary": "1 specific sentence on next quarter guidance.",
    "sentiment": "Bullish, Bearish, or Neutral",
    "expectedMove": "e.g. +/- 6.2%",
    "whisperNumber": "e.g. $0.25",
    "optionsData": {
      "ivRank": "e.g. 85%",
      "putCallRatio": "e.g. 0.8",
      "skew": "e.g. Call Heavy"
    },
    "bullCase": "1 sentence best case",
    "bearCase": "1 sentence worst case",
    "historicalReaction": "1 sentence on historical earnings day moves",
    "institutionalBias": "1 sentence on smart money positioning",
    "keyMetrics": ["Metric 1", "Metric 2", "Metric 3"],
    "analysis": "2 sentences breaking down the print."
  }`;

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          // Removing responseSchema to prevent the conflict with googleSearch
        }
      });

      if (response.text) {
        // Aggressively clean the response to ensure it is parseable JSON
        let text = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          text = text.substring(startIdx, endIdx + 1);
        }
        
        const parsed = JSON.parse(text);
        
        // Quick validation to ensure we got the right object
        if (parsed.reportStatus && parsed.actualRevenue) {
          return parsed; 
        }
      }
    } catch (error) {
      console.warn(`[Earnings Intel] Attempt failed for ${event.ticker}. Retries left: ${retries - 1}`);
      retries--;
      if (retries === 0) break;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return fallback;
}

export async function generateEarningsIntel(event: EarningsEvent) {
  let newsContext = "No recent news available.";
  try {
    const news = await fetchNews('Stock');
    newsContext = news.filter(n => n.title.includes(event.ticker) || n.title.includes(event.name.split(' ')[0])).slice(0, 5).map(n => n.title).join('\n');
  } catch (e) {}

  // BUMPED CACHE TO V5 to force a fresh pull for CRWD / TGT
  const getCached = unstable_cache(
    async () => executeEarningsIntel(event, newsContext),
    [`earnings-intel-v5-${event.ticker}-${event.date}`],
    { revalidate: 3600 } 
  );

  return getCached();
}