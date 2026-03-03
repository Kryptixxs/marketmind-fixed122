'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import YahooFinance from 'yahoo-finance2';
import { fetchNews } from "./fetchNews";

const yahooFinance = new YahooFinance({ 
  suppressNotices: ['yahooSurvey', 'ripHistorical'],
});

export async function analyzeMarketPositioning() {
  try {
    const [vix, dxy, news] = await Promise.all([
      yahooFinance.quote('^VIX'),
      yahooFinance.quote('DX-Y.NYB'),
      fetchNews('General')
    ]);

    const newsContext = news.slice(0, 10).map(n => n.title).join('\n');

    const prompt = `You are a macro positioning expert. Estimate current market positioning based on these indicators and news.
      
      Indicators:
      - VIX: ${vix?.regularMarketPrice}
      - DXY: ${dxy?.regularMarketPrice}
      
      News Context:
      ${newsContext}
      
      Provide a JSON response with:
      - dxyPositioning: string
      - futuresPositioning: string
      - optionsImplied: string
      - volatilityRegime: string
      - liquidityIndex: number (0-100)
      - gammaExposure: string
      - riskRegime: "STABLE" | "VOLATILE" | "EXTREME"
      - metrics: { dxy: "positive"|"negative"|"neutral", futures: "positive"|"negative"|"neutral", options: "positive"|"negative"|"neutral", volatility: "positive"|"negative"|"neutral", liquidity: "positive"|"negative"|"neutral", gamma: "positive"|"negative"|"neutral" }`;

    return await generateAIJSON(prompt);
  } catch (error) {
    console.error("Positioning analysis error:", error);
    return null;
  }
}