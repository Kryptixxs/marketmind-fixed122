import { GoogleGenAI } from '@google/genai';
import { unstable_cache } from 'next/cache';

async function executeGeminiCall(prompt: string, fallback: any = null) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("[AI_UTILS]: No Gemini API key found. Using deterministic fallback.");
    return fallback;
  }

  // 3-attempt retry loop for maximum stability
  let retries = 3;
  while (retries > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt + "\n\nCRITICAL INSTRUCTION: You must return ONLY raw, valid JSON. Do not wrap the response in ```json or ``` tags. No markdown. Just the raw JSON object.",
      });

      let text = response.text || "";
      
      // Aggressively clean any markdown that the AI stubbornly includes
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

      return JSON.parse(text);
    } catch (error) {
      console.warn(`[AI_UTILS_ERROR] Parsing or Rate Limit failed. Retries left: ${retries - 1}`, error);
      retries--;
      if (retries === 0) break;
      // Wait 2 seconds before retrying to let rate limits cool down
      await new Promise(res => setTimeout(res, 2000));
    }
  }
  
  return fallback;
}

/**
 * Generates an AI JSON response.
 * If a `cacheKey` is provided, the result is cached GLOBALLY on the server for `revalidateSecs` (default 1 hour).
 * All subsequent requests across all users will hit the cache instantly without calling the API.
 */
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