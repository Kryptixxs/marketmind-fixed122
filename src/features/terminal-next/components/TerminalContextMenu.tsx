'use client';

import React, { useEffect, useState } from 'react';
import { useTerminalContextMenu } from '../context/TerminalContextMenuContext';

const MENU_OPTIONS = [
  { code: 'DES', label: 'Description' },
  { code: 'GP', label: 'Graph Price' },
  { code: 'CN', label: 'Company News' },
  { code: 'OQ', label: 'Option Quotes' },
] as const;

export function TerminalContextMenu() {
  const menuCtx = useTerminalContextMenu();
  const executeCommand = menuCtx?.executeCommand ?? (() => undefined);
  const [state, setState] = useState<{ x: number; y: number; ticker: string } | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const el = e.target as HTMLElement;
      const tickerEl = el.closest('[data-ticker]') as HTMLElement | null;
      if (tickerEl) {
        const ticker = tickerEl.getAttribute('data-ticker') ?? '';
        if (ticker) {
          e.preventDefault();
          e.stopPropagation();
          setState({
            x: e.clientX,
            y: e.clientY,
            ticker: ticker.trim(),
          });
        }
      }
    };

    const handleGlobalContextMenu = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('[data-ticker]')) return;
      if (el.closest('[data-terminal-context-menu]')) return;
      setState(null);
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('contextmenu', handleGlobalContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('contextmenu', handleGlobalContextMenu);
    };
  }, []);

  useEffect(() => {
    const close = () => setState(null);
    document.addEventListener('click', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('scroll', close, true);
    };
  }, []);

  if (!state) return null;

  const symbol = state.ticker.includes(' ') ? state.ticker : `${state.ticker} US`;

  return (
    <div
      data-terminal-context-menu
      className="fixed z-[9999] py-1 min-w-[140px] border border-[#444]"
      style={{
        left: state.x,
        top: state.y,
        backgroundColor: '#1a1a1a',
        fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
        fontSize: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.8)',
      }}
    >
      {MENU_OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          className="w-full text-left px-3 py-2 hover:bg-[#333] text-[#b0b8c4] hover:text-[#FFB000]"
          onClick={() => {
            executeCommand(`${symbol} ${opt.code} GO`);
            setState(null);
          }}
        >
          <span className="font-bold text-[#FFB000] mr-2">{opt.code}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
