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

    if (result.type === 'NAV' && result.path) {
      router.push(result.path);
    }

    setInput('');
    
    // Clear status message after 3 seconds
    setTimeout(() => setLastResult(null), 3000);
  };

  return (
    <div className="h-9 bg-surface border-b border-border flex items-center px-2 gap-4 shrink-0 relative">
      <div className="flex items-center gap-2 text-accent font-bold text-[10px] shrink-0">
        <TerminalIcon size={14} />
        <span className="tracking-tighter">VANTAGE_CLI</span>
        <ChevronRight size={12} className="opacity-50" />
      </div>
      
      <form onSubmit={handleCommand} className="flex-1 h-full flex items-center">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ENTER COMMAND (e.g. 'stocks load NVDA', 'cd calendar', 'help')"
          className="w-full bg-transparent border-none outline-none text-[11px] font-mono text-text-primary placeholder:text-text-tertiary uppercase"
          autoFocus
        />
      </form>

      {/* Command Feedback Overlay */}
      {lastResult && (
        <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 px-3 py-1.5 rounded-sm border shadow-2xl z-[100] flex items-center gap-2 animate-in fade-in slide-in-from-top-1 ${
          lastResult.type === 'ERROR' ? 'bg-negative/10 border-negative/30 text-negative' : 
          lastResult.type === 'DATA' ? 'bg-positive/10 border-positive/30 text-positive' :
          'bg-surface-highlight border-border text-accent'
        }`}>
          {lastResult.type === 'ERROR' ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono">{lastResult.message}</span>
        </div>
      )}

      <div className="flex items-center gap-6 text-[10px] font-mono text-text-secondary shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" />
          <span className="uppercase tracking-widest">System_Ready</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} />
          <span>{time} UTC</span>
        </div>
      </div>
    </div>
  );
}