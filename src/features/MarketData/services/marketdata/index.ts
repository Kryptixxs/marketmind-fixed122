import { MarketDataProvider } from './types';
import { YahooPollingProvider } from './providers/yahoo-polling';

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    // Prototype mode uses a local deterministic polling source only.
    globalProvider = new YahooPollingProvider(1500);
  }
  return globalProvider;
}
