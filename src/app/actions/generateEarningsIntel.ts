'use server';

import { GoogleGenAI, Type } from "@google/genai";
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
    analysis: `Awaiting exact financial print for ${event.ticker}.`
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return fallback;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a Senior Equity Research Analyst at a top-tier hedge fund. 
  Analyze the earnings report for ${event.name} (${event.ticker}).
  
  EVENT DATA:
  Date: ${event.date}
  NASDAQ EPS Estimate: ${event.epsEst || 'N/A'}
  NASDAQ EPS Actual (If already reported): ${event.epsAct || 'Pending'}
  
  LIVE NEWS CONTEXT:
  ${newsContext}

  INSTRUCTIONS:
  Use your Google Search tool to find the EXACT financial numbers for this specific earnings release. 
  If the earnings are already out, you MUST provide the Actual Revenue, Actual EPS, YoY Growth %, and a 1-sentence summary of the Forward Guidance.
  If the earnings are NOT out yet, provide the consensus estimates and leave Actuals as "Pending".

  CRITICAL: You must output ONLY a valid, raw JSON object. Do not include markdown formatting like \`\`\`json. Do not include any conversational text.

  Provide a highly specific JSON response matching this schema:
  - reportStatus: "PRE-EARNINGS" or "POST-EARNINGS"
  - actualEPS: The EXACT reported EPS (e.g., "$1.25" or "Pending")
  - estimatedEPS: The consensus EPS estimate (e.g., "$1.20")
  - actualRevenue: The EXACT reported revenue (e.g., "$24.5B" or "Pending")
  - revenueEstimate: The consensus revenue estimate (e.g., "$24.1B")
  - yoyGrowth: Year-over-year revenue or EPS growth (e.g., "+15% YoY")
  - guidanceSummary: 1 specific sentence on next quarter/year guidance (e.g., "Raised Q3 Rev guidance to $26B, beating $25.5B estimates.")
  - sentiment: "Bullish", "Bearish", or "Neutral" (based on the print or pre-earnings setup)
  - expectedMove: options implied move (e.g. "+/- 6.2%")
  - whisperNumber: buy-side whisper EPS
  - optionsData: Object with ivRank, putCallRatio, skew
  - analysis: A 2-sentence institutional breakdown of the financial print.`;

  // 3-Attempt Retry Loop for maximum stability
  let retries = 3;
  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reportStatus: { type: Type.STRING },
              actualEPS: { type: Type.STRING },
              estimatedEPS: { type: Type.STRING },
              actualRevenue: { type: Type.STRING },
              revenueEstimate: { type: Type.STRING },
              yoyGrowth: { type: Type.STRING },
              guidanceSummary: { type: Type.STRING },
              sentiment: { type: Type.STRING },
              expectedMove: { type: Type.STRING },
              whisperNumber: { type: Type.STRING },
              optionsData: {
                type: Type.OBJECT,
                properties: {
                  ivRank: { type: Type.STRING },
                  putCallRatio: { type: Type.STRING },
                  skew: { type: Type.STRING }
                },
                required: ["ivRank", "putCallRatio", "skew"]
              },
              analysis: { type: Type.STRING },
            },
            required: [
              "reportStatus", "actualEPS", "estimatedEPS", "actualRevenue", "revenueEstimate", 
              "yoyGrowth", "guidanceSummary", "sentiment", "expectedMove", 
              "whisperNumber", "optionsData", "analysis"
            ]
          }
        }
      });

      if (response.text) {
        // Aggressively clean the response to ensure it is parseable JSON
        let text = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Find the first { and last } in case Gemini injected conversational text
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          text = text.substring(startIdx, endIdx + 1);
        }
        
        return JSON.parse(text); // If this succeeds, we return immediately!
      }
    } catch (error) {
      console.warn(`[Earnings Intel] Attempt failed for ${event.ticker}. Retries left: ${retries - 1}`);
      retries--;
      if (retries === 0) break;
      // Wait 1.5 seconds before retrying to let the API rate limit cool off
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  // If we exhaust all 3 retries, return the fallback
  return fallback;
}

export async function generateEarningsIntel(event: EarningsEvent) {
  let newsContext = "No recent news available.";
  try {
    const news = await fetchNews('Stock');
    newsContext = news.filter(n => n.title.includes(event.ticker) || n.title.includes(event.name.split(' ')[0])).slice(0, 5).map(n => n.title).join('\n');
  } catch (e) {}

  // BUMPED CACHE TO V4: This forces the server to throw out the old "Awaiting..." error and fetch fresh data.
  const getCached = unstable_cache(
    async () => executeEarningsIntel(event, newsContext),
    [`earnings-intel-v4-${event.ticker}-${event.date}`],
    { revalidate: 3600 } 
  );

  return getCached();
}