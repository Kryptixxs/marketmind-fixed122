'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { EarningsEvent } from "@/lib/types";
import { unstable_cache } from "next/cache";
import { fetchNews } from "./fetchNews";

async function executeEarningsIntel(event: EarningsEvent, newsContext: string) {
  const fallback = {
    sentiment: "Neutral",
    expectedMove: "+/- 4.5%",
    revenueEstimate: "Pending",
    whisperNumber: "Pending",
    optionsData: {
      ivRank: "Elevated",
      putCallRatio: "1.0",
      skew: "Neutral"
    },
    bullCase: "Strong forward guidance and margin expansion could trigger a short squeeze.",
    bearCase: "Any miss on top-line revenue or lowered guidance will be punished severely in the current macro environment.",
    historicalReaction: "Mixed historical performance on earnings day.",
    institutionalBias: "Markets are pricing in average historical volatility for this report.",
    keyMetrics: ["Forward Guidance", "Revenue Growth", "Operating Margins"],
    analysis: `${event.ticker} earnings act as a binary catalyst. Institutional focus will be heavily weighted on forward guidance.`
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Senior Equity Research Analyst and Derivatives Trader at a top-tier hedge fund. 
    Write a comprehensive, institutional-grade pre-earnings briefing for ${event.name} (${event.ticker}).
    
    EVENT DATA:
    Official EPS Estimate: ${event.epsEst || 'N/A'}
    Release Time: ${event.time === 'bmo' ? 'Before Market Open' : event.time === 'amc' ? 'After Market Close' : 'TBD'}
    
    LIVE NEWS CONTEXT:
    ${newsContext}

    Use your search tools to find recent analyst revisions, revenue estimates, and options market positioning (implied volatility).
    Provide a highly specific JSON response matching this schema:
    - sentiment: "Bullish", "Bearish", or "Neutral"
    - expectedMove: estimated options implied move (e.g. "+/- 6.2%")
    - revenueEstimate: Consensus revenue estimate (e.g. "$24.5B")
    - whisperNumber: The unofficial "whisper" EPS expectation from buy-side analysts.
    - optionsData: Object containing ivRank (e.g., "85%"), putCallRatio (e.g., "0.8"), and skew (e.g., "Call Heavy" or "Put Heavy").
    - bullCase: 1 concise sentence on the best-case scenario.
    - bearCase: 1 concise sentence on the worst-case scenario.
    - historicalReaction: 1 short phrase on how the stock usually reacts to earnings (e.g., "Averaged +4% move over last 4 quarters").
    - institutionalBias: 1 sentence on how smart money is positioned going into the print.
    - keyMetrics: Array of 3 exact metrics analysts are watching (e.g. ["Cloud Revenue", "Gross Margins", "China Sales"]).
    - analysis: A 2-sentence institutional breakdown of what to expect and what constitutes a "beat".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable live search for current estimates
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            expectedMove: { type: Type.STRING },
            revenueEstimate: { type: Type.STRING },
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
            bullCase: { type: Type.STRING },
            bearCase: { type: Type.STRING },
            historicalReaction: { type: Type.STRING },
            institutionalBias: { type: Type.STRING },
            keyMetrics: { type: Type.ARRAY, items: { type: Type.STRING } },
            analysis: { type: Type.STRING },
          },
          required: [
            "sentiment", "expectedMove", "revenueEstimate", "whisperNumber", 
            "optionsData", "bullCase", "bearCase", "historicalReaction", 
            "institutionalBias", "keyMetrics", "analysis"
          ]
        }
      }
    });

    if (response.text) {
      let text = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    }
  } catch (error) {
    console.warn(`[Earnings Intel] AI fetch failed for ${event.ticker}.`);
  }
  
  return fallback;
}

export async function generateEarningsIntel(event: EarningsEvent) {
  let newsContext = "No recent news available.";
  try {
    const news = await fetchNews('Stock');
    newsContext = news.filter(n => n.title.includes(event.ticker) || n.title.includes(event.name.split(' ')[0])).slice(0, 4).map(n => n.title).join('\n');
  } catch (e) {}

  // Cache globally for 1 hour. Version bumped to v2 to clear old cache schema.
  const getCached = unstable_cache(
    async () => executeEarningsIntel(event, newsContext),
    [`earnings-intel-v2-${event.ticker}-${event.date}`],
    { revalidate: 3600 } 
  );

  return getCached();
}