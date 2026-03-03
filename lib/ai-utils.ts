import { GoogleGenerativeAI } from "@google/generative-ai";

const USER_KEY = "AIzaSyAX3dCFS5Yi8HryL9wC98IVAua71dki-zU";

export async function generateAIJSON(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || USER_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(prompt + "\n\nIMPORTANT: Return ONLY a valid JSON object. Do not include any markdown formatting, backticks, or explanatory text.");
    const response = await result.response;
    const text = response.text();
    
    console.log("[AI_RAW_RESPONSE]:", text);

    // Robust JSON extraction
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