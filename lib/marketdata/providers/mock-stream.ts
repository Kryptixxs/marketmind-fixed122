import { Tick, OHLCV } from '../types';
import { BaseProvider } from './base';
import { fetchMarketDataBatch } from '@/app/actions/fetchMarketData';

const BASE_PRICES: Record<string, number> = {
  '^NDX': 17950.25,
  '^GSPC': 5085.50,
  '^DJI': 39131.53,
  '^RUT': 2016.69,
  'CL=F': 78.45,
  'GC=F': 2035.80,
  'EURUSD=X': 1.0850,
  'BTC-USD': 51240.00,
  'ETH-USD': 2950.50,
  'AAPL': 182.52,
  'MSFT': 404.06,
  'NVDA': 726.13,
  'TSLA': 202.64,
  '^VIX': 14.52,
  'DX-Y.NYB': 104.20,
  '^TNX': 4.31,
  '^IRX': 5.23
};

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
    symbols.forEach(s => {
      if (!this.basePrices[s]) {
        this.initFallback(s);
      }
    });
    // Immediately fetch the true market data
    this.syncRealData(symbols);
  }

  protected onIntervalChange(interval: string) {
    this.syncRealData(Array.from(this.symbols));
  }

  private initFallback(s: string) {
    const base = BASE_PRICES[s] || 150.00;
    
    this.basePrices[s] = base;
    this.trueData[s] = { change: 0, changePercent: 0, marketState: 'SYNCING' };
    
    const hist: OHLCV[] = [];
    const now = Date.now();
    let cur = base * 0.98;
    for(let i = 100; i >= 0; i--) {
       cur += (Math.random() - 0.45) * (base * 0.002);
       hist.push({
         timestamp: now - (i * 15 * 60000),
         open: cur, high: cur * 1.001, low: cur * 0.999, close: cur, volume: 1000
       });
    }
    this.histories[s] = hist;
  }

  private async syncRealData(symbols: string[]) {
    if (symbols.length === 0) return;
    try {
      const results = await fetchMarketDataBatch(symbols, this.currentInterval || '15m');
      
      results.forEach(res => {
        if (res && res.price && res.marketState !== 'SYNTHETIC') {
          // Lock onto the real Yahoo Finance data ONLY if it succeeded
          this.basePrices[res.symbol] = res.price;
          this.trueData[res.symbol] = { 
            change: res.change, 
            changePercent: res.changePercent,
            name: res.name,
            marketState: res.marketState
          };
          
          if (res.history && res.history.length > 10) {
             this.histories[res.symbol] = [...res.history];
          }
        }

        // Fire exact tick immediately to UI (using either real or the fallback we just checked)
        if (res) {
          this.emitTick({
            symbol: res.symbol,
            price: this.basePrices[res.symbol] || res.price,
            change: this.trueData[res.symbol]?.change || res.change,
            changePercent: this.trueData[res.symbol]?.changePercent || res.changePercent,
            marketState: this.trueData[res.symbol]?.marketState || res.marketState,
            timestamp: Date.now(),
            history: this.histories[res.symbol] || res.history,
            name: this.trueData[res.symbol]?.name || res.name
          });
        }
      });
    } catch (e) {
      console.warn("[MarketData] Real data sync failed, maintaining simulated stream", e);
    }
  }

  private startStream() {
    if (this.intervalId) clearInterval(this.intervalId);
    // UI micro-ticks (every 400ms)
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

    // Pick 1-3 random symbols to twitch to simulate asynchronous order books
    const syms = Array.from(this.symbols);
    const toUpdate = syms.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(Math.random() * 3)));

    toUpdate.forEach(sym => {
      const base = this.basePrices[sym];
      if (!base) return;

      // Micro-vibration around the baseline price (0.005% max variance)
      const volatility = base * 0.00005; 
      const move = (Math.random() - 0.5) * volatility;
      const newPrice = base + move;
      
      const hist = this.histories[sym];
      if (hist && hist.length > 0) {
        const lastCandle = hist[hist.length - 1];
        lastCandle.close = newPrice;
        lastCandle.high = Math.max(lastCandle.high, newPrice);
        lastCandle.low = Math.min(lastCandle.low, newPrice);
      }

      const trueInfo = this.trueData[sym] || { change: 0, changePercent: 0, marketState: 'REGULAR' };

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