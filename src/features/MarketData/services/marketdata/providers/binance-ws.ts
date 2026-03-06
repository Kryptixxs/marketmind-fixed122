import { BaseProvider } from './base';
import { getBinanceStream } from '@/lib/symbol-map';

export class BinanceWSProvider extends BaseProvider {
  private ws: WebSocket | null = null;
  private subscribedStreams = new Set<string>();
  private streamToInternal = new Map<string, string>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private connected = false;

  protected onConnect() {
    this.connected = true;
    if (this.subscribedStreams.size > 0) this.openSocket();
  }

  protected onDisconnect() {
    this.connected = false;
    this.closeSocket();
  }

  protected onSubscribe(symbols: string[]) {
    let changed = false;
    for (const sym of symbols) {
      const stream = getBinanceStream(sym);
      if (!stream) continue;
      const streamName = `${stream}@miniTicker`;
      if (!this.subscribedStreams.has(streamName)) {
        this.subscribedStreams.add(streamName);
        this.streamToInternal.set(stream.toUpperCase(), sym);
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
    if (this.subscribedStreams.size === 0) return;
    if (this.ws) return;

    const streams = Array.from(this.subscribedStreams).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        console.log('[Binance WS] Connected, streams:', this.subscribedStreams.size);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const data = msg.data;
          if (!data?.s) return;

          const internalSym = this.streamToInternal.get(data.s);
          if (!internalSym) return;

          const price = parseFloat(data.c);
          const open = parseFloat(data.o);
          const change = price - open;
          const changePercent = open > 0 ? (change / open) * 100 : 0;

          this.emitTick({
            symbol: internalSym,
            price,
            change,
            changePercent,
            marketState: 'REGULAR',
            timestamp: data.E || Date.now(),
          });
        } catch {}
      };

      this.ws.onclose = () => {
        this.ws = null;
        if (this.connected) this.scheduleReconnect();
      };

      this.ws.onerror = (e) => {
        console.warn('[Binance WS] Error, will reconnect');
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
      this.ws.onerror = null;
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
