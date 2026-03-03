import { MarketDataProvider } from './types';
import { YahooPollingProvider } from './providers/yahoo-polling';
import { MockStreamingProvider } from './providers/mock-stream';

const USE_MOCK_STREAM = true; 

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    globalProvider = USE_MOCK_STREAM 
      ? new MockStreamingProvider()
      : new YahooPollingProvider(30000);
  }
  return globalProvider;
}