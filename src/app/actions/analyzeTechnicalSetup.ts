'use server';

import { generateAIJSON } from "@/lib/ai-utils";
import { yahooFinance } from '@/lib/yahoo-client';
import { analyzeNewsSentiment } from "./analyzeNewsSentiment";
import { fetchNews } from "./fetchNews";

export async function analyzeTechnicalSetup(symbol: string) {
  try {
    // 1. Concurrent Data Ingestion (Price + Alternative Data)
    const [chartData, rawNews] = await Promise.all([
      yahooFinance.chart(symbol, {
        interval: '15m',
        period1: new Date(Date.now() - 3 * 86400000)
      }) as any,
      fetchNews(symbol === 'BTC-USD' ? 'Crypto' : 'General').catch(() => [])
    ]);

    if (!chartData?.quotes || chartData.quotes.length < 20) return null;

    // 2. Process NLP Sentiment
    const headlines = rawNews.slice(0, 15).map((n: any) => n.title);
    const sentimentPayload = await analyzeNewsSentiment(headlines, symbol);
    const nlpScore = sentimentPayload?.score || 0; // -100 to 100

    // 3. Process Quantitative Price Math
    const quotes = chartData.quotes.filter((q: any) => q.close !== null);
    const prices = quotes.map((q: any) => q.close as number);
    const volumes = quotes.map((q: any) => q.volume as number);
    const currentPrice = prices[prices.length - 1];

    let cumulativePrcVol = 0;
    let cumulativeVol = 0;
    for (let i = 0; i < prices.length; i++) {
      cumulativePrcVol += prices[i] * volumes[i];
      cumulativeVol += volumes[i];
    }
    const vwap = cumulativeVol > 0 ? cumulativePrcVol / cumulativeVol : currentPrice;

    const bbPeriod = 20;
    const slice = prices.slice(-bbPeriod);
    const sma = slice.reduce((a: number, b: number) => a + b, 0) / slice.length;
    const variance = slice.reduce((a: number, b: number) => a + Math.pow(b - sma, 2), 0) / slice.length;
    const stdDev = Math.sqrt(variance);
    const bbUpper = sma + (2 * stdDev);
    const bbLower = sma - (2 * stdDev);

    const atrPeriod = 14;
    let trSum = 0;
    const atrs = [];
    for (let i = prices.length - atrPeriod; i < prices.length; i++) {
      const tr = Math.abs(prices[i] - (prices[i - 1] || prices[i]));
      trSum += tr;
      atrs.push(tr);
    }
    const avgAtr = trSum / atrPeriod;
    const recentAtr = atrs.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
    const isVCP = recentAtr < (avgAtr * 0.75); // Volatility Contraction

    // 4. Volume Price Analysis (VPA)
    const recentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-bbPeriod).reduce((a: number, b: number) => a + b, 0) / bbPeriod;
    const isVolumeClimax = recentVolume > (avgVolume * 2.5); // Institutional footprints

    // 5. Multi-Factor Correlation (The Alpha Agent Scoring)
    let quantScore = 0;

    // Tech Factor
    if (currentPrice > vwap) quantScore += 2;
    if (currentPrice < vwap) quantScore -= 2;
    if (isVolumeClimax && currentPrice > sma) quantScore += 3; // Buying climax
    if (isVolumeClimax && currentPrice < sma) quantScore -= 3; // Selling climax

    // Alt Data Factor
    if (nlpScore > 40) quantScore += 3;
    if (nlpScore < -40) quantScore -= 3;
    if (nlpScore > 0 && currentPrice > vwap) quantScore += 2; // Fundamental/Technical Alignment

    const isBOS = currentPrice > Math.max(...prices.slice(-20, -1)) && currentPrice > vwap;
    const isMSS = currentPrice < Math.min(...prices.slice(-20, -1)) && currentPrice < vwap;

    // Advanced Fallback Object
    const fallback = {
      bias: quantScore > 4 ? "BULLISH" : quantScore < -4 ? "BEARISH" : "NEUTRAL",
      structure: isVCP ? "Volatility Contraction (VCP)" : isBOS ? "BOS (Bullish)" : isMSS ? "MSS (Bearish)" : "Mean Reversion",
      liquiditySweeps: currentPrice > vwap ? ["Accumulation Profile"] : ["Distribution Profile"],
      fvgs: [`VWAP: ${vwap.toFixed(2)}`, `BB Upper: ${bbUpper.toFixed(2)}`, `BB Lower: ${bbLower.toFixed(2)}`],
      levels: {
        support: [bbLower, vwap > currentPrice ? vwap : currentPrice - (avgAtr * 2)].map(n => Number(n.toFixed(2))),
        resistance: [bbUpper, vwap < currentPrice ? vwap : currentPrice + (avgAtr * 2)].map(n => Number(n.toFixed(2)))
      },
      setup: isVolumeClimax ? "Wait for Volume Climax Exhaustion" : isVCP ? "Wait for explosive volatility expansion breakout." : quantScore > 4 ? "Long pullback to VWAP." : quantScore < -4 ? "Short premium retracement to VWAP." : "Scalp between Keltner/Bollinger Bands.",
      confidence: Math.min(Math.abs(quantScore) * 10 + (isVCP ? 20 : 0) + 40, 95)
    };

    const prompt = `Act as a Level 5 Multi-Modal Alpha Agent. Analyze this correlated data for ${symbol}:
      
      [PRICE DATA]
      Current Price: ${currentPrice.toFixed(2)}
      VWAP (Volume Weighted Avg Price): ${vwap.toFixed(2)}
      Bollinger Bands (20, 2): Upper ${bbUpper.toFixed(2)}, Lower ${bbLower.toFixed(2)}
      
      [VOLATILITY & ORDER FLOW]
      Volatility Contraction (VCP): ${isVCP ? 'YES - High breakout probability' : 'NO - Normal volatility'}
      Volume Price Analysis: ${isVolumeClimax ? 'ABNORMAL INSTITUTIONAL VOLUME SPIKE DETECTED' : 'Normal retail volume flow'}
      Market Structure: ${fallback.structure}

      [ALTERNATIVE DATA (NLP)]
      Current Narrative Score: ${nlpScore} (-100 to 100)
      Current Narrative: "${sentimentPayload?.summary || 'Neutral Data'}"
      Fundamental/Technical Alignment: ${Math.sign(nlpScore) === Math.sign(currentPrice - vwap) ? 'ALIGNED - HIGH CONVICTION' : 'DIVERGENT - RISK WARNING'}

      Formulate a highly probable, risk-adjusted setup using ALL these quant metrics (combining the news narrative impact directly against the mathematical volatility state).
      Provide a strict JSON response EXACTLY matching this schema: 
      { 
        "bias": "BULLISH" | "BEARISH" | "NEUTRAL", 
        "structure": "string", 
        "liquiditySweeps": ["string"], 
        "fvgs": ["string"], 
        "levels": { "support": [number, number], "resistance": [number, number] }, 
        "setup": "string", 
        "confidence": number 
      }`;

    // Cache globally for 1 hour based on the symbol
    return await generateAIJSON(prompt, fallback, `tech-setup-v1-${symbol}`, 3600);
  } catch (error) {
    console.error("Alpha Agent Quant Error:", error);
    return null;
  }
}