export type Impact = 'High' | 'Medium' | 'Low';

export interface EconomicEvent {
  id: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:mm
  country: string;
  currency: string;
  impact: Impact;
  title: string;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  surprise?: number | null;
  timestamp: number;
}

export interface EventAIIntelligence {
  summary: string;
  whyItMatters: string[];
  marketLogic: string;
  volatility: 'Low' | 'Moderate' | 'High' | 'Extreme';
  macroImpact: number;
  riskLevel: 'Standard' | 'Elevated' | 'Critical';
  surpriseThresholdPct: number;
  scenarios: {
    name: 'Beat' | 'Inline' | 'Miss';
    probability: number;
    reaction: string;
  }[];
  impactedAssets: {
    symbol: string;
    direction: 'UP' | 'DOWN' | 'MIXED';
    weight: number;
    note: string;
  }[];
  tradeSetups: {
    setup: string;
    trigger: string;
    risk: string;
  }[];
  confidence: number;
  stale?: boolean;
}

export interface EarningsEvent {
  id: string;
  ticker: string;
  name: string;
  date: string;
  time: 'bmo' | 'amc' | 'tbd';
  epsEst: number | null;
  epsAct: number | null;
  revEst: number | null;
  revAct: number | null;
  surprise: number | null;
  sector: string;
  marketCap: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: number;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  symbols: string[];
}