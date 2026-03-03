import { GoogleGenAI } from '@google/genai';

export async function generateAIJSON(prompt: string, fallback: any = null) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn("[AI_UTILS]: No Gemini API key found. Using deterministic fallback.");
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      // Force the AI to output raw JSON without markdown wrappers
      contents: prompt + "\n\nCRITICAL INSTRUCTION: You must return ONLY raw, valid JSON. Do not wrap the response in ```json or ``` tags. No markdown. Just the raw JSON object.",
    });

    let text = response.text || "";
    
    // Aggressively clean any markdown that the AI stubbornly includes
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("[AI_UTILS_ERROR] Parsing failed. The AI likely returned malformed data:", error);
    return fallback;
  }
}