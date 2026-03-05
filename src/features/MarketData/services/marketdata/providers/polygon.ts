import { Tick, OHLCV } from '../types';
import { BaseProvider } from './base';
import { fetchMarketDataBatch } from '@/app/actions/fetchMarketData';

const API_KEY = 'Educ3tK6ue_eC33G_3ERTMb0qc7wd3K6';

// Mapping internal symbols to Polygon WebSocket Subscription Channels
const POLY_MAP: Record<string, { endpoint: string, sub: string, match: string }> = {
  'NAS100': { endpoint: 'stocks', sub: 'A.QQQ', match: 'QQQ' },
  'SPX500': { endpoint: 'stocks', sub: 'A.SPY', match: 'SPY' },
  'US30': { endpoint: 'stocks', sub: 'A.DIA', match: 'DIA' },
  'CRUDE': { endpoint: 'stocks', sub: 'A.USO', match: 'USO' },
  'GOLD': { endpoint: 'stocks', sub: 'A.GLD', match: 'GLD' },
  'AAPL': { endpoint: 'stocks', sub: 'A.AAPL', match: 'AAPL' },
  'TSLA': { endpoint: 'stocks', sub: 'A.TSLA', match: 'TSLA' },
  'NVDA': { endpoint: 'stocks', sub: 'A.NVDA', match: 'NVDA' },
  'MSFT': { endpoint: 'stocks', sub: 'A.MSFT', match: 'MSFT' },
  'BTCUSD': { endpoint: 'crypto', sub: 'XA.BTC-USD', match: 'BTC-USD' },
  'ETHUSD': { endpoint: 'crypto', sub: 'XA.ETH-USD', match: 'ETH-USD' },
  'EURUSD': { endpoint: 'forex', sub: 'CA.EUR/USD', match: 'EUR/USD' },
};

export class PolygonProvider extends BaseProvider {
  private sockets: Record<string, WebSocket> = {};
  private state: Record<string, Tick> = {};
  private isConnected = false;

  protected onConnect() {
    this.isConnected = true;
    this.initSockets();
  }

  protected onDisconnect() {
    this.isConnected = false;
    Object.values(this.sockets).forEach(ws => ws.close());
    this.sockets = {};
  }

  protected onSubscribe(symbols: string[]) {
    // 1. Fetch history payload
    this.loadHistory(symbols);
    // 2. Subscribe to live WS stream
    this.subscribeToSockets(symbols);
  }

  protected onIntervalChange(interval: string) {
    this.loadHistory(Array.from(this.symbols));
  }

  private async loadHistory(symbols: string[]) {
    if (symbols.length === 0) return;
    try {
      const results = await fetchMarketDataBatch(symbols, this.currentInterval || '15m');
      results.forEach(res => {
        if (res) {
          this.state[res.symbol] = res;
          this.emitTick(res);
        }
      });
    } catch (e) {
      console.error('[Polygon] Failed to load history', e);
    }
  }

  private initSockets() {
    const endpoints = ['stocks', 'crypto', 'forex'];
    endpoints.forEach(ep => {
      const ws = new WebSocket(`wss://socket.polygon.io/${ep}`);
      this.sockets[ep] = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ action: 'auth', params: API_KEY }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        data.forEach((msg: any) => {
          if (msg.ev === 'status' && msg.status === 'auth_success') {
            this.subscribeToSockets(Array.from(this.symbols), [ep]);
          }
          // A = Stocks second agg, XA = Crypto second agg, CA = Forex second agg
          if (msg.ev === 'A' || msg.ev === 'XA' || msg.ev === 'CA') {
            this.handleTick(msg);
          }
        });
      };

      ws.onerror = (err) => console.error(`[Polygon] ${ep} WS Error`, err);
    });
  }

  private subscribeToSockets(symbols: string[], targetEndpoints?: string[]) {
    const subsByEndpoint: Record<string, string[]> = { stocks: [], crypto: [], forex: [] };
    
    symbols.forEach(sym => {
      const map = POLY_MAP[sym];
      if (map) subsByEndpoint[map.endpoint].push(map.sub);
    });

    (targetEndpoints || ['stocks', 'crypto', 'forex']).forEach(ep => {
      const ws = this.sockets[ep];
      const subs = subsByEndpoint[ep];
      if (ws && ws.readyState === WebSocket.OPEN && subs.length > 0) {
        ws.send(JSON.stringify({ action: 'subscribe', params: subs.join(',') }));
      }
    });
  }

  private handleTick(msg: any) {
    const incomingSym = msg.sym || msg.pair;
    const mapEntry = Object.entries(POLY_MAP).find(([k, v]) => v.match === incomingSym);
    
    if (!mapEntry) return;
    const internalSym = mapEntry[0];

    const price = msg.c; // Close price of the aggregated second
    const prevTick = this.state[internalSym];
    if (!prevTick) return;

    let change = prevTick.change;
    let changePercent = prevTick.changePercent;
    
    if (prevTick.history && prevTick.history.length > 0) {
      // Calculate dynamic change from the daily open to stay accurate
      const openPrice = prevTick.history[0].open; 
      change = price - openPrice;
      changePercent = (change / openPrice) * 100;
      
      // Update the live chart candle
      const lastCandle = prevTick.history[prevTick.history.length - 1];
      lastCandle.close = price;
      lastCandle.high = Math.max(lastCandle.high, price);
      lastCandle.low = Math.min(lastCandle.low, price);
      lastCandle.volume = (lastCandle.volume || 0) + (msg.v || 0);
    }

    const newTick: Tick = {
      ...prevTick,
      price,
      change,
      changePercent,
      timestamp: msg.e || Date.now(),
    };

    this.state[internalSym] = newTick;
    this.emitTick(newTick);
  }
}