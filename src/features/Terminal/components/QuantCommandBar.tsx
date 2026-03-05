'use client';

import React, { useState } from 'react';
import { Search, Layout, Clock } from 'lucide-react';

export function QuantCommandBar({ activeSymbol, onSymbolChange }: { activeSymbol: string, onSymbolChange: (s: string) => void }) {
  const [input, setInput] = useState(activeSymbol);

  return (
    <div className="h-12 border-b border-border flex items-center px-6 justify-between bg-background">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold tracking-[0.3em] text-text-secondary uppercase">Vantage</span>
          <div className="h-4 w-px bg-border" />
          <form onSubmit={(e) => { e.preventDefault(); onSymbolChange(input.toUpperCase()); }}>
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium w-24 uppercase tracking-tight focus:text-accent transition-colors"
              placeholder="SYMBOL"
            />
          </form>
        </div>

        <div className="flex items-center gap-1">
          {['1M', '5M', '1H', '1D'].map(tf => (
            <button key={tf} className="px-2 py-1 text-[10px] font-bold text-text-tertiary hover:text-text-primary transition-colors">{tf}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-text-tertiary hover:text-text-primary transition-colors"><Search size={16} strokeWidth={1.5} /></button>
        <button className="text-text-tertiary hover:text-text-primary transition-colors"><Layout size={16} strokeWidth={1.5} /></button>
        <div className="flex items-center gap-2 text-[10px] font-medium text-text-secondary">
          <Clock size={12} strokeWidth={1.5} />
          <span className="tabular-nums">{new Date().toUTCString().split(' ')[4]} UTC</span>
        </div>
      </div>
    </div>
  );
}