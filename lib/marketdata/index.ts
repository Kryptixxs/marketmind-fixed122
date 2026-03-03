import { MarketDataProvider } from './types';
import { YahooPollingProvider } from './providers/yahoo-polling';
import { MockStreamingProvider } from './providers/mock-stream';

// Set to true to enable the high-frequency streaming simulation
const USE_MOCK_STREAM = true; 

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    if (USE_MOCK_STREAM) {
      // Provides sub-second updates for a "live" terminal feel
      globalProvider = new MockStreamingProvider();
    } else {
      // Fallback to real Yahoo Finance polling (30s interval)
      globalProvider = new YahooPollingProvider(30000);
    }
  }
  return globalProvider;
}