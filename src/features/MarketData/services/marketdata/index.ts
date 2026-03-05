import { MarketDataProvider } from './types';
import { PolygonProvider } from './providers/polygon';

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    // Upgraded to true real-time WebSockets via Polygon.io
    globalProvider = new PolygonProvider(); 
  }
  return globalProvider;
}