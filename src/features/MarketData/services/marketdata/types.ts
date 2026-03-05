export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Tick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
  history?: OHLCV[];
  timestamp: number;
  name?: string;
}

export interface ProviderConfig {
  id: string;
  onTick?: (tick: Tick) => void;
  onError?: (err: Error) => void;
}

export interface MarketDataProvider {
  connect(config: ProviderConfig): void;
  disconnect(config: ProviderConfig): void;
  subscribe(symbols: string[]): void;
  unsubscribe(symbols: string[]): void;
  setInterval?(interval: string): void;
}