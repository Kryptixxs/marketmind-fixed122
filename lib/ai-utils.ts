import OpenAI from 'openai';

export async function generateAIJSON(prompt: string, fallback: any = null) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("[AI_UTILS]: No API key found. Using deterministic fallback.");
    return fallback;
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a senior institutional macro strategist. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      timeout: 5000 // 5s timeout to prevent UI hanging
    });

    const text = response.choices[0].message.content;
    return text ? JSON.parse(text) : fallback;
  } catch (error) {
    console.error("[AI_UTILS_ERROR]:", error);
    return fallback;
  }
}