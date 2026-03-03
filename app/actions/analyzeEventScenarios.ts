'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { fetchEconomicCalendarBatch } from "./fetchEconomicCalendar";
import { toISODateString } from "@/lib/date-utils";

export async function analyzeEventScenarios() {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const calendar = await fetchEconomicCalendarBatch([toISODateString(today), toISODateString(tomorrow)]);
    const allEvents = Object.values(calendar).flat();
    
    const nextHighImpact = allEvents
      .filter(e => e.impact === 'High')
      .sort((a, b) => a.time.localeCompare(b.time))[0];

    if (!nextHighImpact) {
      return {
        eventName: "No High Impact Events",
        scenarios: [
          { label: "Consolidation", probability: 70, reaction: "Market likely to range-trade.", bias: "NEUTRAL" },
          { label: "Technical Breakout", probability: 20, reaction: "Price action driven by technical levels.", bias: "NEUTRAL" },
          { label: "Headline Risk", probability: 10, reaction: "Unscheduled news could drive volatility.", bias: "NEUTRAL" }
        ],
        tradeImplication: "Focus on technical setups and intraday liquidity sweeps."
      };
    }

    const fallback = {
      eventName: nextHighImpact.title,
      scenarios: [
        { label: "Beat", probability: 33, reaction: "Bullish reaction expected.", bias: "BULLISH" },
        { label: "In-Line", probability: 34, reaction: "Neutral / Choppy reaction.", bias: "NEUTRAL" },
        { label: "Miss", probability: 33, reaction: "Bearish reaction expected.", bias: "BEARISH" }
      ],
      tradeImplication: `Watch for ${nextHighImpact.currency} volatility at ${nextHighImpact.time}.`
    };

    const prompt = `Analyze the upcoming economic event: ${nextHighImpact.title} (${nextHighImpact.country}).
      Provide a JSON response with eventName, scenarios, and tradeImplication.`;

    return await generateAIJSON(prompt, fallback);
  } catch (error) {
    return null;
  }
}