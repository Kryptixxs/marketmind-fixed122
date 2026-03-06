import { MarketDataProvider } from './types';
import { YahooPollingProvider } from './providers/yahoo-polling';

let globalProvider: MarketDataProvider | null = null;

function resolvePollInterval(): number {
  if (typeof window === 'undefined') return 2500;
  try {
    const raw = localStorage.getItem('vantage-terminal-settings-v6');
    if (raw) {
      const parsed = JSON.parse(raw) as { refreshInterval?: number; dataDelayMode?: 'realtime' | 'delayed' | 'simulated' };
      const base = Number(parsed.refreshInterval || 30000);
      if (parsed.dataDelayMode === 'realtime') return Math.max(1500, Math.min(base, 10000));
      if (parsed.dataDelayMode === 'delayed') return Math.max(5000, Math.min(base, 30000));
      return Math.max(3000, Math.min(base, 20000));
    }
  } catch {}
  return 2500;
}

export function getProvider(): MarketDataProvider {
  if (!globalProvider) {
    globalProvider = new YahooPollingProvider(resolvePollInterval());
  }
  return globalProvider;
}
