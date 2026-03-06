'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { OHLCV, Tick } from './types';
import { getProvider } from './index';

function appendLiveBar(history: OHLCV[] | undefined, price: number, timestamp: number): OHLCV[] {
  const base = history ? [...history] : [];
  const safePrice = Number.isFinite(price) ? price : 0;
  const safeTs = Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now();
  if (safePrice <= 0) return base;

  const bucketMs = 15_000;
  const bucketTs = Math.floor(safeTs / bucketMs) * bucketMs;
  const last = base[base.length - 1];

  if (last && bucketTs <= last.timestamp) {
    last.high = Math.max(last.high, safePrice);
    last.low = Math.min(last.low, safePrice);
    last.close = safePrice;
    last.volume = (last.volume || 0) + 1;
  } else {
    const open = last?.close ?? safePrice;
    base.push({
      timestamp: bucketTs,
      open,
      high: Math.max(open, safePrice),
      low: Math.min(open, safePrice),
      close: safePrice,
      volume: 1,
    });
  }

  return base.slice(-400);
}

export function useMarketData(symbols: string[], interval: string = '15m') {
  const [data, setData] = useState<Record<string, Tick>>({});
  const [error, setError] = useState<string | null>(null);

  const subId = useRef(Math.random().toString(36).substring(7)).current;
  const provider = getProvider();
  const batchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdates = useRef<Record<string, Tick>>({});
  const dataRef = useRef<Record<string, Tick>>({});

  const flushUpdates = useCallback(() => {
    const updates = pendingUpdates.current;
    if (Object.keys(updates).length > 0) {
      setData(prev => {
        const next = { ...prev, ...updates };
        dataRef.current = next;
        return next;
      });
      pendingUpdates.current = {};
    }
  }, []);

  useEffect(() => {
    if (provider.setInterval) {
      provider.setInterval(interval);
    }
  }, [interval, provider]);

  useEffect(() => {
    if (symbols.length === 0) return;

    const config = {
      id: subId,
      onTick: (tick: Tick) => {
        if (symbols.includes(tick.symbol)) {
          const prev = pendingUpdates.current[tick.symbol] || dataRef.current[tick.symbol];
          const mergedHistory = tick.history?.length
            ? tick.history
            : appendLiveBar(prev?.history, tick.price, tick.timestamp);

          pendingUpdates.current[tick.symbol] = {
            ...prev,
            ...tick,
            history: mergedHistory,
          };

          if (!batchTimer.current) {
            batchTimer.current = setTimeout(() => {
              batchTimer.current = null;
              flushUpdates();
            }, 150);
          }
        }
      },
      onError: (err: Error) => {
        setError(err.message);
      }
    };

    provider.connect(config);
    provider.subscribe(symbols);

    return () => {
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
        batchTimer.current = null;
      }
      flushUpdates();
      provider.unsubscribe(symbols);
      provider.disconnect(config);
    };
  }, [symbols.join(',')]);

  return { data, error };
}
