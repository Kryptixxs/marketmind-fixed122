import { MarketDataProvider } from './types';
import { HybridProvider } from './providers/hybrid';

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    globalProvider = new HybridProvider();
  }
  return globalProvider;
}