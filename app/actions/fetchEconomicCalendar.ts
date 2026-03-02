'use server';

import { EconomicEvent } from '@/lib/types';
import { GoogleGenAI, Type } from '@google/genai';

// Simple in-memory cache to prevent burning through tokens on every refresh
// In production, this should be Redis
const CACHE: Record<string, { data: EconomicEvent[], timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function fetchEconomicCalendarBatch(dates: string[]): Promise<Record<string, EconomicEvent[]>> {
  const results: Record<string, EconomicEvent[]> = {};
  const datesToFetch: string[] = [];

  // Check cache first
  for (const date of dates) {
    const cached = CACHE[date];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      results[date] = cached.data;
    } else {
      datesToFetch.push(date);
    }
  }

  if (datesToFetch.length === 0) {
    return results;
  }

  // Fetch missing dates in parallel (limit concurrency if needed)
  await Promise.all(datesToFetch.map(async (date) => {
    try {
      const events = await fetchEventsForDate(date);
      results[date] = events;
      CACHE[date] = { data: events, timestamp: Date.now() };
    } catch (error) {
      console.error(`Error fetching economic calendar for ${date}:`, error);
      results[date] = []; // Return empty on error to not break UI
    }
  }));

  return results;
}

// Fetch single date events
// We also export this for the dashboard widget
export async function fetchEconomicCalendar(dateStr?: string): Promise<EconomicEvent[]> {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const batch = await fetchEconomicCalendarBatch([date]);
    return batch[date] || [];
}

async function fetchEventsForDate(dateStr: string): Promise<EconomicEvent[]> {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    console.warn("Missing GEMINI_API_KEY");
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
    
    // We ask for specific high-fidelity data
    const prompt = `Find the actual economic calendar events for ${dateStr}. 
    Include major events for US, UK, EU, Japan, Canada, Australia.
    Return a list of events with:
    - Time (in UTC or specified timezone, convert to local if possible but UTC is fine)
    - Country (e.g. USA, UK, Euro Zone)
    - Currency (USD, GBP, EUR, etc)
    - Impact (High, Medium, Low)
    - Title (Event name)
    - Actual (value if released, else "-")
    - Forecast (value if available, else "-")
    - Previous (value)
    
    Strictly JSON format.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  country: { type: Type.STRING },
                  currency: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
                  title: { type: Type.STRING },
                  actual: { type: Type.STRING },
                  forecast: { type: Type.STRING },
                  previous: { type: Type.STRING },
                },
                required: ["time", "country", "currency", "impact", "title"]
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    
    if (!data.events || !Array.isArray(data.events)) {
      return [];
    }

    return data.events.map((e: any, i: number) => ({
      id: `${dateStr}-${i}`,
      date: dateStr,
      time: e.time || 'All Day',
      country: e.country,
      currency: e.currency,
      impact: e.impact,
      title: e.title,
      actual: e.actual || '-',
      forecast: e.forecast || '-',
      previous: e.previous || '-',
      timestamp: new Date(`${dateStr}T${e.time || '00:00'}`).getTime()
    }));

  } catch (error) {
    console.error("Gemini fetch error:", error);
    return [];
  }
}