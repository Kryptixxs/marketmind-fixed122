import { MarketDataProvider, ProviderConfig, Tick } from '../types';
import { FinnhubProvider } from './finnhub';
import { BinanceProvider } from './binance';
import { YahooPollingProvider } from './yahoo-polling';

export class HybridProvider implements MarketDataProvider {
  private finnhub: FinnhubProvider;
  private binance: BinanceProvider;
  private yahoo: YahooPollingProvider;
  private listeners: Set<ProviderConfig> = new Set();

  constructor() {
    this.finnhub = new FinnhubProvider();
    this.binance = new BinanceProvider();
    this.yahoo = new YahooPollingProvider(10000);
  }

  connect(config: ProviderConfig) {
    const wrappedConfig: ProviderConfig = {
      id: config.id,
      onTick: (tick: Tick) => config.onTick?.(tick),
      onError: (err: Error) => config.onError?.(err),
    };

    this.listeners.add(config);
    this.finnhub.connect({ ...wrappedConfig, id: `${config.id}-finnhub` });
    this.binance.connect({ ...wrappedConfig, id: `${config.id}-binance` });
    this.yahoo.connect({ ...wrappedConfig, id: `${config.id}-yahoo` });
  }

  disconnect(config: ProviderConfig) {
    this.listeners.delete(config);
    this.finnhub.disconnect({ ...config, id: `${config.id}-finnhub` });
    this.binance.disconnect({ ...config, id: `${config.id}-binance` });
    this.yahoo.disconnect({ ...config, id: `${config.id}-yahoo` });
  }

  subscribe(symbols: string[]) {
    const finnhubSyms: string[] = [];
    const binanceSyms: string[] = [];
    const yahooSyms: string[] = [];

    for (const sym of symbols) {
      if (FinnhubProvider.canHandle(sym)) {
        finnhubSyms.push(sym);
      } else if (BinanceProvider.canHandle(sym)) {
        binanceSyms.push(sym);
      } else {
        yahooSyms.push(sym);
      }
    }

    if (finnhubSyms.length > 0) this.finnhub.subscribe(finnhubSyms);
    if (binanceSyms.length > 0) this.binance.subscribe(binanceSyms);
    if (yahooSyms.length > 0) this.yahoo.subscribe(yahooSyms);
  }

  unsubscribe(symbols: string[]) {
    this.finnhub.unsubscribe(symbols);
    this.binance.unsubscribe(symbols);
    this.yahoo.unsubscribe(symbols);
  }

  setInterval(interval: string) {
    this.finnhub.setInterval?.(interval);
    this.binance.setInterval?.(interval);
    this.yahoo.setInterval?.(interval);
  }
}
