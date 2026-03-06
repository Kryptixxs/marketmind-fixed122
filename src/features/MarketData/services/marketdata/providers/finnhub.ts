import { Tick } from '../types';
import { BaseProvider } from './base';
import { fetchMarketDataBatch } from '@/app/actions/fetchMarketData';

const FINNHUB_WS_URL = 'wss://ws.finnhub.io';

const FINNHUB_SYMBOLS: Record<string, string> = {
  'AAPL': 'AAPL',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA',
  'MSFT': 'MSFT',
  'GOOGL': 'GOOGL',
  'AMZN': 'AMZN',
  'META': 'META',
  'AMD': 'AMD',
  'NFLX': 'NFLX',
  'JPM': 'JPM',
};

export class FinnhubProvider extends BaseProvider {
  private ws: WebSocket | null = null;
  private state: Record<string, Tick> = {};
  private syncInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private apiKey: string;
  private subscribedSymbols: Set<string> = new Set();

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_FINNHUB_KEY || '';
  }

  static canHandle(symbol: string): boolean {
    return symbol in FINNHUB_SYMBOLS;
  }

  protected onConnect() {
    this.initWebSocket();
    this.syncInterval = setInterval(() => {
      const syms = Array.from(this.symbols).filter(s => FinnhubProvider.canHandle(s));
      if (syms.length > 0) this.loadHistory(syms);
    }, 15000);
  }

  protected onDisconnect() {
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribedSymbols.clear();
  }

  protected onSubscribe(symbols: string[]) {
    const finnhubSyms = symbols.filter(s => FinnhubProvider.canHandle(s));
    if (finnhubSyms.length > 0) {
      this.loadHistory(finnhubSyms);
      this.subscribeWS(finnhubSyms);
    }
  }

  protected onIntervalChange() {
    const syms = Array.from(this.symbols).filter(s => FinnhubProvider.canHandle(s));
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
      console.error('[Finnhub] History load failed', e);
    }
  }

  private initWebSocket() {
    if (!this.apiKey) {
      console.warn('[Finnhub] No API key. Using Yahoo polling fallback.');
      return;
    }

    try {
      const ws = new WebSocket(`${FINNHUB_WS_URL}?token=${this.apiKey}`);
      this.ws = ws;

      ws.onopen = () => {
        console.log('[Finnhub] WebSocket connected');
        const syms = Array.from(this.symbols).filter(s => FinnhubProvider.canHandle(s));
        this.subscribeWS(syms);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'trade' && msg.data) {
            this.handleTrades(msg.data);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        console.warn('[Finnhub] WebSocket error');
      };

      ws.onclose = () => {
        console.warn('[Finnhub] WebSocket closed. Reconnecting in 5s...');
        this.subscribedSymbols.clear();
        this.reconnectTimeout = setTimeout(() => this.initWebSocket(), 5000);
      };
    } catch (e) {
      console.warn('[Finnhub] Failed to initialize WebSocket', e);
    }
  }

  private subscribeWS(symbols: string[]) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    symbols.forEach(sym => {
      const finnhubSym = FINNHUB_SYMBOLS[sym];
      if (finnhubSym && !this.subscribedSymbols.has(finnhubSym)) {
        this.ws!.send(JSON.stringify({ type: 'subscribe', symbol: finnhubSym }));
        this.subscribedSymbols.add(finnhubSym);
      }
    });
  }

  private handleTrades(trades: Array<{ s: string; p: number; v: number; t: number }>) {
    const latestBySymbol: Record<string, { p: number; v: number; t: number }> = {};

    for (const trade of trades) {
      const existing = latestBySymbol[trade.s];
      if (!existing || trade.t > existing.t) {
        latestBySymbol[trade.s] = trade;
      }
    }

    for (const [finnhubSym, trade] of Object.entries(latestBySymbol)) {
      const internalSym = Object.entries(FINNHUB_SYMBOLS).find(
        ([, v]) => v === finnhubSym
      )?.[0];

      if (!internalSym) continue;

      const prevTick = this.state[internalSym];
      if (!prevTick) continue;

      const price = trade.p;
      let change = prevTick.change;
      let changePercent = prevTick.changePercent;

      if (prevTick.history && prevTick.history.length > 0) {
        const openPrice = prevTick.history[0].open;
        change = price - openPrice;
        changePercent = openPrice !== 0 ? (change / openPrice) * 100 : 0;

        const lastCandle = prevTick.history[prevTick.history.length - 1];
        lastCandle.close = price;
        lastCandle.high = Math.max(lastCandle.high, price);
        lastCandle.low = Math.min(lastCandle.low, price);
        lastCandle.volume = (lastCandle.volume || 0) + (trade.v || 0);
      }

      const newTick: Tick = {
        ...prevTick,
        price,
        change,
        changePercent,
        timestamp: trade.t || Date.now(),
      };

      this.state[internalSym] = newTick;
      this.emitTick(newTick);
    }
  }
}
