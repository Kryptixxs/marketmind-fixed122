'use server';

import { generateAIJSON } from "@/lib/ai-utils";

export async function analyzeNewsSentiment(headlines: string[]) {
  if (headlines.length === 0) return null;

  const prompt = `You are a senior news desk analyst at a major investment bank. 
    Analyze the following headlines and determine the aggregate market sentiment.
    
    Headlines:
    ${headlines.join('\n')}
    
    Provide a JSON response with:
    1. score: A value from -100 (Extremely Bearish/Risk-Off) to 100 (Extremely Bullish/Risk-On).
    2. label: A short string (e.g., "Risk-On", "Flight to Safety", "Hawkish Pressure").
    3. summary: A 1-sentence summary of the dominant news narrative.`;

  return await generateAIJSON(prompt);
}