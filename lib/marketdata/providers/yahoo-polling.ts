import { MarketDataProvider, ProviderConfig, Tick } from '../types';
import { fetchMarketData } from '@/app/actions/fetchMarketData';
import { BaseProvider } from './base';

export class YahooPollingProvider extends BaseProvider {
  private intervalId: NodeJS.Timeout | null = null;
  private pollIntervalMs: number;

  constructor(pollIntervalMs = 30000) {
    super();
    this.pollIntervalMs = pollIntervalMs;
  }

  protected onConnect() {
    this.startPolling();
  }

  protected onDisconnect() {
    this.stopPolling();
  }

  protected onSubscribe(symbols: string[]) {
    this.triggerPoll(symbols); // Fetch immediately on sub
  }

  private startPolling() {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => this.triggerPoll(Array.from(this.symbols)), this.pollIntervalMs);
    }
  }

  private stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async triggerPoll(symbolsToFetch: string[]) {
    if (symbolsToFetch.length === 0) return;

    try {
      const promises = symbolsToFetch.map(sym => fetchMarketData(sym));
      const results = await Promise.allSettled(promises);

      results.forEach((res, i) => {
        if (res.status === 'fulfilled' && res.value) {
          const data = res.value;
          this.emitTick({
            symbol: data.symbol,
            name: data.name,
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            marketState: data.marketState,
            history: data.history,
            timestamp: Date.now()
          });
        }
      });
    } catch (err) {
      this.emitError(err as Error);
    }
  }
}
