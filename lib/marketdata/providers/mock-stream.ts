import { MarketDataProvider, ProviderConfig, Tick } from '../types';
import { BaseProvider } from './base';

export class MockStreamingProvider extends BaseProvider {
  private intervalId: NodeJS.Timeout | null = null;
  private basePrices: Record<string, number> = {};
  
  // Reconnect logic state
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
        // Init base price deterministically-ish based on length
        this.basePrices[s] = s.includes('=') ? 1.05 : (s.length * 50);
      }
    });
  }

  private simulateConnection() {
    // Simulate network delay
    setTimeout(() => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startStream();
    }, 500);
  }

  private startStream() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    // Emit ticks very frequently for visual effect (300ms)
    this.intervalId = setInterval(() => this.tick(), 300);

    // Simulate occasional random disconnect to test reconnect logic
    setTimeout(() => {
      if (this.isConnected && Math.random() > 0.8) {
        this.handleDisconnect();
      }
    }, 10000);
  }

  private stopStream() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private handleDisconnect() {
    this.isConnected = false;
    this.stopStream();
    this.emitError(new Error("WebSocket disconnected. Reconnecting..."));
    
    if (this.reconnectAttempts < 5) {
      this.reconnectAttempts++;
      setTimeout(() => this.simulateConnection(), 1000 * Math.pow(2, this.reconnectAttempts)); // Exponential backoff
    }
  }

  private tick() {
    if (!this.isConnected || this.symbols.size === 0) return;

    // Pick 1 to 3 random symbols to update this tick (simulating real market flow where not everything updates every ms)
    const syms = Array.from(this.symbols);
    const toUpdate = syms.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(Math.random() * 3)));

    toUpdate.forEach(sym => {
      const base = this.basePrices[sym];
      const volatility = base * 0.0005; // 0.05% move max per tick
      const move = (Math.random() - 0.5) * volatility;
      
      this.basePrices[sym] = base + move;
      const newPrice = this.basePrices[sym];
      
      // Calculate fake change based on arbitrary "open" (98% of base)
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
