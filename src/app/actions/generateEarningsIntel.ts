'use server';

import { GoogleGenAI, Type } from "@google/genai";
import { EarningsEvent } from "@/lib/types";
import { unstable_cache } from "next/cache";
import { fetchNews } from "./fetchNews";

async function executeEarningsIntel(event: EarningsEvent, newsContext: string) {
  const fallback = {
    sentiment: "Neutral",
    expectedMove: "+/- 4.5%",
    institutionalBias: "Markets are pricing in average historical volatility for this report.",
    keyMetrics: ["Forward Guidance", "Revenue Growth", "Operating Margins"],
    analysis: `${event.ticker} earnings act as a binary catalyst. Institutional focus will be heavily weighted on forward guidance and executive commentary regarding macroeconomic headwinds.`
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Senior Equity Research Analyst at a top-tier hedge fund. 
    Analyze the upcoming earnings report for ${event.name} (${event.ticker}).
    
    EVENT DATA:
    EPS Estimate: ${event.epsEst || 'N/A'}
    Release Time: ${event.time === 'bmo' ? 'Before Market Open' : event.time === 'amc' ? 'After Market Close' : 'TBD'}
    
    LIVE NEWS CONTEXT:
    ${newsContext}

    Provide a highly specific JSON response matching this schema:
    - sentiment: "Bullish", "Bearish", or "Neutral"
    - expectedMove: estimated options implied move (e.g. "+/- 6.2%")
    - institutionalBias: 1 sentence on how smart money is positioned going into the print
    - keyMetrics: Array of 3 exact metrics analysts are watching (e.g. ["Cloud Revenue", "Gross Margins", "China Sales"])
    - analysis: A 2-sentence institutional breakdown of what to expect and what constitutes a "beat".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING },
            expectedMove: { type: Type.STRING },
            institutionalBias: { type: Type.STRING },
            keyMetrics: { type: Type.ARRAY, items: { type: Type.STRING } },
            analysis: { type: Type.STRING },
          },
          required: ["sentiment", "expectedMove", "institutionalBias", "keyMetrics", "analysis"]
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
    newsContext = news.filter(n => n.title.includes(event.ticker) || n.title.includes(event.name.split(' ')[0])).slice(0, 3).map(n => n.title).join('\n');
  } catch (e) {}

  // Cache globally for 1 hour to prevent API rate limits
  const getCached = unstable_cache(
    async () => executeEarningsIntel(event, newsContext),
    [`earnings-intel-v1-${event.ticker}-${event.date}`],
    { revalidate: 3600 } 
  );

  return getCached();
}