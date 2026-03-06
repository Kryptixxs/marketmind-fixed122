import { MarketDataProvider, ProviderConfig, Tick } from '../types';
import { FinnhubWSProvider } from './finnhub-ws';
import { CoinbaseWSProvider } from './coinbase-ws';
import { YahooPollingProvider } from './yahoo-polling';
import { classifySymbols } from '@/lib/symbol-map';

export class HybridProvider implements MarketDataProvider {
  private finnhub: FinnhubWSProvider | null;
  private coinbase: CoinbaseWSProvider;
  private polling: YahooPollingProvider;
  private listeners = new Set<ProviderConfig>();
  private lastTick = new Map<string, Tick>();

  constructor(finnhubApiKey?: string) {
    this.finnhub = finnhubApiKey ? new FinnhubWSProvider(finnhubApiKey) : null;
    this.coinbase = new CoinbaseWSProvider();
    // Faster non-streaming refresh while still avoiding aggressive API pressure.
    this.polling = new YahooPollingProvider(15000);
  }

  connect(config: ProviderConfig) {
    this.listeners.add(config);

    const wrappedConfig = (provider: string): ProviderConfig => ({
      id: `${config.id}-${provider}`,
      onTick: (tick: Tick) => {
        const prev = this.lastTick.get(tick.symbol);

        if (tick.change === 0 && tick.changePercent === 0 && prev) {
          tick = { ...tick, change: prev.change, changePercent: prev.changePercent };
        }
        if (!tick.history?.length && prev?.history?.length) {
          tick = { ...tick, history: prev.history };
        }

        this.lastTick.set(tick.symbol, tick);
        config.onTick?.(tick);
      },
      onError: config.onError,
    });

    if (this.finnhub) this.finnhub.connect(wrappedConfig('finnhub'));
    this.coinbase.connect(wrappedConfig('coinbase'));
    this.polling.connect(wrappedConfig('polling'));
  }

  disconnect(config: ProviderConfig) {
    this.listeners.delete(config);
    if (this.listeners.size === 0) {
      if (this.finnhub) this.finnhub.disconnect({ id: `${config.id}-finnhub` } as ProviderConfig);
      this.coinbase.disconnect({ id: `${config.id}-coinbase` } as ProviderConfig);
      this.polling.disconnect({ id: `${config.id}-polling` } as ProviderConfig);
    }
  }

  subscribe(symbols: string[]) {
    const { finnhub, binance, yahooFallback } = classifySymbols(symbols);

    if (this.finnhub && finnhub.length > 0) {
      this.finnhub.subscribe(finnhub);
    }

    if (binance.length > 0) {
      this.coinbase.subscribe(binance);
    }

    const yahooSyms = [...yahooFallback];
    if (!this.finnhub) {
      yahooSyms.push(...finnhub);
    }
    this.polling.subscribe([...new Set(yahooSyms)]);
  }

  unsubscribe(symbols: string[]) {}

  setInterval(interval: string) {
    this.polling.setInterval(interval);
  }
}
