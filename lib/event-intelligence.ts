import { EconomicEvent } from './types';

export interface ScenarioRow {
  label: string;
  probability: number; // 0-100
  reaction: string;
}

export interface AssetImpact {
  symbol: string;
  direction: 'UP' | 'DOWN' | 'SIDEWAYS';
  weight: number; // 1-10
  description: string;
}

export interface EventIntel {
  volatility: 'Low' | 'Moderate' | 'High' | 'Extreme';
  macroImpact: number; // 1-10
  logic: string;
  scenarios: ScenarioRow[];
  impactedAssets: AssetImpact[];
  surpriseThresholdPct: number;
  goodWhenHigher?: boolean;
  hawkishWhenHigher?: boolean;
}

export type SurpriseResult = {
  surprisePct?: number;
  classification: 'HOT' | 'COOL' | 'INLINE' | 'N/A';
  direction: 'ABOVE' | 'BELOW' | 'INLINE' | 'N/A';
  interpretation: 'BULLISH_RISK' | 'BEARISH_RISK' | 'HAWKISH' | 'DOVISH' | 'NEUTRAL' | 'N/A';
};

export function computeSurprise(
  event: { actual: string | null, forecast: string | null },
  intel?: EventIntel
): SurpriseResult {
  if (!event.actual || !event.forecast) {
    return { classification: 'N/A', direction: 'N/A', interpretation: 'N/A' };
  }
  
  const act = parseFloat(event.actual.replace(/[^0-9.-]/g, ''));
  const est = parseFloat(event.forecast.replace(/[^0-9.-]/g, ''));
  
  if (isNaN(act) || isNaN(est) || est === 0) {
    return { classification: 'N/A', direction: 'N/A', interpretation: 'N/A' };
  }
  
  const diff = act - est;
  const surprisePct = (diff / Math.abs(est)) * 100;
  
  let classification: 'HOT' | 'COOL' | 'INLINE' = 'INLINE';
  let direction: 'ABOVE' | 'BELOW' | 'INLINE' = 'INLINE';
  
  if (Math.abs(surprisePct) < 0.1) {
    classification = 'INLINE';
    direction = 'INLINE';
  } else if (surprisePct > 0) {
    classification = 'HOT';
    direction = 'ABOVE';
  } else {
    classification = 'COOL';
    direction = 'BELOW';
  }

  // Determine Interpretation based on polarity
  let interpretation: SurpriseResult['interpretation'] = 'NEUTRAL';
  
  if (direction === 'INLINE') {
    interpretation = 'NEUTRAL';
  } else if (intel?.hawkishWhenHigher !== undefined) {
    if (direction === 'ABOVE') interpretation = intel.hawkishWhenHigher ? 'HAWKISH' : 'DOVISH';
    else interpretation = intel.hawkishWhenHigher ? 'DOVISH' : 'HAWKISH';
  } else if (intel?.goodWhenHigher !== undefined) {
    if (direction === 'ABOVE') interpretation = intel.goodWhenHigher ? 'BULLISH_RISK' : 'BEARISH_RISK';
    else interpretation = intel.goodWhenHigher ? 'BEARISH_RISK' : 'BULLISH_RISK';
  } else {
    // Default fallback: Higher is Bullish
    interpretation = direction === 'ABOVE' ? 'BULLISH_RISK' : 'BEARISH_RISK';
  }
  
  return { surprisePct, classification, direction, interpretation };
}

