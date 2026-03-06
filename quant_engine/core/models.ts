export enum OrderSide { BUY = "BUY", SELL = "SELL" }
export enum OrderType { MARKET = "MARKET", LIMIT = "LIMIT", STOP = "STOP" }

export interface Bar {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  unrealizedPnl: number;
}

export interface Allocation {
  symbol: string;
  weight: number; // 0.0 to 1.0
  shares: number;
}