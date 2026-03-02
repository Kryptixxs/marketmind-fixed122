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
  surprise?: number | null; // Calculated % diff
  timestamp: number;
}

export interface EarningsEvent {
  id: string;
  ticker: string;
  name: string;
  date: string;
  time: 'bmo' | 'amc' | 'tbd'; // Before Market Open, After Market Close
  epsEst: number | null;
  epsAct: number | null;
  revEst: number | null; // In Billions
  revAct: number | null;
  surprise: number | null;
  sector: string;
  marketCap: string; // e.g. "2.4T"
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

export interface UserSettings {
  theme: 'dark' | 'light';
  notifications: boolean;
  filters: {
    minImpact: Impact;
    countries: string[];
    sectors: string[];
  };
}