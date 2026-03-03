import OpenAI from 'openai';

export async function generateAIJSON(prompt: string) {
  // Using the key provided in the environment
  const apiKey = process.env.OPENAI_API_KEY || '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';
  
  if (!apiKey) return null;

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a senior institutional macro strategist. Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const text = response.choices[0].message.content;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("[OPENAI_ERROR]:", error);
    return null;
  }
}