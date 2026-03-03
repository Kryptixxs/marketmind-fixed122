import { MarketDataProvider } from './types';
import { YahooPollingProvider } from './providers/yahoo-polling';

// Rule: No simulated data.
const USE_MOCK_STREAM = false; 

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    // Using 15s polling for high-frequency 'real' data
    globalProvider = new YahooPollingProvider(15000);
  }
  return globalProvider;
}