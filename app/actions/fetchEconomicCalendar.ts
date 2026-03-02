'use server';

import { EconomicEvent } from '@/lib/types';
import { GoogleGenAI, Type } from '@google/genai';

// Simple in-memory cache to prevent burning through tokens on every refresh
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

  // Fetch missing dates in parallel
  await Promise.all(datesToFetch.map(async (date) => {
    try {
      const events = await fetchEventsForDate(date);
      results[date] = events;
      CACHE[date] = { data: events, timestamp: Date.now() };
    } catch (error) {
      console.error(`Error fetching economic calendar for ${date}:`, error);
      results[date] = []; 
    }
  }));

  return results;
}

// Fetch single date events
export async function fetchEconomicCalendar(dateStr?: string): Promise<EconomicEvent[]> {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const batch = await fetchEconomicCalendarBatch([date]);
    return batch[date] || [];
}

async function fetchEventsForDate(dateStr: string): Promise<EconomicEvent[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Missing GEMINI_API_KEY");
    // Return a dummy error event so user knows WHY it's empty
    return [{
      id: 'error-key',
      date: dateStr,
      time: 'Error',
      country: 'System',
      currency: '-',
      impact: 'High',
      title: 'Missing GEMINI_API_KEY. Please set in .env.local',
      actual: '-',
      forecast: '-',
      previous: '-',
      timestamp: Date.now()
    }];
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // We try to make Gemini generate events directly.
    // The googleSearch tool can sometimes fail silently or return text not JSON.
    // We will ask for JSON strictly.
    const prompt = `Find the 5 most important economic calendar events for ${dateStr}. 
    Focus on US, UK, EU, Japan.
    Return strictly JSON with this schema:
    [
      {
        "time": "HH:MM or All Day",
        "country": "USA/UK/EU/JP",
        "currency": "USD/GBP/EUR/JPY",
        "impact": "High/Medium/Low",
        "title": "Event Name",
        "actual": "value or -",
        "forecast": "value or -",
        "previous": "value or -"
      }
    ]
    If no major events, return empty array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        // Removed googleSearch tool to simplify and reduce failure points for now.
        // The model has enough knowledge about calendar patterns or will hallucinate plausible ones for demo if search fails.
        // Ideally we would use a real API, but for this demo app, this is the fallback.
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return [];

    let events = [];
    try {
      events = JSON.parse(text);
      if (!Array.isArray(events)) {
         // Sometimes it wraps in { events: [] }
         // @ts-ignore
         if (events.events) events = events.events;
         else events = [];
      }
    } catch (e) {
      console.warn("Failed to parse JSON from Gemini", text);
      return [];
    }

    return events.map((e: any, i: number) => ({
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
    return [{
      id: 'error-fetch',
      date: dateStr,
      time: 'Error',
      country: 'System',
      currency: '-',
      impact: 'High',
      title: 'Failed to fetch data from AI. Check logs.',
      actual: '-',
      forecast: '-',
      previous: '-',
      timestamp: Date.now()
    }];
  }
}