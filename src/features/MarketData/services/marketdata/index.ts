import { MarketDataProvider } from './types';
import { MockStreamingProvider } from './providers/mock-stream';

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    // Using the LiveSync provider (MockStreamingProvider) which anchors to real data
    // but provides high-frequency visual updates for a true terminal feel.
    globalProvider = new MockStreamingProvider(); 
  }
  return globalProvider;
}