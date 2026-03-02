'use client';

import { useEffect, useState } from 'react';

type Trade = {
  id: number;
  time: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  symbol: string;
};

export function TapeWidget({ symbol = "BTC-USD" }: { symbol?: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newTrade: Trade = {
        id: Date.now(),
        time: now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }) + '.' + Math.floor(now.getMilliseconds()/10),
        price: 64000 + (Math.random() * 50 - 25),
        size: Number((Math.random() * 2).toFixed(4)),
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        symbol
      };
      
      setTrades(prev => [newTrade, ...prev].slice(0, 50));
    }, 200); // Fast updates

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
              {t.price.toFixed(2)}
            </td>
            <td className="px-2 py-0.5 text-right text-text-primary">{t.size.toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}