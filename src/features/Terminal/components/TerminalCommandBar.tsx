'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ChevronRight, Command, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { searchSymbols } from '@/app/actions/searchSymbols';

export function TerminalCommandBar() {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
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

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const cmd = input.trim();
    const upperCmd = cmd.toUpperCase();
    
    // Bloomberg-style syntax handling
    if (upperCmd === 'CAL' || upperCmd === 'CALENDAR') { router.push('/calendar'); setInput(''); inputRef.current?.blur(); }
    else if (upperCmd === 'NEWS' || upperCmd === 'WIRE') { router.push('/news'); setInput(''); inputRef.current?.blur(); }
    else if (upperCmd === 'ALGO') { router.push('/algo'); setInput(''); inputRef.current?.blur(); }
    else if (upperCmd === 'CHARTS' || upperCmd === 'TA') { router.push('/charts'); setInput(''); inputRef.current?.blur(); }
    else if (upperCmd.startsWith('HELP')) { alert('VCL Commands: CAL, NEWS, ALGO, TA, [SYMBOL OR COMPANY NAME]'); setInput(''); }
    else {
      // Resolve company name to symbol
      setIsResolving(true);
      const results = await searchSymbols(cmd);
      const sym = results.length > 0 ? results[0].symbol : upperCmd;
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
      setIsResolving(false);
      setInput('');
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`
      h-8 flex items-center px-3 gap-2 transition-all duration-200
      ${isFocused ? 'bg-accent/10 border-b border-accent/30' : 'bg-surface border-b border-border'}
    `}>
      <div className="flex items-center gap-2 text-text-tertiary shrink-0">
        {isResolving ? <Loader2 size={12} className="text-accent animate-spin" /> : <Terminal size={12} className={isFocused ? 'text-accent' : ''} />}
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