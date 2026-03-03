import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateAIJSON(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(prompt + "\n\nIMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, backticks, or explanatory text.");
    const response = await result.response;
    const text = response.text();
    
    // Robust JSON extraction in case of LLM fluff
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("[AI_GENERATION_ERROR]:", error);
    return null;
  }
}