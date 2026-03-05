/**
 * VANTAGE TERMINAL — Global Event Bus
 * 
 * Type-safe pub/sub system for cross-component communication.
 * Replaces ad-hoc window.dispatchEvent patterns with a centralized,
 * typed event system suitable for institutional-grade applications.
 */

// ─── Event Type Definitions ─────────────────────────────────────
export interface VantageEvents {
    'symbol:change': { symbol: string; source: string };
    'symbol:focus': { symbol: string };
    'panel:focus': { panelId: string };
    'panel:maximize': { panelId: string };
    'panel:restore': { panelId: string };
    'alert:fire': { id: string; type: 'price' | 'technical' | 'news' | 'system'; message: string; severity: 'info' | 'warning' | 'critical'; timestamp: number };
    'alert:dismiss': { id: string };
    'session:change': { session: 'pre-asia' | 'asia' | 'london' | 'ny' | 'post-ny'; overlap: boolean };
    'order:submit': { symbol: string; side: 'buy' | 'sell'; quantity: number; type: 'market' | 'limit' | 'stop'; price?: number };
    'order:fill': { orderId: string; fillPrice: number; timestamp: number };
    'order:cancel': { orderId: string };
    'portfolio:update': { totalPnl: number; totalExposure: number };
    'risk:breach': { metric: string; current: number; limit: number };
    'system:health': { latency: number; feedsConnected: number; feedsTotal: number; memoryUsage: number };
    'workspace:save': { name: string };
    'workspace:load': { name: string };
    'navigation:goto': { path: string };
    'command:execute': { command: string; args?: Record<string, unknown> };
}

export type VantageEventName = keyof VantageEvents;
type EventCallback<T extends VantageEventName> = (payload: VantageEvents[T]) => void;

// ─── Event Bus Implementation ───────────────────────────────────
class EventBus {
    private listeners = new Map<string, Set<Function>>();
    private history = new Map<string, { payload: unknown; timestamp: number }>();
    private maxHistorySize = 100;

    /**
     * Subscribe to an event. Returns an unsubscribe function.
     */
    on<T extends VantageEventName>(event: T, callback: EventCallback<T>): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);

        return () => {
            this.listeners.get(event)?.delete(callback);
        };
    }

    /**
     * Subscribe to an event, but only fire once.
     */
    once<T extends VantageEventName>(event: T, callback: EventCallback<T>): () => void {
        const unsub = this.on(event, (payload) => {
            unsub();
            callback(payload);
        });
        return unsub;
    }

    /**
     * Emit an event to all subscribers.
     */
    emit<T extends VantageEventName>(event: T, payload: VantageEvents[T]): void {
        // Store in history
        this.history.set(`${event}:${Date.now()}`, { payload, timestamp: Date.now() });
        this.pruneHistory();

        // Notify listeners
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => {
                try {
                    cb(payload);
                } catch (err) {
                    console.error(`[EventBus] Error in ${event} handler:`, err);
                }
            });
        }

        // Bridge to legacy window events for backward compatibility
        if (typeof window !== 'undefined') {
            if (event === 'symbol:change') {
                window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: (payload as VantageEvents['symbol:change']).symbol }));
            }
        }
    }

    /**
     * Remove all listeners for an event, or all events.
     */
    off<T extends VantageEventName>(event?: T): void {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get the count of active listeners.
     */
    listenerCount(event?: VantageEventName): number {
        if (event) {
            return this.listeners.get(event)?.size || 0;
        }
        let total = 0;
        this.listeners.forEach(set => total += set.size);
        return total;
    }

    private pruneHistory(): void {
        if (this.history.size > this.maxHistorySize) {
            const entries = [...this.history.entries()];
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            const toRemove = entries.slice(0, entries.length - this.maxHistorySize);
            toRemove.forEach(([key]) => this.history.delete(key));
        }
    }
}

// ─── Singleton Export ───────────────────────────────────────────
export const eventBus = new EventBus();
