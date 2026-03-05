'use client';

import Link from 'next/link';
import { Terminal, Activity, Zap, Shield, ArrowRight, Globe, BarChart3, Cpu, Lock } from 'lucide-react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

export default function LandingPage() {
  const { data: tickerData } = useMarketData(['NAS100', 'SPX500', 'GOLD', 'CRUDE', 'BTCUSD']);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/30 selection:text-accent font-mono">
      {/* Top Institutional Ticker */}
      <div className="h-7 bg-surface border-b border-border flex items-center overflow-hidden whitespace-nowrap">
        <div className="flex items-center animate-ticker">
          {Object.values(tickerData).map((tick) => (
            <div key={tick.symbol} className="flex items-center gap-2 px-6 border-r border-border/50">
              <span className="text-[10px] font-bold text-text-secondary uppercase">{tick.symbol}</span>
              <span className="text-[10px] font-bold text-text-primary">{tick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className={`text-[9px] font-bold ${tick.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                {tick.changePercent >= 0 ? '+' : ''}{tick.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
          {/* Duplicate for seamless loop */}
          {Object.values(tickerData).map((tick) => (
            <div key={`${tick.symbol}-dup`} className="flex items-center gap-2 px-6 border-r border-border/50">
              <span className="text-[10px] font-bold text-text-secondary uppercase">{tick.symbol}</span>
              <span className="text-[10px] font-bold text-text-primary">{tick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className={`text-[9px] font-bold ${tick.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                {tick.changePercent >= 0 ? '+' : ''}{tick.changePercent.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Professional Header */}
      <header className="h-12 border-b border-border bg-background flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Terminal size={18} className="text-accent" />
          <span className="text-sm font-black tracking-tighter uppercase">Vantage Terminal</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
          <Link href="#infrastructure" className="hover:text-accent transition-colors">Infrastructure</Link>
          <Link href="#data-feeds" className="hover:text-accent transition-colors">Data Feeds</Link>
          <Link href="#pricing" className="hover:text-accent transition-colors">Entitlements</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[10px] font-bold text-text-secondary hover:text-text-primary uppercase tracking-widest">
            Sign In
          </Link>
          <Link href="/register" className="px-3 py-1.5 bg-accent text-accent-text text-[10px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity">
            Request Access
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section: Terminal Focus */}
        <section className="relative pt-24 pb-16 px-6 flex flex-col items-center text-center border-b border-border bg-[radial-gradient(circle_at_center,_var(--color-surface)_0%,_transparent_100%)]">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase tracking-[0.2em] mb-6">
            System Status: Operational // v4.0.2
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter max-w-4xl leading-[0.9] mb-6 uppercase">
            The Algorithmic <br />
            <span className="text-accent">Standard.</span>
          </h1>
          
          <p className="text-xs md:text-sm text-text-secondary max-w-xl mb-10 leading-relaxed font-medium">
            Institutional-grade intelligence for systematic traders. Sub-second tick data, automated market structure mapping, and cross-asset correlation synthesis.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/dashboard" className="h-10 px-6 bg-text-primary text-background flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-accent transition-colors">
              Launch Terminal <ArrowRight size={14} />
            </Link>
            <Link href="/register" className="h-10 px-6 bg-surface border border-border flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-surface-highlight transition-colors">
              View Documentation
            </Link>
          </div>

          {/* Terminal Preview Mockup */}
          <div className="mt-16 w-full max-w-5xl aspect-video bg-surface border border-border rounded-t-md shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
            <div className="p-2 border-b border-border bg-surface-highlight flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-negative/50" />
              <div className="w-2 h-2 rounded-full bg-warning/50" />
              <div className="w-2 h-2 rounded-full bg-positive/50" />
              <div className="ml-4 h-4 w-64 bg-background border border-border rounded-sm" />
            </div>
            <div className="grid grid-cols-12 h-full opacity-40 group-hover:opacity-60 transition-opacity">
              <div className="col-span-3 border-r border-border p-4 space-y-4">
                <div className="h-4 w-full bg-border rounded-sm" />
                <div className="space-y-2">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-8 w-full bg-surface-highlight rounded-sm" />)}
                </div>
              </div>
              <div className="col-span-9 p-4">
                <div className="h-full w-full border border-border rounded-sm bg-background/50 flex items-center justify-center">
                  <BarChart3 size={48} className="text-text-tertiary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specs Grid */}
        <section id="infrastructure" className="py-16 px-6 md:px-12 bg-background">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-px bg-border border border-border">
            {[
              { icon: Activity, title: "Low Latency", desc: "Sub-15ms execution and data propagation across global nodes." },
              { icon: Cpu, title: "Quant Engine", desc: "Automated SMC, ICT, and VPA math calculated on every tick." },
              { icon: Globe, title: "Cross-Asset", desc: "Unified feed for FX, Equities, Crypto, and Global Futures." },
              { icon: Lock, title: "Isolated", desc: "Hardware-level encryption for API keys and institutional accounts." }
            ].map((spec, i) => (
              <div key={i} className="p-8 bg-background hover:bg-surface transition-colors">
                <spec.icon size={20} className="text-accent mb-6" />
                <h3 className="text-xs font-bold uppercase tracking-widest mb-3">{spec.title}</h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {spec.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border bg-surface flex flex-col items-center gap-4">
        <div className="flex items-center gap-6 text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>SLA Agreement</span>
          <span>API Docs</span>
        </div>
        <p className="text-[9px] text-text-tertiary font-mono uppercase tracking-[0.3em]">© 2026 Vantage Terminal // Institutional Intelligence</p>
      </footer>
    </div>
  );
}