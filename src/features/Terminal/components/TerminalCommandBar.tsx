'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Clock, Terminal as TerminalIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TerminalCommandEngine, CommandResult } from '../services/command-engine';

export function TerminalCommandBar() {
  const [input, setInput] = useState('');
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const [time, setTime] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const engine = useRef(new TerminalCommandEngine());
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString().split(' ')[4]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const result = engine.current.parse(input);
    setLastResult(result);
    if (result.type === 'NAV' && result.path) router.push(result.path);
    setInput('');
    setTimeout(() => setLastResult(null), 3000);
  };

  return (
    <div className="h-8 bg-surface border-b border-border flex items-center px-3 gap-3 shrink-0 relative">
      <div className="flex items-center gap-1.5 text-accent font-bold text-[9px] shrink-0">
        <TerminalIcon size={12} />
        <span className="tracking-tight uppercase hidden sm:inline">CLI</span>
        <ChevronRight size={10} className="opacity-40" />
      </div>

      <form onSubmit={handleCommand} className="flex-1 h-full flex items-center">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command (e.g. 'stocks load NVDA', 'cd calendar', 'help')"
          className="w-full bg-transparent border-none outline-none text-[10px] font-mono text-text-primary placeholder:text-text-tertiary uppercase"
        />
      </form>

      {lastResult && (
        <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 px-3 py-1.5 rounded border shadow-2xl z-[100] flex items-center gap-2 animate-slide-up ${
          lastResult.type === 'ERROR' ? 'bg-negative/10 border-negative/30 text-negative' :
          lastResult.type === 'DATA' ? 'bg-positive/10 border-positive/30 text-positive' :
          'bg-surface-highlight border-border text-accent'
        }`}>
          {lastResult.type === 'ERROR' ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />}
          <span className="text-[9px] font-bold uppercase tracking-widest font-mono">{lastResult.message}</span>
        </div>
      )}

      <div className="flex items-center gap-4 text-[9px] font-mono text-text-tertiary shrink-0">
        <div className="hidden md:flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-positive" style={{ animation: 'pulse-dot 2s infinite' }} />
          <span className="uppercase tracking-wider font-bold text-text-secondary">Ready</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={10} />
          <span className="text-text-secondary">{time}</span>
        </div>
      </div>
    </div>
  );
}
