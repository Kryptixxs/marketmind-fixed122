export interface Tick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  marketState: string;
  history?: number[];
  timestamp: number;
  name?: string;
  source?: 'YAHOO' | 'SIMULATED';
  isStale?: boolean;
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
}