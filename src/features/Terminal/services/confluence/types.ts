export type ConfluenceCategory = 
  | 'STRUCTURE' | 'SMC' | 'SR' | 'MA' | 'MOMENTUM' 
  | 'VOLUME' | 'CANDLE' | 'FIB' | 'TIME' | 'DERIVATIVES' 
  | 'INTERMARKET' | 'FUNDAMENTAL' | 'QUANT' | 'VOLATILITY';

export interface ConfluenceResult {
  id: string;
  label: string;
  category: ConfluenceCategory;
  isActive: boolean;
  value?: string | number;
  score: number; // 0-100 confidence/strength
  description: string;
}

export interface MarketSnapshot {
  symbol: string;
  interval: string;
  quotes: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}