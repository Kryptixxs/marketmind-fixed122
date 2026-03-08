/**
 * WebSocket manager with throttler — max 5 UI updates per second.
 * Prevents browser lag when data arrives faster than the UI can render.
 */

const MAX_UPDATES_PER_SECOND = 5;
const THROTTLE_INTERVAL_MS = 1000 / MAX_UPDATES_PER_SECOND;

export type WebSocketMessageHandler<T = unknown> = (data: T) => void;

export interface WebSocketManagerOptions {
  url: string;
  onMessage: WebSocketMessageHandler;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  reconnectIntervalMs?: number;
}

export class WebSocketManager<T = unknown> {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: WebSocketMessageHandler<T>;
  private onOpen?: () => void;
  private onClose?: () => void;
  private onError?: (err: Event) => void;
  private reconnectIntervalMs: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastEmitTs = 0;
  private pendingData: T | null = null;
  private flushScheduled = false;

  constructor(options: WebSocketManagerOptions) {
    this.url = options.url;
    this.onMessage = options.onMessage;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onError = options.onError;
    this.reconnectIntervalMs = options.reconnectIntervalMs ?? 3000;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => this.onOpen?.();
    this.ws.onclose = () => {
      this.onClose?.();
      this.scheduleReconnect();
    };
    this.ws.onerror = (e) => this.onError?.(e);
    this.ws.onmessage = (e) => this.handleMessage(e);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: string | ArrayBufferLike | Blob): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectIntervalMs);
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string) as T;
      this.throttledEmit(data);
    } catch {
      // ignore parse errors
    }
  }

  private throttledEmit(data: T): void {
    const now = Date.now();
    const elapsed = now - this.lastEmitTs;

    if (elapsed >= THROTTLE_INTERVAL_MS || this.lastEmitTs === 0) {
      this.lastEmitTs = now;
      this.pendingData = null;
      this.onMessage(data);
      return;
    }

    this.pendingData = data;
    if (!this.flushScheduled) {
      this.flushScheduled = true;
      setTimeout(() => this.flushPending(), THROTTLE_INTERVAL_MS - elapsed);
    }
  }

  private flushPending(): void {
    this.flushScheduled = false;
    if (this.pendingData !== null) {
      const data = this.pendingData;
      this.pendingData = null;
      this.lastEmitTs = Date.now();
      this.onMessage(data);
    }
  }
}
