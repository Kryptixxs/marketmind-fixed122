'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronRight, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TerminalCommandBar() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.toUpperCase().trim();
    
    // Bloomberg-style syntax handling
    if (cmd === 'CAL' || cmd === 'CALENDAR') router.push('/calendar');
    else if (cmd === 'NEWS' || cmd === 'WIRE') router.push('/news');
    else if (cmd === 'ALGO') router.push('/algo');
    else if (cmd === 'CHARTS' || cmd === 'TA') router.push('/charts');
    else if (cmd.startsWith('HELP')) alert('VCL Commands: CAL, NEWS, ALGO, TA, [SYMBOL]');
    else {
      // Default to symbol lookup/change
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: cmd }));
    }
    
    setInput('');
    inputRef.current?.blur();
  };

  return (
    <div className={`
      h-8 flex items-center px-3 gap-2 transition-all duration-200
      ${isFocused ? 'bg-accent/10 border-b border-accent/30' : 'bg-surface border-b border-border'}
    `}>
      <div className="flex items-center gap-2 text-text-tertiary shrink-0">
        <Terminal size={12} className={isFocused ? 'text-accent' : ''} />
        <span className="text-[9px] font-bold uppercase tracking-widest">Command</span>
      </div>
      
      <form onSubmit={handleCommand} className="flex-1 flex items-center gap-2">
        <ChevronRight size={10} className={isFocused ? 'text-accent' : 'text-text-tertiary'} />
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Enter command or symbol (Press '/' to focus)..."
          className="flex-1 bg-transparent border-none outline-none text-[11px] font-mono text-text-primary placeholder:text-text-tertiary uppercase"
        />
      </form>

      <div className="flex items-center gap-2 text-[9px] font-mono text-text-tertiary">
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-background border border-border rounded-sm">
          <Command size={8} />
          <span>K</span>
        </div>
        <span>PALETTE</span>
      </div>
    </div>
  );
}