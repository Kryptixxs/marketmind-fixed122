import { Impact } from './types';

export interface EventAsset {
  symbol: string;
  correlation: 'Positive' | 'Negative' | 'Neutral';
  weight: number; // 1-10 importance for this specific asset
  description: string;
}

export interface EventIntel {
  importanceScore: number; // 1-10
  volatility: 'Low' | 'Moderate' | 'High' | 'Extreme';
  logic: string;
  impactedAssets: EventAsset[];
  surpriseThreshold: number; // % deviation to trigger a 'Major Surprise'
}

const RULES: Record<string, Partial<EventIntel>> = {
  "Nonfarm Payrolls": {
    importanceScore: 10,
    volatility: 'Extreme',
    logic: "Primary labor market indicator. Higher than forecast is typically Bullish for the Currency and Bearish for Gold/Bonds due to rate hike expectations.",
    surpriseThreshold: 0.15,
    impactedAssets: [
      { symbol: 'DXY', correlation: 'Positive', weight: 10, description: 'Directly impacts USD strength and Fed policy path.' },
      { symbol: 'Gold', correlation: 'Negative', weight: 9, description: 'Inversely correlated with USD strength and yields.' },
      { symbol: 'S&P 500', correlation: 'Negative', weight: 7, description: 'High wage growth can signal inflation, hurting equities.' }
    ]
  },
  "CPI": {
    importanceScore: 10,
    volatility: 'High',
    logic: "Core inflation gauge. Deviations from consensus directly shift the 'higher for longer' interest rate narrative.",
    surpriseThreshold: 0.05,
    impactedAssets: [
      { symbol: 'USD/JPY', correlation: 'Positive', weight: 9, description: 'Highly sensitive to US-Japan yield differentials.' },
      { symbol: 'Nasdaq 100', correlation: 'Negative', weight: 8, description: 'Growth stocks are sensitive to inflation-driven rate hikes.' }
    ]
  },
  "GDP": {
    importanceScore: 8,
    volatility: 'Moderate',
    logic: "Broadest measure of economic activity. Strong growth supports the currency but may fuel inflation concerns.",
    surpriseThreshold: 0.20,
    impactedAssets: [
      { symbol: 'S&P 500', correlation: 'Positive', weight: 6, description: 'Reflects corporate earnings environment.' },
      { symbol: 'DXY', correlation: 'Positive', weight: 7, description: 'Stronger economy attracts foreign capital.' }
    ]
  },
  "Interest Rate Decision": {
    importanceScore: 10,
    volatility: 'Extreme',
    logic: "The single most important driver of currency value. Watch the statement for 'forward guidance' on future moves.",
    surpriseThreshold: 0.01,
    impactedAssets: [
      { symbol: 'All Pairs', correlation: 'Neutral', weight: 10, description: 'Global liquidity re-pricing event.' }
    ]
  }
};

export function getEventIntel(title: string, currency: string, impact: Impact): EventIntel {
  // 1. Find specific rule by keyword match
  const ruleKey = Object.keys(RULES).find(k => title.toLowerCase().includes(k.toLowerCase()));
  const rule = ruleKey ? RULES[ruleKey] : {};

  // 2. Determine base importance from the API impact level if not in rules
  const baseImportance = impact === 'High' ? 9 : impact === 'Medium' ? 6 : 3;

  // 3. Construct the intelligence object with fallbacks
  return {
    importanceScore: rule.importanceScore || baseImportance,
    volatility: rule.volatility || (impact === 'High' ? 'High' : 'Moderate'),
    logic: rule.logic || `Standard ${currency} economic release. Higher than expected values typically strengthen the ${currency}.`,
    surpriseThreshold: rule.surpriseThreshold || 0.10,
    impactedAssets: rule.impactedAssets || [
      { 
        symbol: currency, 
        correlation: 'Positive', 
        weight: 8, 
        description: `Primary impact on ${currency} pairs and local sovereign bond yields.` 
      }
    ]
  };
}