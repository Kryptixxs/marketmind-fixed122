import { MarketDataProvider } from './types';
import { YahooPollingProvider } from './providers/yahoo-polling';

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    // STRICTLY use real data polling. No synthetic data, no mock streams, no hardcoded fallback prices.
    globalProvider = new YahooPollingProvider(10000); // Poll real prices every 10 seconds
  }
  return globalProvider;
}