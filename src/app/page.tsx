'use client';

import Link from 'next/link';
import { 
  Terminal, Activity, Zap, Shield, ArrowRight, Globe, 
  BarChart3, Cpu, Lock, Database, Server, ShieldCheck, 
  Check, Layers, Radio, Workflow, Building2, Users
} from 'lucide-react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

export default function LandingPage() {
  const { data: tickerData } = useMarketData(['NAS100', 'SPX500', 'GOLD', 'CRUDE', 'BTCUSD']);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/30 selection:text-accent font-mono scroll-smooth">
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
          <Link href="#entitlements" className="hover:text-accent transition-colors">Entitlements</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[10px] font-bold text-text-secondary hover:text-text-primary uppercase tracking-widest">
            Sign In
          </Link>
          <Link href="/register" className="px-3 py-1.5 bg-accent text-accent-text text-[10px] font-bold uppercase rounded-sm hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(0,255,157,0.2)]">
            Request Access
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-24 pb-16 px-6 flex flex-col items-center text-center border-b border-border bg-[radial-gradient(circle_at_center,_var(--color-surface)_0%,_transparent_100%)]">
          <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-sm bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase tracking-[0.2em] mb-6">
            System Status: Operational // v4.0.2
          </div>
          
          <h1 className="text-4xl md:text-7xl font-black tracking-tighter max-w-5xl leading-[0.85] mb-6 uppercase">
            Institutional <br />
            <span className="text-accent">Intelligence.</span>
          </h1>
          
          <p className="text-xs md:text-sm text-text-secondary max-w-xl mb-10 leading-relaxed font-medium">
            The definitive terminal for systematic traders. Sub-15ms data propagation, automated SMC mapping, and cross-asset correlation synthesis.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/register" className="h-10 px-8 bg-text-primary text-background flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-accent transition-colors">
              Launch Terminal <ArrowRight size={14} />
            </Link>
            <Link href="/register" className="h-10 px-8 bg-surface border border-border flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-surface-highlight transition-colors">
              Beta Program
            </Link>
          </div>

          {/* Terminal Preview */}
          <div className="mt-16 w-full max-w-6xl aspect-video bg-surface border border-border rounded-t-md shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
            <div className="p-2 border-b border-border bg-surface-highlight flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-negative/50" />
                <div className="w-2 h-2 rounded-full bg-warning/50" />
                <div className="w-2 h-2 rounded-full bg-positive/50" />
              </div>
              <div className="text-[8px] font-bold text-text-tertiary uppercase tracking-widest">Vantage_OS // Live_Session</div>
            </div>
            <div className="grid grid-cols-12 h-full opacity-40 group-hover:opacity-70 transition-all duration-700">
              <div className="col-span-3 border-r border-border p-4 space-y-4">
                <div className="h-4 w-full bg-border rounded-sm" />
                <div className="space-y-2">
                  {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-6 w-full bg-surface-highlight rounded-sm" />)}
                </div>
              </div>
              <div className="col-span-6 border-r border-border p-4">
                <div className="h-full w-full border border-border rounded-sm bg-background/50 flex flex-col">
                  <div className="h-8 border-b border-border" />
                  <div className="flex-1 flex items-center justify-center">
                    <BarChart3 size={64} className="text-text-tertiary animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="col-span-3 p-4 space-y-4">
                <div className="h-32 w-full bg-surface-highlight rounded-sm" />
                <div className="h-32 w-full bg-surface-highlight rounded-sm" />
                <div className="h-32 w-full bg-surface-highlight rounded-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* Infrastructure Section */}
        <section id="infrastructure" className="py-24 px-6 md:px-12 bg-background border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-start">
              <div className="md:w-1/3 space-y-6">
                <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-sm flex items-center justify-center text-accent">
                  <Server size={24} />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Global <br />Infrastructure</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Our proprietary network architecture is built for zero-compromise execution. We operate private nodes in Equinix NY4, LD4, and TY3 to ensure sub-millisecond data propagation.
                </p>
                <div className="space-y-3 pt-4">
                  {[
                    { icon: ShieldCheck, label: "AES-256 End-to-End Encryption" },
                    { icon: Zap, label: "Sub-15ms Internal Latency" },
                    { icon: Globe, label: "12 Global Edge Nodes" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-[10px] font-bold uppercase text-text-primary">
                      <item.icon size={14} className="text-accent" />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-6 bg-surface border border-border rounded-sm space-y-4">
                  <Cpu size={20} className="text-text-tertiary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Quant Engine v4</h3>
                  <p className="text-[11px] text-text-secondary leading-relaxed">Automated Smart Money Concepts (SMC) and Volume Price Analysis (VPA) calculated on every tick. No lag, no repainting.</p>
                </div>
                <div className="p-6 bg-surface border border-border rounded-sm space-y-4">
                  <Lock size={20} className="text-text-tertiary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Isolated Security</h3>
                  <p className="text-[11px] text-text-secondary leading-relaxed">Hardware-level isolation for API keys. Your broker credentials never touch our persistent storage in plain text.</p>
                </div>
                <div className="p-6 bg-surface border border-border rounded-sm space-y-4">
                  <Workflow size={20} className="text-text-tertiary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Logic Synthesis</h3>
                  <p className="text-[11px] text-text-secondary leading-relaxed">Multi-modal AI agents synthesize news, macro data, and technicals into a single high-conviction bias score.</p>
                </div>
                <div className="p-6 bg-surface border border-border rounded-sm space-y-4">
                  <Activity size={20} className="text-text-tertiary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Real-time L2</h3>
                  <p className="text-[11px] text-text-secondary leading-relaxed">Full order book depth and time-and-sales filtering for institutional-grade liquidity analysis.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Feeds Section */}
        <section id="data-feeds" className="py-24 px-6 md:px-12 bg-surface border-b border-border">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Unified Data Matrix</h2>
            <p className="text-xs text-text-secondary max-w-2xl mx-auto">We aggregate data from the world's most reliable providers into a single, low-latency stream.</p>
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
            {[
              { label: "Equities", sources: ["NASDAQ", "NYSE", "CBOE"], icon: BarChart3 },
              { label: "Futures", sources: ["CME", "CBOT", "NYMEX"], icon: Activity },
              { label: "Forex", sources: ["OANDA", "ICE", "LMAX"], icon: Globe },
              { label: "Crypto", sources: ["Binance", "Coinbase", "Kraken"], icon: Database }
            ].map((feed, i) => (
              <div key={i} className="p-8 bg-background space-y-6">
                <feed.icon size={24} className="text-accent mx-auto" />
                <h3 className="text-xs font-bold uppercase tracking-widest">{feed.label}</h3>
                <div className="flex flex-col gap-2">
                  {feed.sources.map(s => (
                    <div key={s} className="flex items-center justify-between text-[10px] font-mono text-text-tertiary">
                      <span>{s}</span>
                      <span className="text-positive">LIVE</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto mt-16 p-6 bg-background border border-border rounded-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-4">
              <Radio size={32} className="text-accent animate-pulse" />
              <div className="text-left">
                <h4 className="text-xs font-bold uppercase tracking-widest">Direct Exchange Connectivity</h4>
                <p className="text-[10px] text-text-tertiary">Bypassing standard retail aggregators for raw binary feeds.</p>
              </div>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <span className="px-3 py-1 bg-surface border border-border rounded-sm">L1 Quote</span>
              <span className="px-3 py-1 bg-surface border border-border rounded-sm">L2 Depth</span>
              <span className="px-3 py-1 bg-surface border border-border rounded-sm">Full Tape</span>
            </div>
          </div>
        </section>

        {/* Entitlements Section */}
        <section id="entitlements" className="py-24 px-6 md:px-12 bg-background">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Terminal Entitlements</h2>
            <p className="text-xs text-text-secondary max-w-2xl mx-auto">Select the tier that matches your execution requirements.</p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Professional */}
            <div className="p-8 bg-surface border border-border rounded-sm flex flex-col">
              <div className="flex items-center gap-2 text-text-primary mb-2">
                <Zap size={18} />
                <span className="text-sm font-bold uppercase tracking-widest">Professional</span>
              </div>
              <div className="text-3xl font-black tracking-tighter mb-6">$499<span className="text-xs text-text-tertiary font-bold">/MO</span></div>
              <ul className="space-y-4 mb-12 flex-1">
                {["Real-time L1 Data", "Quant Engine Access", "Standard AI Depth", "10 Active Watchlists", "Mobile Companion"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-[10px] font-bold text-text-secondary uppercase">
                    <Check size={14} className="text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="w-full py-3 bg-surface-highlight border border-border text-[10px] font-bold uppercase tracking-widest text-center hover:text-white transition-colors">Select Tier</Link>
            </div>

            {/* Team - Featured */}
            <div className="p-8 bg-accent/5 border-2 border-accent rounded-sm flex flex-col relative">
              <div className="absolute top-0 right-0 bg-accent text-accent-text px-3 py-1 text-[9px] font-black uppercase tracking-widest">Most Popular</div>
              <div className="flex items-center gap-2 text-accent mb-2">
                <Users size={18} />
                <span className="text-sm font-bold uppercase tracking-widest">Trading Desk</span>
              </div>
              <div className="text-3xl font-black tracking-tighter mb-6">$1,299<span className="text-xs text-text-tertiary font-bold">/MO</span></div>
              <ul className="space-y-4 mb-12 flex-1">
                {["Everything in Pro", "Full L2 Order Depth", "Deep AI Synthesis", "Shared Workspaces", "Priority Node Access", "API Access (100 req/s)"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-[10px] font-bold text-text-primary uppercase">
                    <Check size={14} className="text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="w-full py-3 bg-accent text-accent-text text-[10px] font-bold uppercase tracking-widest text-center hover:opacity-90 transition-opacity">Request Desk Access</Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 bg-surface border border-border rounded-sm flex flex-col">
              <div className="flex items-center gap-2 text-text-primary mb-2">
                <Building2 size={18} />
                <span className="text-sm font-bold uppercase tracking-widest">Enterprise</span>
              </div>
              <div className="text-3xl font-black tracking-tighter mb-6">Custom</div>
              <ul className="space-y-4 mb-12 flex-1">
                {["White-label Terminal", "On-premise Node Deployment", "Custom Quant Models", "Dedicated Account Manager", "SLA Guarantee (99.99%)", "Unlimited API Access"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-[10px] font-bold text-text-secondary uppercase">
                    <Check size={14} className="text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="w-full py-3 bg-surface-highlight border border-border text-[10px] font-bold uppercase tracking-widest text-center hover:text-white transition-colors">Contact Sales</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border bg-surface flex flex-col items-center gap-6">
        <div className="flex items-center gap-8 text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
          <Link href="#" className="hover:text-accent transition-colors">Privacy Policy</Link>
          <Link href="#" className="hover:text-accent transition-colors">Terms of Service</Link>
          <Link href="#" className="hover:text-accent transition-colors">SLA Agreement</Link>
          <Link href="#" className="hover:text-accent transition-colors">API Docs</Link>
          <Link href="#" className="hover:text-accent transition-colors">Status</Link>
        </div>
        <div className="flex items-center gap-4 opacity-30 grayscale">
          <div className="h-4 w-px bg-border" />
          <span className="text-[10px] font-black tracking-tighter uppercase">Vantage Terminal</span>
          <div className="h-4 w-px bg-border" />
        </div>
        <p className="text-[9px] text-text-tertiary font-mono uppercase tracking-[0.3em]">© 2026 Vantage Terminal // Institutional Intelligence</p>
      </footer>
    </div>
  );
}