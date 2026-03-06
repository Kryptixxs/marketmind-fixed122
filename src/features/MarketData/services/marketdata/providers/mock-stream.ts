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
          this.basePrices[res.symbol] = res.price;
          this.trueData[res.symbol] = { 
            change: res.change, 
            changePercent: res.changePercent,
            name: res.name,
            marketState: res.marketState
          };
          
          if (res.history && res.history.length > 0) {
             // Ensure we have some volume even if the API returns 0
             this.histories[res.symbol] = res.history.map(h => ({
               ...h,
               volume: h.volume || Math.floor(Math.random() * 5000) + 1000
             }));
          }

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

    const syms = Array.from(this.symbols);
    const toUpdate = syms.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(Math.random() * 5)));

    toUpdate.forEach(sym => {
      if (this.basePrices[sym] === undefined) {
        this.basePrices[sym] = sym.length * 50;
        this.trueData[sym] = { change: 0, changePercent: 0, marketState: 'REGULAR' };
      }

      // Increased volatility for a more "active" look
      const base = this.basePrices[sym];
      const volatility = base * 0.0003; 
      const move = (Math.random() - 0.5) * volatility;
      const newPrice = base + move;
      
      this.basePrices[sym] = newPrice;

      const trueInfo = this.trueData[sym];
      const hist = this.histories[sym];

      // Update the last candle in history with the new live price
      if (hist && hist.length > 0) {
        const lastIdx = hist.length - 1;
        const lastCandle = { ...hist[lastIdx] };
        lastCandle.close = newPrice;
        lastCandle.high = Math.max(lastCandle.high, newPrice);
        lastCandle.low = Math.min(lastCandle.low, newPrice);
        lastCandle.volume += Math.floor(Math.random() * 100);
        hist[lastIdx] = lastCandle;
      }

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