import { MarketDataProvider } from './types';
import { YahooPollingProvider } from './providers/yahoo-polling';

// Strictly use real data for LIVE mode as per terminal quality requirements
const USE_MOCK_STREAM = false; 

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    // Default to real Yahoo Finance polling (30s interval)
    globalProvider = new YahooPollingProvider(30000);
  }
  return globalProvider;
}