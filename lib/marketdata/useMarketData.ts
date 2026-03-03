'use client';

import { useState, useEffect, useRef } from 'react';
import { Tick } from './types';
import { getProvider } from './index';

export function useMarketData(symbols: string[]) {
  const [data, setData] = useState<Record<string, Tick>>({});
  const [error, setError] = useState<string | null>(null);
  const subId = useRef(Math.random().toString(36).substring(7)).current;

  useEffect(() => {
    if (symbols.length === 0) return;

    const provider = getProvider();
    let tickBuffer: Record<string, Tick> = {};
    let animationFrameId: number;

    const flushBuffer = () => {
      if (Object.keys(tickBuffer).length > 0) {
        setData(prev => ({ ...prev, ...tickBuffer }));
        tickBuffer = {};
      }
      animationFrameId = requestAnimationFrame(flushBuffer);
    };

    animationFrameId = requestAnimationFrame(flushBuffer);

    const config = {
      id: subId,
      onTick: (tick: Tick) => {
        if (symbols.includes(tick.symbol)) {
          tickBuffer[tick.symbol] = tick;
        }
      },
      onError: (err: Error) => {
        setError(err.message);
      }
    };

    provider.connect(config);
    provider.subscribe(symbols);

    return () => {
      cancelAnimationFrame(animationFrameId);
      provider.unsubscribe(symbols);
      provider.disconnect(config);
    };
  }, [symbols.join(',')]);

  return { data, error };
}