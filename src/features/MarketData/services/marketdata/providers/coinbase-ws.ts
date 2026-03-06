import { BaseProvider } from './base';
import { getCoinbaseProduct } from '@/lib/symbol-map';

export class CoinbaseWSProvider extends BaseProvider {
  private ws: WebSocket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscribedProducts = new Set<string>();
  private productToInternal = new Map<string, string>();

  protected onConnect() {
    this.connected = true;
    if (this.subscribedProducts.size > 0) this.openSocket();
  }

  protected onDisconnect() {
    this.connected = false;
    this.closeSocket();
  }

  protected onSubscribe(symbols: string[]) {
    let changed = false;
    for (const sym of symbols) {
      const product = getCoinbaseProduct(sym);
      if (!product) continue;
      if (!this.subscribedProducts.has(product)) {
        this.subscribedProducts.add(product);
        this.productToInternal.set(product, sym);
        changed = true;
      }
    }

    if (changed && this.connected) {
      this.closeSocket();
      this.openSocket();
    }
  }

  protected onIntervalChange() {}

  private openSocket() {
    if (typeof window === 'undefined') return;
    if (this.ws || this.subscribedProducts.size === 0) return;

    this.ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.ws?.send(
        JSON.stringify({
          type: 'subscribe',
          product_ids: Array.from(this.subscribedProducts),
          channels: ['ticker'],
        }),
      );
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type !== 'ticker' || !msg.product_id) return;

        const internalSym = this.productToInternal.get(msg.product_id);
        if (!internalSym) return;

        const price = parseFloat(msg.price || '0');
        const open = parseFloat(msg.open_24h || msg.price || '0');
        const change = price - open;
        const changePercent = open > 0 ? (change / open) * 100 : 0;

        this.emitTick({
          symbol: internalSym,
          price,
          change,
          changePercent,
          marketState: 'REGULAR',
          timestamp: Date.now(),
        });
      } catch {}
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.connected) this.scheduleReconnect();
    };
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
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  }
}

