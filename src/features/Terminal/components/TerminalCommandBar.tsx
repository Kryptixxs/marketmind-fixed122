'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Command registry: maps commands to actions
const COMMAND_REGISTRY: Record<string, { description: string; action: (router: ReturnType<typeof useRouter>) => void }> = {
  '/DESK': { description: 'Open Workspace', action: (r) => r.push('/dashboard') },
  '/CAL': { description: 'Open Economic Calendar', action: (r) => r.push('/calendar') },
  '/CHART': { description: 'Open Technical Analysis', action: (r) => r.push('/charts') },
  '/CONF': { description: 'Open Confluences', action: (r) => r.push('/confluences') },
  '/NEWS': { description: 'Open Intelligence Wire', action: (r) => r.push('/news') },
  '/ALGO': { description: 'Open Algo Backtester', action: (r) => r.push('/algo') },
  '/RISK': { description: 'Open Risk Management', action: (r) => r.push('/risk') },
  '/PORT': { description: 'Open Portfolio Analytics', action: (r) => r.push('/portfolio') },
  '/EXEC': { description: 'Open Execution System', action: (r) => r.push('/execution') },
  '/RES': { description: 'Open Research Terminal', action: (r) => r.push('/research') },
  '/SET': { description: 'Open Settings', action: () => window.dispatchEvent(new CustomEvent('vantage-open-settings')) },
  '/HELP': { description: 'List all commands', action: () => { } },
};

export function TerminalCommandBar() {
  const [input, setInput] = useState('');
  const [time, setTime] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toUTCString().split(' ')[4]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const val = input.trim().toUpperCase();
    if (val.startsWith('/') && val.length > 1) {
      const matches = Object.keys(COMMAND_REGISTRY).filter(cmd => cmd.startsWith(val));
      setSuggestions(matches);
      setSelectedIdx(-1);
    } else {
      setSuggestions([]);
      setSelectedIdx(-1);
    }
  }, [input]);

  const executeCommand = useCallback((cmd: string) => {
    const entry = COMMAND_REGISTRY[cmd];
    if (entry) {
      entry.action(router);
    }
  }, [router]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toUpperCase();
    if (!cmd) return;

    if (cmd.startsWith('/')) {
      if (selectedIdx >= 0 && suggestions[selectedIdx]) {
        executeCommand(suggestions[selectedIdx]);
      } else {
        executeCommand(cmd);
      }
    } else {
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: cmd }));
    }
    setInput('');
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Tab' && suggestions.length > 0) {
        e.preventDefault();
        const idx = selectedIdx >= 0 ? selectedIdx : 0;
        setInput(suggestions[idx]);
        setSuggestions([]);
      }
    }
  };

  return (
    <div className="relative">
      <div className="h-8 bg-surface border-b border-border flex items-center px-2 gap-3 shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <ChevronRight size={12} className="text-accent" />
          <ChevronRight size={12} className="text-accent -ml-2" />
        </div>

        <form onSubmit={handleCommand} className="flex-1 h-full flex items-center">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ENTER SYMBOL OR COMMAND (e.g. AAPL, /RISK, /PORT, /EXEC, /RES, /HELP)"
            className="w-full bg-transparent border-none outline-none text-[11px] font-mono text-accent placeholder:text-text-muted uppercase caret-accent"
          />
        </form>

        <div className="flex items-center gap-4 text-[9px] font-mono text-text-secondary shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-positive" />
            <span className="uppercase tracking-wider text-text-tertiary">CONNECTED</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-text-tertiary" />
            <span className="tabular-nums text-text-secondary">{time} UTC</span>
          </div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="absolute top-8 left-0 right-0 z-50 bg-surface-elevated border border-border shadow-lg">
          {suggestions.map((cmd, i) => (
            <button
              key={cmd}
              onClick={() => { executeCommand(cmd); setInput(''); setSuggestions([]); }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-mono transition-colors ${i === selectedIdx ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-highlight'
                }`}
            >
              <span className="font-bold">{cmd}</span>
              <span className="text-text-tertiary">{COMMAND_REGISTRY[cmd]?.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}