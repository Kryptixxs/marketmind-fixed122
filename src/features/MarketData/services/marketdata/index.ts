import { MarketDataProvider } from './types';
import { HybridProvider } from './providers/hybrid';
import { YahooPollingProvider } from './providers/yahoo-polling';

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    const finnhubKey = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '')
      : '';

    if (finnhubKey) {
      globalProvider = new HybridProvider(finnhubKey);
    } else {
      globalProvider = new HybridProvider();
    }
  }
  return globalProvider;
}
