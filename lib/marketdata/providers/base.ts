import { MarketDataProvider, ProviderConfig, Tick } from '../types';

export abstract class BaseProvider implements MarketDataProvider {
  protected symbols: Set<string> = new Set();
  protected listeners: Set<ProviderConfig> = new Set();

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
    // In a real app with multiple listeners, you'd refcount subscriptions.
    // For this stub, we'll just keep them subscribed or rely on the caller.
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
}
