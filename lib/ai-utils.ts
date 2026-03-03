import { GoogleGenAI } from '@google/genai';

export async function generateAIJSON(prompt: string, fallback: any = null) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("[AI_UTILS]: No Gemini API key found. Using deterministic fallback.");
    return fallback;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2 // Low temperature for more analytical/deterministic outputs
      }
    });

    const text = response.text;
    if (!text) return fallback;

    return JSON.parse(text);
  } catch (error) {
    console.error("[AI_UTILS_ERROR]:", error);
    return fallback;
  }
}