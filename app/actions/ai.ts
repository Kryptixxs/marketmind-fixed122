'use server';

import { GoogleGenAI, Type, Schema } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenAI(apiKey) : null;

// In-memory cache
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

// Rate limiting
const requestLog: number[] = [];
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

export async function callGeminiJSON<T>({
  system,
  user,
  schema,
  cacheKey
}: {
  system: string;
  user: string;
  schema: Schema;
  cacheKey?: string;
}): Promise<{ data: T; stale: boolean }> {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  // 1. Check Cache
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return { data: cached.data as T, stale: false };
    }
  }

  // 2. Rate Limit Guard
  const now = Date.now();
  while (requestLog.length > 0 && requestLog[0] < now - RATE_LIMIT_WINDOW) {
    requestLog.shift();
  }

  if (requestLog.length >= MAX_REQUESTS_PER_WINDOW) {
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached) return { data: cached.data as T, stale: true };
    }
    throw new Error("Rate limit exceeded. Please try again in a minute.");
  }

  requestLog.push(now);

  // 3. Call Gemini with Retries
  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: system,
      });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const text = result.response.text();
      if (!text) throw new Error("Empty response from Gemini");

      const parsed = JSON.parse(text) as T;

      // Update Cache
      if (cacheKey) {
        cache.set(cacheKey, { data: parsed, expiry: Date.now() + CACHE_TTL });
      }

      return { data: parsed, stale: false };
    } catch (err) {
      lastError = err;
      console.warn(`Gemini attempt ${attempt + 1} failed:`, err);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  // 4. Fallback to stale cache on total failure
  if (cacheKey) {
    const cached = cache.get(cacheKey);
    if (cached) return { data: cached.data as T, stale: true };
  }

  throw lastError || new Error("Failed to generate AI content after retries.");
}