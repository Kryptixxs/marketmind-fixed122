import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
async function test() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'What is the current price of AAPL?',
    config: { 
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: { type: Type.OBJECT, properties: { price: { type: Type.NUMBER } } }
    }
  });
  console.log(response.text);
}
test().catch(console.error);
