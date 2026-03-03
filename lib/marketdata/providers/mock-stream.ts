import { Tick } from '../types';
import { BaseProvider } from './base';

export class MockStreamingProvider extends BaseProvider {
  private intervalId: NodeJS.Timeout | null = null;
  private basePrices: Record<string, number> = {};
  private isConnected = false;
  private reconnectAttempts = 0;

  protected onConnect() {
    this.simulateConnection();
  }

  protected onDisconnect() {
    this.isConnected = false;
    this.stopStream();
  }

  protected onSubscribe(symbols: string[]) {
    symbols.forEach(s => {
      if (!this.basePrices[s]) {
        this.basePrices[s] = s.includes('=') ? 1.05 : (s.length * 50); 
      }
    });
  }

  protected onIntervalChange(interval: string) {
    // Mock doesn't care about intervals for fake ticks
  }

  private simulateConnection() {
    setTimeout(() => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startStream();
    }, 500);
  }

  private startStream() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.tick(), 300);
  }

  private stopStream() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    if (!this.isConnected || this.symbols.size === 0) return;

    const syms = Array.from(this.symbols);
    const toUpdate = syms.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(Math.random() * 3)));

    toUpdate.forEach(sym => {
      const base = this.basePrices[sym];
      const volatility = base * 0.0005;
      const move = (Math.random() - 0.5) * volatility;
      
      this.basePrices[sym] = base + move;
      const newPrice = this.basePrices[sym];
      const fakeOpen = base * 0.98;
      const change = newPrice - fakeOpen;
      const changePercent = (change / fakeOpen) * 100;

      this.emitTick({
        symbol: sym,
        price: newPrice,
        change,
        changePercent,
        marketState: 'REGULAR',
        timestamp: Date.now()
      });
    });
  }
}