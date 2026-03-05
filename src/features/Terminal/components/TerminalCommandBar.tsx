'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronRight, Command, Loader2, HelpCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchSymbols } from '@/app/actions/searchSymbols';

export function TerminalCommandBar() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
        setInput('');
        setShowGuide(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const cmd = input.trim();
    const upperCmd = cmd.toUpperCase();
    
    if (upperCmd === 'CAL' || upperCmd === 'CALENDAR') { router.push('/calendar'); setInput(''); }
    else if (upperCmd === 'NEWS' || upperCmd === 'WIRE') { router.push('/news'); setInput(''); }
    else if (upperCmd === 'ALGO') { router.push('/algo'); setInput(''); }
    else if (upperCmd === 'CHARTS' || upperCmd === 'TA') { router.push('/charts'); setInput(''); }
    else if (upperCmd === 'HELP' || upperCmd === '?') { setShowGuide(true); setInput(''); }
    else {
      setIsResolving(true);
      const results = await searchSymbols(cmd);
      const sym = results.length > 0 ? results[0].symbol : upperCmd;
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
      setIsResolving(false);
      setInput('');
    }
    inputRef.current?.blur();
  };

  return (
    <div className="relative">
      <div className={`
        h-10 flex items-center px-4 gap-3 transition-all duration-200
        ${isFocused ? 'bg-accent/10 border-b border-accent/40' : 'bg-surface border-b border-border'}
      `}>
        <div className="flex items-center gap-2 text-text-tertiary shrink-0">
          {isResolving ? <Loader2 size={14} className="text-accent animate-spin" /> : <Terminal size={14} className={isFocused ? 'text-accent' : ''} />}
          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">Command</span>
        </div>
        
        <form onSubmit={handleCommand} className="flex-1 flex items-center gap-2">
          <ChevronRight size={12} className={isFocused ? 'text-accent' : 'text-text-tertiary'} />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Enter command or symbol (e.g. 'AAPL' or 'CAL'). Press '/' to focus..."
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-text-primary placeholder:text-text-tertiary uppercase"
          />
        </form>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowGuide(!showGuide)}
            className={`p-1.5 rounded-sm transition-colors ${showGuide ? 'bg-accent text-accent-text' : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'}`}
            title="Command Guide"
          >
            <HelpCircle size={16} />
          </button>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-text-tertiary">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-background border border-border rounded-sm">
              <Command size={8} />
              <span>K</span>
            </div>
            <span>PALETTE</span>
          </div>
        </div>
      </div>

      {showGuide && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowGuide(false)} />
          <div className="absolute top-full left-4 right-4 mt-2 bg-surface border border-border shadow-2xl z-[70] p-4 rounded-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                <Terminal size={14} /> Terminal Command Guide
              </h3>
              <button onClick={() => setShowGuide(false)} className="text-text-tertiary hover:text-text-primary"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Navigation</span>
                <ul className="space-y-1.5">
                  <li className="flex justify-between text-[11px]"><code className="text-accent">CAL</code> <span>Economic Calendar</span></li>
                  <li className="flex justify-between text-[11px]"><code className="text-accent">NEWS</code> <span>Intelligence Wire</span></li>
                  <li className="flex justify-between text-[11px]"><code className="text-accent">ALGO</code> <span>Backtest Engine</span></li>
                </ul>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Assets</span>
                <ul className="space-y-1.5">
                  <li className="flex justify-between text-[11px]"><code className="text-accent">AAPL</code> <span>Load Apple Inc.</span></li>
                  <li className="flex justify-between text-[11px]"><code className="text-accent">BTCUSD</code> <span>Load Bitcoin</span></li>
                  <li className="flex justify-between text-[11px]"><code className="text-accent">GOLD</code> <span>Load Gold Spot</span></li>
                </ul>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-text-tertiary uppercase">Shortcuts</span>
                <ul className="space-y-1.5">
                  <li className="flex justify-between text-[11px]"><code className="text-accent">/</code> <span>Focus Command Bar</span></li>
                  <li className="flex justify-between text-[11px]"><code className="text-accent">⌘ K</code> <span>Global Palette</span></li>
                  <li className="flex justify-between text-[11px]"><code className="text-accent">ESC</code> <span>Clear / Close</span></li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}