'use client';

import { useState, useEffect } from 'react';
import { MiniChart } from '@/components/MiniChart';
import { NewsFeed } from '@/components/NewsFeed';
import { Sparkles, TrendingUp, Activity, Globe, Zap, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';

const INDICES = [
  { title: 'S&P 500', symbol: '^GSPC' },
  { title: 'Nasdaq', symbol: '^NDX' },
  { title: 'Dow Jones', symbol: '^DJI' },
  { title: 'Gold', symbol: 'GC=F' },
  { title: 'Crude Oil', symbol: 'CL=F' },
  { title: '10Y Yield', symbol: '^TNX' },
];

const CRYPTO = [
  { title: 'Bitcoin', symbol: 'BTC-USD', isCrypto: true },
  { title: 'Ethereum', symbol: 'ETH-USD', isCrypto: true },
  { title: 'Solana', symbol: 'SOL-USD', isCrypto: true },
];

const FOREX = [
  { title: 'EUR/USD', symbol: 'EURUSD=X' },
  { title: 'USD/JPY', symbol: 'JPY=X' },
  { title: 'GBP/USD', symbol: 'GBPUSD=X' },
];

export default function Home() {
  const [activeSet, setActiveSet] = useState<'Indices' | 'Crypto' | 'Forex'>('Indices');
  
  // Dynamic market summary generation (simulated AI response for speed)
  const [briefing, setBriefing] = useState<string | null>(null);

  useEffect(() => {
    // Simulate an AI analyzing the pre-market conditions
    setTimeout(() => {
      setBriefing("Markets are showing resilience today as traders digest the latest inflation data. Tech sector leads the rebound with Nasdaq futures up 0.8%. Treasury yields have stabilized, providing support for growth stocks. Watch for volatility around 10 AM ET.");
    }, 1500);
  }, []);

  const currentTickers = activeSet === 'Indices' ? INDICES : activeSet === 'Crypto' ? CRYPTO : FOREX;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-background p-2 gap-2">
      {/* --- Top Bar: Market Summary & AI Brief --- */}
      <div className="flex gap-2 min-h-[120px] shrink-0">
        
        {/* AI Briefing Card */}
        <div className="flex-[2] glass-card p-3 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={60} />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-accent/20 flex items-center justify-center">
                <Sparkles size={12} className="text-accent" />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary">AI Market Brief</h2>
              <span className="text-[10px] bg-surface border border-border px-1.5 py-0.5 rounded text-text-tertiary">
                {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
            
            {briefing ? (
              <p className="text-lg font-medium text-text-primary leading-relaxed animate-in fade-in duration-700">
                {briefing}
              </p>
            ) : (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-surface rounded w-3/4"></div>
                <div className="h-4 bg-surface rounded w-1/2"></div>
              </div>
            )}
            
            <div className="mt-auto pt-3 flex gap-3">
               <button className="text-xs font-bold text-accent hover:text-white transition-colors flex items-center gap-1">
                 View Full Analysis <ArrowRight size={12} />
               </button>
            </div>
          </div>
        </div>

        {/* Market Vitals / Stats (Static Mock for layout) */}
        <div className="flex-1 glass-card p-3 flex flex-col justify-between">
           <div className="flex items-center gap-2 mb-1">
             <Activity size={12} className="text-positive" />
             <span className="text-[10px] font-bold uppercase text-text-secondary">Market Vitals</span>
           </div>
           <div className="grid grid-cols-2 gap-y-1 gap-x-3">
             <div>
               <div className="text-[10px] text-text-tertiary uppercase">VIX Volatility</div>
               <div className="text-base font-mono font-bold text-text-primary">14.25 <span className="text-negative text-xs">-2.1%</span></div>
             </div>
             <div>
               <div className="text-[10px] text-text-tertiary uppercase">Put/Call Ratio</div>
               <div className="text-base font-mono font-bold text-text-primary">0.85 <span className="text-text-tertiary text-xs">Neutral</span></div>
             </div>
             <div>
               <div className="text-[10px] text-text-tertiary uppercase">Breadth</div>
               <div className="text-base font-mono font-bold text-positive">65% Buy</div>
             </div>
             <div>
               <div className="text-[10px] text-text-tertiary uppercase">10Y Yield</div>
               <div className="text-base font-mono font-bold text-text-primary">4.12%</div>
             </div>
           </div>
        </div>
      </div>

      {/* --- Middle Row: Controls & Mini Charts --- */}
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex gap-2 bg-surface rounded-lg p-1 border border-border">
            {(['Indices', 'Crypto', 'Forex'] as const).map((set) => (
              <button
                key={set}
                onClick={() => setActiveSet(set)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  activeSet === set 
                    ? 'bg-accent text-white shadow-lg shadow-accent/25' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                }`}
              >
                {set}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-positive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-positive"></span>
              </span>
              Live Data
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {currentTickers.map((ticker, i) => (
             <div key={ticker.symbol} className="h-[100px] animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 50}ms` }}>
               <MiniChart {...ticker} isCrypto={'isCrypto' in ticker} />
             </div>
          ))}
        </div>
      </div>

      {/* --- Bottom Row: Split View (News & Movers) --- */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* News Feed */}
        <div className="col-span-8 flex flex-col min-h-0">
          <NewsFeed />
        </div>

        {/* Quick Lists / Tools */}
        <div className="col-span-4 flex flex-col gap-4 min-h-0">
           {/* Quick Actions */}
           <div className="glass-card p-4">
             <h3 className="text-xs font-bold uppercase text-text-secondary mb-3 flex items-center gap-2">
               <Layers size={14} /> Quick Tools
             </h3>
             <div className="grid grid-cols-2 gap-2">
               <Link href="/tools/forex" className="flex flex-col p-3 bg-surface hover:bg-surface-hover border border-border hover:border-accent/50 rounded-lg transition-colors group">
                 <Globe size={16} className="text-text-secondary group-hover:text-accent mb-2" />
                 <span className="text-xs font-bold text-text-primary">Forex Calc</span>
               </Link>
               <Link href="/tools/futures" className="flex flex-col p-3 bg-surface hover:bg-surface-hover border border-border hover:border-accent/50 rounded-lg transition-colors group">
                 <Activity size={16} className="text-text-secondary group-hover:text-accent mb-2" />
                 <span className="text-xs font-bold text-text-primary">Futures Calc</span>
               </Link>
               <Link href="/economic" className="flex flex-col p-3 bg-surface hover:bg-surface-hover border border-border hover:border-accent/50 rounded-lg transition-colors group">
                 <Zap size={16} className="text-text-secondary group-hover:text-accent mb-2" />
                 <span className="text-xs font-bold text-text-primary">Calendar</span>
               </Link>
               <Link href="/charts" className="flex flex-col p-3 bg-surface hover:bg-surface-hover border border-border hover:border-accent/50 rounded-lg transition-colors group">
                 <TrendingUp size={16} className="text-text-secondary group-hover:text-accent mb-2" />
                 <span className="text-xs font-bold text-text-primary">Terminal</span>
               </Link>
             </div>
           </div>

           {/* Watchlist Promo */}
           <div className="flex-1 glass-card p-4 flex flex-col justify-center items-center text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent"></div>
             <TrendingUp size={32} className="text-accent mb-2" />
             <h3 className="text-sm font-bold text-text-primary">Go Pro</h3>
             <p className="text-xs text-text-secondary mt-1 px-4">Get unlimited AI analysis and real-time data feeds.</p>
             <button className="mt-3 px-6 py-2 bg-accent text-white text-xs font-bold rounded-full shadow-lg shadow-accent/25 hover:bg-accent/90 transition-all">
               Upgrade Plan
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}