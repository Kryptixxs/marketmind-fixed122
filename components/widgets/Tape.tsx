'use client';

import { useEffect, useState, useRef } from 'react';

type Trade = {
  id: number;
  time: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  symbol: string;
};

export function TapeWidget({ symbol = "BTC-USD", basePrice }: { symbol?: string; basePrice?: number }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const lastPriceRef = useRef<number>(basePrice || 0);

  useEffect(() => {
    if (basePrice) {
      lastPriceRef.current = basePrice;
    }
  }, [basePrice]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentBase = lastPriceRef.current || 64000;
      
      // Simulate a tick around the real base price
      const volatility = currentBase * 0.0001; 
      const tickPrice = currentBase + (Math.random() * volatility - (volatility / 2));
      
      const newTrade: Trade = {
        id: Date.now(),
        time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }) + '.' + Math.floor(now.getMilliseconds()/10),
        price: tickPrice,
        size: Number((Math.random() * (currentBase > 1000 ? 0.5 : 100)).toFixed(currentBase > 1000 ? 4 : 2)),
        side: Math.random() > 0.48 ? 'buy' : 'sell', // Slight bias
        symbol
      };
      
      setTrades(prev => [newTrade, ...prev].slice(0, 50));
    }, Math.random() * 500 + 100); // Variable speed

    return () => clearInterval(interval);
  }, [symbol]);

  return (
    <table className="w-full text-[10px] font-mono border-collapse">
      <thead className="sticky top-0 bg-surface z-10 text-text-tertiary">
        <tr>
          <th className="text-left px-2 py-1 font-normal">Time</th>
          <th className="text-right px-2 py-1 font-normal">Price</th>
          <th className="text-right px-2 py-1 font-normal">Size</th>
        </tr>
      </thead>
      <tbody>
        {trades.map(t => (
          <tr key={t.id} className="hover:bg-surface-highlight">
            <td className="px-2 py-0.5 text-text-secondary">{t.time}</td>
            <td className={`px-2 py-0.5 text-right font-bold ${t.side === 'buy' ? 'text-positive' : 'text-negative'}`}>
              {t.price.toFixed(t.price > 1000 ? 2 : 4)}
            </td>
            <td className="px-2 py-0.5 text-right text-text-primary">{t.size}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}