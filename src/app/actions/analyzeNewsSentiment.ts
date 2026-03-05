'use server';

import { generateAIJSON } from "@/lib/ai-utils";

export async function analyzeNewsSentiment(headlines: string[], assetName: string) {
  const fallback = { score: 0, label: "Neutral", summary: "Market awaiting definitive catalysts." };
  
  if (!headlines || headlines.length === 0) {
    return fallback;
  }

  const prompt = `You are a senior quantitative news desk analyst. 
    Analyze the following recent market headlines and determine the aggregate sentiment specifically regarding ${assetName}.
    
    Headlines:
    ${headlines.join('\n')}
    
    Provide a JSON response strictly matching this structure:
    {
      "score": number, // A value from -100 (Extremely Bearish/Risk-Off) to 100 (Extremely Bullish/Risk-On)
      "label": string, // A short 1-3 word string (e.g., "Risk-On", "Flight to Safety", "Hawkish Pressure")
      "summary": string // A 1-sentence summary of the dominant news narrative affecting the asset
    }`;

  // Cache globally for 1 hour based on the asset name
  return await generateAIJSON(prompt, fallback, `news-sentiment-v1-${assetName}`, 3600);
}