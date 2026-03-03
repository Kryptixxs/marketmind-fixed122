import { Tick, OHLCV } from '../types';
import { BaseProvider } from './base';

export class MockStreamingProvider extends BaseProvider {
  private intervalId: NodeJS.Timeout | null = null;
  private basePrices: Record<string, number> = {};
  private histories: Record<string, OHLCV[]> = {};
  private isConnected = false;

  protected onConnect() {
    this.isConnected = true;
    this.startStream();
  }

  protected onDisconnect() {
    this.isConnected = false;
    this.stopStream();
  }

  protected onSubscribe(symbols: string[]) {
    symbols.forEach(s => {
      if (!this.basePrices[s]) {
        // Set realistic base prices for major assets
        let base = s.length * 50;
        if (s === '^NDX') base = 17950.25;
        if (s === '^GSPC') base = 5085.50;
        if (s === 'CL=F') base = 78.45;
        if (s === 'GC=F') base = 2035.80;
        if (s === 'BTC-USD') base = 51240.00;
        if (s === 'ETH-USD') base = 2950.50;
        if (s === 'AAPL') base = 182.52;
        if (s === 'NVDA') base = 726.13;
        if (s === 'TSLA') base = 202.64;
        if (s === 'EURUSD=X') base = 1.0850;

        this.basePrices[s] = base;

        // Generate 100 historical OHLCV candles to feed the ICT & Confluence math engines
        const hist: OHLCV[] = [];
        let cur = base * 0.98; // Start slightly lower to simulate a rising trend
        const now = Date.now();
        
        for(let i = 100; i >= 0; i--) {
           const move = (Math.random() - 0.45) * (base * 0.002);
           cur += move;
           hist.push({
             timestamp: now - (i * 15 * 60000), // 15m intervals
             open: cur - (move * 0.5),
             high: cur + Math.abs(move) * 1.5,
             low: cur - Math.abs(move) * 1.5,
             close: cur,
             volume: Math.floor(Math.random() * 50000)
           });
        }
        
        this.histories[s] = hist;
        this.basePrices[s] = cur;
      }
    });
  }

  protected onIntervalChange(interval: string) {
    // Stream doesn't need to re-fetch on interval change, UI chart handles it
  }

  private startStream() {
    if (this.intervalId) clearInterval(this.intervalId);
    // Fire sub-second ticks (400ms) for high-frequency terminal feel
    this.intervalId = setInterval(() => this.tick(), 400);
  }

  private stopStream() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    if (!this.isConnected || this.symbols.size === 0) return;

    // Pick 1 to 4 random symbols to update this tick (simulates asynchronous exchange feeds)
    const syms = Array.from(this.symbols);
    const toUpdate = syms.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(Math.random() * 4)));

    toUpdate.forEach(sym => {
      const base = this.basePrices[sym];
      // 0.05% max volatility per tick
      const volatility = base * 0.0005; 
      const move = (Math.random() - 0.5) * volatility;
      
      const newPrice = base + move;
      this.basePrices[sym] = newPrice;
      
      const hist = this.histories[sym];
      if (!hist || hist.length === 0) return;

      // Update the live developing candle
      const lastCandle = hist[hist.length - 1];
      lastCandle.close = newPrice;
      lastCandle.high = Math.max(lastCandle.high, newPrice);
      lastCandle.low = Math.min(lastCandle.low, newPrice);
      lastCandle.volume += Math.floor(Math.random() * 100);

      // Compare to the first candle of the day/session
      const openPrice = hist[0].close;
      const change = newPrice - openPrice;
      const changePercent = (change / openPrice) * 100;

      this.emitTick({
        symbol: sym,
        price: newPrice,
        change,
        changePercent,
        marketState: 'REGULAR',
        timestamp: Date.now(),
        history: [...hist] // Pass clone so React detects the update
      });
    });
  }
}