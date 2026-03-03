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
    // Instantly provide fallback data so the UI NEVER infinite-loads
    symbols.forEach(s => {
      if (!this.basePrices[s]) {
        this.initFallback(s);
      }
    });

    // Then asynchronously fetch the true market data
    this.syncRealData(symbols);
  }

  protected onIntervalChange(interval: string) {
    this.syncRealData(Array.from(this.symbols));
  }

  private initFallback(s: string) {
    // Current realistic approximations so the UI looks correct even if Yahoo is blocked
    let base = 150;
    if (s === '^NDX') base = 21050.25;
    if (s === '^GSPC') base = 5985.50;
    if (s === '^DJI') base = 44100.00;
    if (s === '^RUT') base = 2215.00;
    if (s === 'CL=F') base = 75.50;
    if (s === 'GC=F') base = 2715.00;
    if (s === 'EURUSD=X') base = 1.0500;
    if (s.includes('BTC')) base = 95200.00;
    if (s.includes('ETH')) base = 3500.00;
    if (s === 'NVDA') base = 135.00;
    if (s === 'AAPL') base = 225.00;
    if (s === 'MSFT') base = 415.00;
    if (s === 'TSLA') base = 320.00;
    if (s === '^VIX') base = 14.50;
    if (s === 'DX-Y.NYB') base = 106.20;
    if (s === '^TNX') base = 4.35;
    
    this.basePrices[s] = base;
    this.trueData[s] = { change: 0, changePercent: 0, marketState: 'SYNCING' };
    
    const hist: OHLCV[] = [];
    const now = Date.now();
    let cur = base * 0.99;
    for(let i = 50; i >= 0; i--) {
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
        if (res && res.price) {
          // Lock onto the real Yahoo Finance data (or the fallback if Yahoo blocked us)
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

          // Fire exact tick immediately to UI 
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

    const syms = Array.from(this.symbols).filter(s => this.basePrices[s] !== undefined);
    if (syms.length === 0) return;

    // Pick 1-3 random symbols to twitch
    const toUpdate = syms.sort(() => 0.5 - Math.random()).slice(0, Math.max(1, Math.floor(Math.random() * 3)));

    toUpdate.forEach(sym => {
      const base = this.basePrices[sym];
      
      // Micro-vibration around the base price
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

      const trueInfo = this.trueData[sym];

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