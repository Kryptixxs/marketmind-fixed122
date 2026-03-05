import { MarketDataProvider } from './types';

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider | null {
  // Prevent server-side instantiation of browser-only providers
  if (typeof window === 'undefined') return null;

  if (!globalProvider) {
    // We use a dynamic require here to ensure the PolygonProvider (which uses WebSocket)
    // is never even evaluated by the server-side bundler.
    const { PolygonProvider } = require('./providers/polygon');
    globalProvider = new PolygonProvider(); 
  }
  return globalProvider;
}