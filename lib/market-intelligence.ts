import { Tick } from './marketdata/types';

export interface MarketInsight {
  strength: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  analysis: string;
  structure: 'BOS' | 'MSS' | 'Ranging' | 'Consolidation';
  levels: { support: number[]; resistance: number[] };
}

export function analyzeMarketState(tick: Tick): MarketInsight {
  const { price, changePercent, history = [] } = tick;
  
  // 1. Determine Sentiment & Strength based on Price Action
  const sentiment = changePercent > 0.2 ? 'Bullish' : changePercent < -0.2 ? 'Bearish' : 'Neutral';
  const strength = Math.min(Math.abs(changePercent) * 25 + 30, 98);

  // 2. Calculate Technical Levels (Pivot Points approximation)
  const support = [price * 0.995, price * 0.988];
  const resistance = [price * 1.005, price * 1.012];

  // 3. Detect Market Structure (ICT/SMC Logic)
  let structure: MarketInsight['structure'] = 'Ranging';
  if (history.length > 5) {
    const recent = history.slice(-5);
    const isHigherHighs = recent.every((v, i) => i === 0 || v >= recent[i-1]);
    const isLowerLows = recent.every((v, i) => i === 0 || v <= recent[i-1]);
    
    if (isHigherHighs) structure = 'BOS'; // Break of Structure (Bullish)
    else if (isLowerLows) structure = 'MSS'; // Market Structure Shift (Bearish)
  }

  // 4. Generate Narrative
  const biasText = sentiment === 'Bullish' ? 'expansion to the upside' : sentiment === 'Bearish' ? 'downward pressure' : 'sideways consolidation';
  const ictContext = structure === 'BOS' ? 'following a clear Break of Structure' : structure === 'MSS' ? 'indicating a potential Market Structure Shift' : 'within a defined range';
  
  const analysis = `${tick.symbol} is currently exhibiting ${biasText} ${ictContext}. Price is respecting local liquidity zones with immediate resistance at ${resistance[0].toFixed(2)}.`;

  return {
    strength: Math.round(strength),
    sentiment,
    analysis,
    structure,
    levels: { support, resistance }
  };
}

export function getMacroRegime(vix: number, dxy: number) {
  if (vix > 25) return { regime: 'Risk-Off', narrative: 'Volatility Expansion', score: 20 };
  if (vix < 15 && dxy < 102) return { regime: 'Risk-On', narrative: 'Liquidity Injection', score: 85 };
  return { regime: 'Neutral', narrative: 'Range-Bound', score: 50 };
}