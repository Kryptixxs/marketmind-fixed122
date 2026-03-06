import { Tick, OHLCV } from '../types';
import { BaseProvider } from './base';
import { fetchMarketDataBatch } from '@/app/actions/fetchMarketData';

export class MockStreamingProvider extends BaseProvider {
  private intervalId: NodeJS.Timeout | null = null;
  private syncIntervalId: NodeJS.Timeout | null = null;
  
  private basePrices: Record<string, number> = {};
  private histories: Record<string, OHLCV[]> = {};
  private trueData: Record<string, { change: number, changePercent: number, name?: string, marketState: string }> = {};
  
  private isConnected = false;

  protected onConnect() {
    this.isConnected = true;
    this.startStream();
    
    // Background sync to real prices every 15 seconds
    this.syncIntervalId = setInterval(() => {
      this.syncRealData(Array.from(this.symbols));
    }, 15000);
  }

  protected onDisconnect() {
    this.isConnected = false;
    this.stopStream();
    if (this.syncIntervalId) clearInterval(this.syncIntervalId);
  }

  protected onSubscribe(symbols: string[]) {
    // Fetch REAL market data immediately on subscription
    this.syncRealData(symbols);
  }

  protected onIntervalChange(interval: string) {
    this.syncRealData(Array.from(this.symbols));
  }

  private async syncRealData(symbols: string[]) {
    if (symbols.length === 0) return;
    try {
      const results = await fetchMarketDataBatch(symbols, this.currentInterval || '15m');
      
      results.forEach(res => {
        if (res && res.price) {
          // Lock onto the real Yahoo Finance data
          this.basePrices[res.symbol] = res.price;
          this.trueData[res.symbol] = { 
            change: res.change, 
            changePercent: res.changePercent,
            name: res.name,
            marketState: res.marketState
          };
          
          if (res.history && res.history.length > 0) {
             this.histories[res.symbol] = [...res.history];
          }

          // Emit the real data point immediately
          this.emitTick({
            symbol: res.symbol,
            price: res.price,
            change: res.change,
            changePercent: res.changePercent,
            marketState: res.marketState,
            timestamp: Date.now(),
            history: this.histories[res.symbol],
            name: res.name
          });
        }
      });
    } catch (e) {
      console.warn("[MarketData] Real data sync failed", e);
    }
  }

  private startStream() {
    if (this.intervalId) clearInterval(this.intervalId);
    // High frequency ticks for terminal aesthetic
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

    // Pick random symbols to "vibrate"
    const syms = Array.from(this.symbols);
    const toUpdate = syms.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(Math.random() * 5)));

    toUpdate.forEach(sym => {
      // Use base price if available, otherwise use a deterministic starting point
      if (this.basePrices[sym] === undefined) {
        this.basePrices[sym] = sym.length * 50;
        this.trueData[sym] = { change: 0, changePercent: 0, marketState: 'REGULAR' };
      }

      const base = this.basePrices[sym];
      const volatility = base * 0.0001; 
      const move = (Math.random() - 0.5) * volatility;
      const newPrice = base + move;
      
      // Update local state so the next tick starts from here
      this.basePrices[sym] = newPrice;

      const trueInfo = this.trueData[sym];
      const hist = this.histories[sym];

      this.emitTick({
        symbol: sym,
        price: newPrice,
        change: trueInfo.change, 
        changePercent: trueInfo.changePercent, 
        marketState: trueInfo.marketState,
        timestamp: Date.now(),
        history: hist ? [...hist] : undefined,
        name: trueInfo.name
      });
    });
  }
}