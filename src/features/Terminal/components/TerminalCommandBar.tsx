'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Clock, Terminal as TerminalIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TerminalCommandEngine, CommandResult } from '../services/command-engine';
import { BLOOMBERG_FUNCTIONS } from '../services/command-registry';

export function TerminalCommandBar() {
  const [input, setInput] = useState('');
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const [time, setTime] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
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
    setHistoryIndex(-1);
    setTimeout(() => setLastResult(null), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = engine.current.getHistory();
      if (!history.length) return;
      const nextIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex] || '');
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const history = engine.current.getHistory();
      if (!history.length) return;
      const nextIndex = historyIndex < 0 ? -1 : Math.min(history.length - 1, historyIndex + 1);
      if (nextIndex === history.length - 1 && historyIndex === history.length - 1) {
        setHistoryIndex(-1);
        setInput('');
      } else if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex] || '');
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
      return;
    }
    if (e.key === 'Tab') {
      const suggestion = engine.current.suggest(input);
      if (suggestion) {
        e.preventDefault();
        setInput(suggestion.toUpperCase());
      }
    }
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
          onKeyDown={handleKeyDown}
          placeholder="Type command (e.g. 'GO BMON', 'AAPL GP', 'GO NEWS', 'HELP')"
          className="w-full bg-transparent border-none outline-none text-[10px] font-mono text-text-primary placeholder:text-text-tertiary uppercase"
        />
      </form>

      <div className="hidden xl:flex items-center gap-1 shrink-0">
        {BLOOMBERG_FUNCTIONS.slice(0, 5).map((fn) => (
          <button
            key={fn.code}
            onClick={() => setInput(`GO ${fn.code}`)}
            className="px-1.5 py-0.5 text-[8px] font-mono uppercase border border-border rounded text-text-tertiary hover:text-accent hover:border-border-highlight"
            title={fn.label}
          >
            {fn.code}
          </button>
        ))}
      </div>

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
