import { BaseProvider } from './base';
import { getFinnhubSymbol } from '@/lib/symbol-map';

const MAX_SYMBOLS = 50;

export class FinnhubWSProvider extends BaseProvider {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private subscribedFinnhub = new Set<string>();
  private symbolToInternal = new Map<string, string>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private connected = false;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  protected onConnect() {
    this.connected = true;
    this.openSocket();
  }

  protected onDisconnect() {
    this.connected = false;
    this.closeSocket();
  }

  protected onSubscribe(symbols: string[]) {
    for (const sym of symbols) {
      const finnhubSym = getFinnhubSymbol(sym);
      if (!finnhubSym) continue;
      if (this.subscribedFinnhub.size >= MAX_SYMBOLS) break;
      this.symbolToInternal.set(finnhubSym, sym);
      this.subscribedFinnhub.add(finnhubSym);

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'subscribe', symbol: finnhubSym }));
      }
    }
  }

  protected onIntervalChange() {}

  private openSocket() {
    if (typeof window === 'undefined') return;
    if (this.ws) return;

    try {
      this.ws = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        console.log('[Finnhub WS] Connected, subscribing to', this.subscribedFinnhub.size, 'symbols');
        for (const sym of this.subscribedFinnhub) {
          this.ws!.send(JSON.stringify({ type: 'subscribe', symbol: sym }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== 'trade' || !msg.data?.length) return;

          const grouped = new Map<string, { p: number; v: number; t: number }>();
          for (const trade of msg.data) {
            const existing = grouped.get(trade.s);
            if (!existing || trade.t > existing.t) {
              grouped.set(trade.s, { p: trade.p, v: trade.v, t: trade.t });
            }
          }

          for (const [finnhubSym, latest] of grouped) {
            const internalSym = this.symbolToInternal.get(finnhubSym);
            if (!internalSym) continue;
            this.emitTick({
              symbol: internalSym,
              price: latest.p,
              change: 0,
              changePercent: 0,
              marketState: 'REGULAR',
              timestamp: latest.t,
            });
          }
        } catch {}
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (this.connected) this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private closeSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (!this.connected) return;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  }
}
