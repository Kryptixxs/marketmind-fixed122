import { Tick } from '../types';
import { BaseProvider } from './base';
import { fetchMarketDataBatch } from '@/app/actions/fetchMarketData';

const BINANCE_SYMBOLS: Record<string, string> = {
  'BTCUSD': 'btcusdt',
  'ETHUSD': 'ethusdt',
  'SOLUSD': 'solusdt',
};

export class BinanceProvider extends BaseProvider {
  private ws: WebSocket | null = null;
  private state: Record<string, Tick> = {};
  private syncInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  static canHandle(symbol: string): boolean {
    return symbol in BINANCE_SYMBOLS;
  }

  protected onConnect() {
    this.initWebSocket();
    this.syncInterval = setInterval(() => {
      const syms = Array.from(this.symbols).filter(s => BinanceProvider.canHandle(s));
      if (syms.length > 0) this.loadHistory(syms);
    }, 30000);
  }

  protected onDisconnect() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  protected onSubscribe(symbols: string[]) {
    const binanceSyms = symbols.filter(s => BinanceProvider.canHandle(s));
    if (binanceSyms.length > 0) {
      this.loadHistory(binanceSyms);
    }
  }

  protected onIntervalChange() {
    const syms = Array.from(this.symbols).filter(s => BinanceProvider.canHandle(s));
    if (syms.length > 0) this.loadHistory(syms);
  }

  private async loadHistory(symbols: string[]) {
    try {
      const results = await fetchMarketDataBatch(symbols, this.currentInterval || '15m');
      results.forEach(res => {
        if (res) {
          this.state[res.symbol] = res;
          this.emitTick(res);
        }
      });
    } catch (e) {
      console.error('[Binance] History load failed', e);
    }
  }

  private initWebSocket() {
    const streams = Object.values(BINANCE_SYMBOLS)
      .map(s => `${s}@miniTicker`)
      .join('/');

    const url = `wss://stream.binance.com:9443/ws/${streams}`;

    try {
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        console.log('[Binance] WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.e === '24hrMiniTicker') {
            this.handleMiniTicker(msg);
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        console.warn('[Binance] WebSocket error');
      };

      ws.onclose = () => {
        console.warn('[Binance] WebSocket closed. Reconnecting in 5s...');
        this.reconnectTimeout = setTimeout(() => this.initWebSocket(), 5000);
      };
    } catch (e) {
      console.warn('[Binance] Failed to initialize WebSocket', e);
    }
  }

  private handleMiniTicker(msg: { s: string; c: string; o: string; h: string; l: string; v: string; E: number }) {
    const binanceSym = msg.s.toLowerCase();
    const internalSym = Object.entries(BINANCE_SYMBOLS).find(
      ([, v]) => v === binanceSym
    )?.[0];

    if (!internalSym) return;

    const price = parseFloat(msg.c);
    const openPrice = parseFloat(msg.o);
    const prevTick = this.state[internalSym];

    let change = price - openPrice;
    let changePercent = openPrice !== 0 ? (change / openPrice) * 100 : 0;

    const newTick: Tick = {
      symbol: internalSym,
      price,
      change,
      changePercent,
      marketState: '24/7',
      history: prevTick?.history,
      timestamp: msg.E || Date.now(),
      name: prevTick?.name || internalSym,
    };

    this.state[internalSym] = newTick;
    this.emitTick(newTick);
  }
}
