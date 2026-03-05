'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Search, Loader2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TerminalCommandBar() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [time, setTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString().split(' ')[4]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toUpperCase();
    if (!cmd) return;

    if (cmd.startsWith('/')) {
      // Handle function shortcuts
      const func = cmd.slice(1);
      if (func === 'CAL') router.push('/calendar');
      if (func === 'NEWS') router.push('/news');
    } else {
      // Load instrument
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: cmd }));
    }
    setInput('');
    inputRef.current?.blur();
  };

  return (
    <div className="h-8 bg-surface border-b border-border flex items-center px-2 gap-4 shrink-0">
      <div className="flex items-center gap-2 text-accent font-bold text-[10px] shrink-0">
        <ChevronRight size={14} />
        <span>VANTAGE</span>
      </div>
      
      <form onSubmit={handleCommand} className="flex-1 h-full flex items-center">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="ENTER SYMBOL OR COMMAND (e.g. AAPL, /CAL, /NEWS)"
          className="w-full bg-transparent border-none outline-none text-[11px] font-mono text-text-primary placeholder:text-text-tertiary uppercase"
        />
      </form>

      <div className="flex items-center gap-6 text-[10px] font-mono text-text-secondary shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
          <span className="uppercase tracking-widest">Live Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} />
          <span>{time} UTC</span>
        </div>
      </div>
    </div>
  );
}