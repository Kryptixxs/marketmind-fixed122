import { MarketDataProvider } from './types';
import { PolygonProvider } from './providers/polygon';

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    // Using the real-time Polygon provider which connects to live WebSockets
    // and falls back to Yahoo Finance for indices/commodities.
    globalProvider = new PolygonProvider(); 
  }
  return globalProvider;
}