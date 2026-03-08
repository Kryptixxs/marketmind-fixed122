'use client';

import React, { memo, useEffect, useRef, useState } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';

const TRADERS = [
  { id: '1', name: 'J. Smith', firm: 'GS' },
  { id: '2', name: 'M. Chen', firm: 'MS' },
  { id: '3', name: 'R. Patel', firm: 'JPM' },
  { id: '4', name: 'K. Williams', firm: 'C' },
  { id: '5', name: 'A. Johnson', firm: 'BAC' },
] as const;

const MESSAGE_TEMPLATES = [
  (sym: string, p: number) => `Bid on 10k ${sym} at ${p.toFixed(2)}`,
  (sym: string, p: number) => `Offer 5k ${sym} @ ${(p * 1.001).toFixed(2)}`,
  (sym: string) => `Any size in ${sym}?`,
  (sym: string) => `Saw prints in ${sym} - flow?`,
  (sym: string, p: number) => `Hit 25k ${sym} at ${p.toFixed(2)}`,
] as const;

export interface IBChatProps {
  className?: string;
}

export const IBChat = memo(function IBChat({ className = '' }: IBChatProps) {
  const { state } = useTerminalStore();
  const feedRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Array<{ id: string; trader: string; text: string; ts: string }>>([
    { id: '0', trader: 'J. Smith (GS)', text: 'Welcome to IB Chat', ts: '09:30' },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      const trader = TRADERS[Math.floor(Math.random() * TRADERS.length)]!;
      const sym = state.quotes[Math.floor(Math.random() * Math.min(10, state.quotes.length))]?.symbol ?? 'AAPL';
      const quote = state.quotes.find((q) => q.symbol === sym);
      const price = quote?.last ?? 150;
      const tmpl = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)]!;
      const text = tmpl(sym, price);
      const now = new Date();
      const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now()), trader: `${trader.name} (${trader.firm})`, text, ts },
      ]);
    }, 15000);
    return () => clearInterval(iv);
  }, [state.quotes]);

  useEffect(() => {
    feedRef.current?.scrollTo(0, feedRef.current.scrollHeight);
  }, [messages]);

  return (
    <div
      className={`flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#0a0a0a] border border-[#333] font-mono ${className}`}
      style={{ fontSize: '10px' }}
    >
      <div className="flex-none px-2 py-1 border-b border-[#333] text-[#FFB000] font-bold uppercase tracking-wider">
        IB • Instant Bloomberg
      </div>
      <div className="flex-1 min-h-0 flex">
        <div className="flex-none w-[120px] border-r border-[#333] overflow-y-auto terminal-scrollbar">
          <div className="px-2 py-1 text-[#666] text-[9px] uppercase">Online</div>
          {TRADERS.map((t) => (
            <div key={t.id} className="px-2 py-1 text-[#b0b8c4] border-b border-[#222]">
              {t.name} ({t.firm})
            </div>
          ))}
        </div>
        <div
          ref={feedRef}
          className="flex-1 min-w-0 overflow-y-auto terminal-scrollbar p-2 space-y-1"
        >
          {messages.map((m) => (
            <div key={m.id} className="border-b border-[#222] pb-1">
              <span className="text-[#FFB000] font-bold">{m.trader}</span>
              <span className="text-[#666] ml-2">{m.ts}</span>
              <div className="text-[#b0b8c4] mt-0.5">{m.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
