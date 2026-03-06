import { GoogleGenAI } from '@google/genai';
import { unstable_cache } from 'next/cache';
import { getRateLimiter } from './rate-limiter';

const geminiLimiter = getRateLimiter('gemini', 10, 60_000);

async function executeGeminiCall(prompt: string, fallback: any = null) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("[AI] No Gemini API key. Using fallback.");
    return fallback;
  }

  let retries = 2;
  while (retries >= 0) {
    try {
      const result = await geminiLimiter.execute(async () => {
        const ai = new GoogleGenAI({ apiKey });
        return ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt + "\n\nCRITICAL: Return ONLY raw valid JSON. No markdown fences, no explanation.",
        });
      });

      let text = result.text || "";
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      retries--;
      if (retries < 0) break;
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  return fallback;
}

export async function generateAIJSON(prompt: string, fallback: any = null, cacheKey?: string, revalidateSecs: number = 3600) {
  if (cacheKey) {
    const cachedCall = unstable_cache(
      async () => executeGeminiCall(prompt, fallback),
      [cacheKey],
      { tags: [cacheKey], revalidate: revalidateSecs }
    );
    return cachedCall();
  }

  return executeGeminiCall(prompt, fallback);
}
