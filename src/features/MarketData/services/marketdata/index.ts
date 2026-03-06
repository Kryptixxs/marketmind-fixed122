import { MarketDataProvider } from './types';
import { YahooPollingProvider } from './providers/yahoo-polling';

let globalProvider: MarketDataProvider | null = null;

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    // Using high-frequency polling (2s) of the official Yahoo Finance API
    // This ensures the data is 'correct' and matches real exchange prices.
    globalProvider = new YahooPollingProvider(2000); 
  }
  return globalProvider;
}