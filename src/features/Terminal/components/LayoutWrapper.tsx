'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { LayoutSettingsModal } from '@/components/ui/LayoutSettingsModal';
import { CommandPalette } from './CommandPalette';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { Clock, Wifi, Search } from 'lucide-react';

const TICKER_SYMBOLS = ['SPX500', 'NAS100', 'US30', 'GOLD', 'CRUDE', 'BTCUSD', 'EURUSD', 'VIX', 'DXY'];

function TopBar() {
  const { data } = useMarketData(TICKER_SYMBOLS);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toUTCString().split(' ')[4]);
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const getMarketStatus = () => {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcDay = now.getUTCDay();
    if (utcDay === 0 || utcDay === 6) return { label: 'CLOSED', color: 'text-text-tertiary' };
    if (utcHour >= 14 && utcHour < 21) return { label: 'US OPEN', color: 'text-positive' };
    if (utcHour >= 8 && utcHour < 16) return { label: 'EU OPEN', color: 'text-accent' };
    if (utcHour >= 0 && utcHour < 8) return { label: 'ASIA', color: 'text-cyan' };
    return { label: 'PRE-MKT', color: 'text-warning' };
  };

  const status = getMarketStatus();

  return (
    <div className="h-7 bg-background border-b border-border flex items-center px-3 gap-0 shrink-0 overflow-hidden">
      {/* Ticker Tape */}
      <div className="flex-1 overflow-hidden relative min-w-0">
        <div className="flex items-center gap-4 ticker-scroll whitespace-nowrap" style={{ width: 'max-content' }}>
          {[...TICKER_SYMBOLS, ...TICKER_SYMBOLS].map((sym, i) => {
            const tick = data[TICKER_SYMBOLS[i % TICKER_SYMBOLS.length]];
            const isPos = tick?.changePercent != null ? tick.changePercent >= 0 : true;
            return (
              <div key={`${sym}-${i}`} className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="text-text-secondary font-bold">{sym}</span>
                <span className="text-text-primary">
                  {tick?.price != null ? tick.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
                </span>
                <span className={isPos ? 'text-positive' : 'text-negative'}>
                  {tick?.changePercent != null ? `${isPos ? '+' : ''}${tick.changePercent.toFixed(2)}%` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Status */}
      <div className="flex items-center gap-3 shrink-0 ml-3 border-l border-border pl-3">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="flex items-center gap-1.5 px-2 py-0.5 bg-surface border border-border rounded text-[9px] text-text-tertiary hover:text-text-secondary hover:border-border-highlight transition-all"
        >
          <Search size={10} />
          <span className="hidden lg:inline">Search</span>
          <kbd className="text-[8px] opacity-50">⌘K</kbd>
        </button>
        <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${status.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.color === 'text-positive' ? 'bg-positive' : status.color === 'text-accent' ? 'bg-accent' : status.color === 'text-cyan' ? 'bg-cyan' : status.color === 'text-warning' ? 'bg-warning' : 'bg-text-tertiary'}`} style={{ animation: 'pulse-dot 2s infinite' }} />
          {status.label}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-tertiary">
          <Wifi size={10} className="text-positive" />
          <span className="text-text-secondary">{time}</span>
          <span className="text-text-muted">UTC</span>
        </div>
      </div>
    </div>
  );
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleOpenLayout = () => setIsLayoutOpen(true);
    window.addEventListener('vantage-open-settings', handleOpenSettings);
    window.addEventListener('vantage-open-layout', handleOpenLayout);
    return () => {
      window.removeEventListener('vantage-open-settings', handleOpenSettings);
      window.removeEventListener('vantage-open-layout', handleOpenLayout);
    };
  }, []);

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';

  if (isPublicPage) {
    return (
      <main className="w-full min-h-[100dvh] bg-background text-text-primary overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background relative overflow-hidden">
        <TopBar />
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </main>
      <CommandPalette />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <LayoutSettingsModal isOpen={isLayoutOpen} onClose={() => setIsLayoutOpen(false)} />
    </>
  );
}
