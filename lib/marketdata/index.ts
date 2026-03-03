import { MarketDataProvider } from './types';
import { YahooPollingProvider } from './providers/yahoo-polling';
import { MockStreamingProvider } from './providers/mock-stream';

// Activate the high-frequency streaming engine!
const USE_MOCK_STREAM = true; 

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    globalProvider = USE_MOCK_STREAM 
      ? new MockStreamingProvider()
      : new YahooPollingProvider(15000);
  }
  return globalProvider;
}