const RULES: Record<string, Partial<EventIntel>> = {
  "CPI": {
    volatility: 'High',
    macroImpact: 10,
    hawkishWhenHigher: true,
    logic: "Core inflation gauge. Higher than forecast is Hawkish for USD (rate hike expectations) and Bearish for Equities/Bonds.",
    surpriseThresholdPct: 5,
    impactedAssets: [
      { symbol: 'DXY', direction: 'UP', weight: 10, description: 'USD strength on hawkish Fed pivot.' },
      { symbol: '2Y Yield', direction: 'UP', weight: 9, description: 'Short-term rates re-pricing higher.' },
      { symbol: 'Nasdaq 100', direction: 'DOWN', weight: 8, description: 'Growth stocks hit by higher discount rates.' }
    ],
    scenarios: [
      { label: 'Hot Print', probability: 25, reaction: 'Aggressive USD buying, Tech sell-off.' },
      { label: 'In-Line', probability: 50, reaction: 'Choppy price action, focus shifts to next data point.' },
      { label: 'Cool Print', probability: 25, reaction: 'USD weakness, Equities rally on "soft landing" hopes.' }
    ]
  },
  "Nonfarm Payrolls": {
    volatility: 'Extreme',
    macroImpact: 10,
    goodWhenHigher: true,
    logic: "Primary labor market health indicator. Stronger NFP suggests a resilient economy, supporting USD but potentially delaying rate cuts.",
    surpriseThresholdPct: 15,
    impactedAssets: [
      { symbol: 'DXY', direction: 'UP', weight: 10, description: 'USD strength on economic resilience.' },
      { symbol: 'S&P 500', direction: 'SIDEWAYS', weight: 7, description: 'Tug-of-war between growth and rate fears.' },
      { symbol: 'Gold', direction: 'DOWN', weight: 8, description: 'USD strength weighs on bullion.' }
    ],
    scenarios: [
      { label: 'Beat (>250k)', probability: 30, reaction: 'USD spike, yields up, stocks mixed.' },
      { label: 'In-Line', probability: 45, reaction: 'Market stays on current trend.' },
      { label: 'Miss (<100k)', probability: 25, reaction: 'USD sell-off, recession fears may surface.' }
    ]
  },
  "FOMC": {
    volatility: 'Extreme',
    macroImpact: 10,
    logic: "The single most important driver of global liquidity. Watch the statement and dot plot for future rate path guidance.",
    surpriseThresholdPct: 1,
    impactedAssets: [
      { symbol: 'All Assets', direction: 'SIDEWAYS', weight: 10, description: 'Global re-pricing event across all asset classes.' }
    ],
    scenarios: [
      { label: 'Hawkish', probability: 20, reaction: 'USD up, Stocks down, Yields up.' },
      { label: 'Neutral', probability: 60, reaction: 'Focus on Powell press conference.' },
      { label: 'Dovish', probability: 20, reaction: 'USD down, Stocks up, Yields down.' }
    ]
  },
  "GDP": {
    volatility: 'Moderate',
    macroImpact: 8,
    goodWhenHigher: true,
    logic: "Broadest measure of economic activity. Strong growth supports the currency but may fuel inflation concerns.",
    surpriseThresholdPct: 10,
    impactedAssets: [
      { symbol: 'S&P 500', direction: 'UP', weight: 6, description: 'Reflects corporate earnings environment.' },
      { symbol: 'DXY', direction: 'UP', weight: 7, description: 'Stronger economy attracts foreign capital.' }
    ],
    scenarios: [
      { label: 'Strong Growth', probability: 30, reaction: 'Risk-on sentiment, USD strength.' },
      { label: 'Stagnation', probability: 50, reaction: 'Neutral to slightly negative for equities.' },
      { label: 'Contraction', probability: 20, reaction: 'Recession fears, flight to safety (Bonds/Gold).' }
    ]
  },
  "Jobless Claims": {
    volatility: 'Moderate',
    macroImpact: 6,
    goodWhenHigher: false, // Higher claims = Bad for economy
    logic: "High-frequency labor market data. Rising claims signal cooling, which markets currently view as 'good news' for rate cuts.",
    surpriseThresholdPct: 5,
    impactedAssets: [
      { symbol: '2Y Yield', direction: 'DOWN', weight: 7, description: 'Sensitivity to labor market cooling.' },
      { symbol: 'Nasdaq 100', direction: 'UP', weight: 6, description: 'Benefit from lower rate expectations.' }
    ],
    scenarios: [
      { label: 'Spike (>230k)', probability: 20, reaction: 'Yields down, Stocks up (Rate cut hopes).' },
      { label: 'Stable', probability: 60, reaction: 'No change to current macro narrative.' },
      { label: 'Low (<200k)', probability: 20, reaction: 'Yields up, Stocks down (Higher for longer).' }
    ]
  }
};

export function getEventIntel(event: EconomicEvent): EventIntel {
  const title = event.title.toLowerCase();
  const ruleKey = Object.keys(RULES).find(k => title.includes(k.toLowerCase()));
  const rule = ruleKey ? RULES[ruleKey] : null;

  if (rule) {
    return {
      volatility: rule.volatility || 'Moderate',
      macroImpact: rule.macroImpact || 5,
      logic: rule.logic || '',
      scenarios: rule.scenarios || [],
      impactedAssets: rule.impactedAssets || [],
      surpriseThresholdPct: rule.surpriseThresholdPct || 10,
      goodWhenHigher: rule.goodWhenHigher,
      hawkishWhenHigher: rule.hawkishWhenHigher
    };
  }

  // Fallback
  const isUSD = event.currency === 'USD';
  return {
    volatility: event.impact === 'High' ? 'High' : 'Moderate',
    macroImpact: event.impact === 'High' ? 8 : 4,
    logic: `Standard ${event.currency} release. ${isUSD ? 'USD' : event.currency} pairs will react to deviations from forecast.`,
    scenarios: [
      { label: 'Beat', probability: 33, reaction: `Positive for ${event.currency}.` },
      { label: 'In-Line', probability: 34, reaction: 'Neutral reaction.' },
      { label: 'Miss', probability: 33, reaction: `Negative for ${event.currency}.` }
    ],
    impactedAssets: [
      { symbol: event.currency, direction: 'UP', weight: 8, description: `Primary impact on ${event.currency} crosses.` }
    ],
    surpriseThresholdPct: 10,
    goodWhenHigher: true // Default assumption
  };
}