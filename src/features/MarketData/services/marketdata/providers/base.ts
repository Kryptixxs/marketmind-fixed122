import { MarketDataProvider, ProviderConfig, Tick } from '../types';

export abstract class BaseProvider implements MarketDataProvider {
  protected symbols: Set<string> = new Set();
  protected listeners: Set<ProviderConfig> = new Set();
  protected currentInterval: string = '15m';

  connect(config: ProviderConfig) {
    this.listeners.add(config);
    if (this.listeners.size === 1) {
      this.onConnect();
    }
  }

  disconnect(config: ProviderConfig) {
    this.listeners.delete(config);
    if (this.listeners.size === 0) {
      this.onDisconnect();
    }
  }

  subscribe(symbols: string[]) {
    symbols.forEach(s => this.symbols.add(s));
    this.onSubscribe(symbols);
  }

  unsubscribe(symbols: string[]) {
    // Keep active while provider is connected for simplicity
  }

  setInterval(interval: string) {
    if (this.currentInterval !== interval) {
      this.currentInterval = interval;
      this.onIntervalChange(interval);
    }
  }

  protected emitTick(tick: Tick) {
    this.listeners.forEach(l => l.onTick?.(tick));
  }

  protected emitError(err: Error) {
    this.listeners.forEach(l => l.onError?.(err));
  }

  protected abstract onConnect(): void;
  protected abstract onDisconnect(): void;
  protected abstract onSubscribe(symbols: string[]): void;
  protected abstract onIntervalChange(interval: string): void;
}