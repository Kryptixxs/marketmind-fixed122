'use client';

import { useState, useEffect, useRef } from 'react';
import { Tick } from './types';
import { getProvider } from './index';

export function useMarketData(symbols: string[], interval: string = '15m') {
  const [data, setData] = useState<Record<string, Tick>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Unique ID for this hook instance's subscription
  const subId = useRef(Math.random().toString(36).substring(7)).current;
  const provider = getProvider();

  // Sync interval to provider
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
          // Let React 18 auto-batch these rapid state updates
          setData(prev => ({ ...prev, [tick.symbol]: tick }));
        }
      },
      onError: (err: Error) => {
        setError(err.message);
      }
    };

    provider.connect(config);
    provider.subscribe(symbols);

    return () => {
      provider.unsubscribe(symbols);
      provider.disconnect(config);
    };
  }, [symbols.join(',')]);

  return { data, error };
}