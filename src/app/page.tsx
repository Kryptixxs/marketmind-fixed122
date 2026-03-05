'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { 
  ArrowRight, BarChart3, Cpu, Database, Globe, Lock, 
  Radio, Server, Shield, Activity, Zap, ChevronRight,
  Terminal, Users, Building2, Check, Layers
} from 'lucide-react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

// Generates random "data matrix" characters for the background
function DataMatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    
    const chars = '0123456789ABCDEF.:/%+-';
    const fontSize = 11;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(0).map(() => Math.random() * -100);
    
    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 18, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'rgba(255, 140, 0, 0.06)';
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.985) {
          drops[i] = 0;
        }
        drops[i] += 0.3;
      }
    };
    
    const interval = setInterval(draw, 80);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);
  
  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-60" />;
}

function LiveTicker() {
  const { data: tickerData } = useMarketData(['NAS100', 'SPX500', 'US30', 'GOLD', 'CRUDE', 'BTCUSD', 'EURUSD']);
  
  return (
    <div className="h-7 bg-surface border-b border-border flex items-center overflow-hidden whitespace-nowrap">
      <div className="flex items-center animate-ticker">
        {[...Object.values(tickerData), ...Object.values(tickerData)].map((tick, idx) => (
          <div key={`${tick.symbol}-${idx}`} className="flex items-center gap-2 px-5 border-r border-border/40">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{tick.symbol}</span>
            <span className="text-[10px] font-bold text-text-primary tabular-nums">
              {tick.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className={`text-[9px] font-bold tabular-nums ${tick.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
              {tick.changePercent >= 0 ? '▲' : '▼'} {Math.abs(tick.changePercent).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TerminalPreview() {
  const [time, setTime] = useState('');
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toUTCString().split(' ')[4]), 1000);
    return () => clearInterval(t);
  }, []);
  
  return (
    <div className="w-full max-w-6xl aspect-[16/9] bg-surface border border-border relative overflow-hidden group">
      {/* Top bar */}
      <div className="h-7 bg-surface-highlight border-b border-border flex items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <span className="bb-fn-key bb-fn-key-amber text-[8px]">F1</span>
          <span className="text-[9px] font-bold text-accent tracking-wider">VANTAGE TERMINAL</span>
        </div>
        <div className="text-[9px] text-text-tertiary font-mono">{time} UTC // LIVE</div>
      </div>
      
      {/* Grid layout */}
      <div className="grid grid-cols-12 gap-px bg-border h-[calc(100%-28px)]">
        {/* Watchlist */}
        <div className="col-span-2 bg-surface p-2 space-y-1">
          <div className="bb-grid-header mb-1">WATCHLIST</div>
          {['NAS100', 'SPX500', 'US30', 'GOLD', 'CRUDE', 'BTCUSD', 'EURUSD', 'AAPL'].map((s, i) => (
            <div key={s} className={`flex justify-between items-center text-[9px] px-1 py-0.5 ${i === 0 ? 'bg-accent/10 border-l-2 border-accent' : ''}`}>
              <span className="font-bold text-text-primary">{s}</span>
              <span className={`tabular-nums ${i % 3 === 0 ? 'text-positive' : 'text-negative'}`}>
                {i % 3 === 0 ? '+' : '-'}{(Math.random() * 2).toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="col-span-7 bg-background flex flex-col">
          <div className="h-6 bg-surface border-b border-border flex items-center px-2">
            <span className="text-[9px] font-bold text-accent">NAS100</span>
            <span className="text-[9px] text-text-tertiary ml-2">// 5M // EXECUTION CHART</span>
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {/* Fake chart lines */}
            <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 400 200" preserveAspectRatio="none">
              <path d="M0,150 L30,140 L60,145 L90,130 L120,120 L150,125 L180,100 L210,105 L240,80 L270,85 L300,60 L330,70 L360,50 L400,40" 
                fill="none" stroke="#FF8C00" strokeWidth="1.5" />
              <path d="M0,150 L30,140 L60,145 L90,130 L120,120 L150,125 L180,100 L210,105 L240,80 L270,85 L300,60 L330,70 L360,50 L400,40 L400,200 L0,200 Z" 
                fill="url(#chartGradient)" />
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF8C00" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#FF8C00" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <BarChart3 size={48} className="text-accent/20 z-10" />
          </div>
        </div>
        
        {/* Side panels */}
        <div className="col-span-3 bg-surface flex flex-col gap-px">
          <div className="flex-1 bg-surface p-2">
            <div className="bb-grid-header mb-1">MARKET INTERNALS</div>
            <div className="space-y-1">
              {[['VIX', '14.23', 'text-positive'], ['DXY', '103.45', 'text-negative'], ['US10Y', '4.28%', 'text-positive']].map(([l, v, c]) => (
                <div key={l} className="flex justify-between text-[9px]">
                  <span className="text-text-secondary">{l}</span>
                  <span className={`font-bold ${c}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-surface p-2">
            <div className="bb-grid-header mb-1">LIVE INTELLIGENCE</div>
            <div className="space-y-1">
              {['Fed holds rates steady...', 'NVDA earnings beat...', 'Oil surges on OPEC...'].map((h, i) => (
                <div key={i} className="text-[8px] text-text-tertiary truncate">{h}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent z-10 pointer-events-none" />
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => setMounted(true), []);
  
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/30 selection:text-accent font-mono scroll-smooth overflow-y-auto overflow-x-hidden">
      {/* Live Ticker */}
      <LiveTicker />
      
      {/* Header */}
      <header className="h-11 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-accent rounded-sm flex items-center justify-center">
            <Terminal size={14} className="text-background" />
          </div>
          <span className="text-xs font-black tracking-tight uppercase text-text-primary">
            VANTAGE<span className="text-accent">.</span>TERMINAL
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary">
          <Link href="#platform" className="hover:text-accent transition-colors">Platform</Link>
          <Link href="#data" className="hover:text-accent transition-colors">Data</Link>
          <Link href="#pricing" className="hover:text-accent transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[10px] font-bold text-text-secondary hover:text-accent uppercase tracking-widest transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-1.5 bg-accent text-background text-[10px] font-bold uppercase tracking-wider hover:bg-accent-bright transition-colors">
            <span className="flex items-center gap-1.5">Access Terminal <ChevronRight size={12} /></span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* ═══ HERO ═══ */}
        <section className="relative pt-20 pb-24 px-6 flex flex-col items-center text-center overflow-hidden">
          {mounted && <DataMatrixBackground />}
          
          {/* Ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-accent/10 border border-accent/20 text-accent text-[9px] font-bold uppercase tracking-[0.25em] mb-8">
              <span className="w-1.5 h-1.5 bg-positive rounded-full animate-pulse" />
              SYS.ONLINE // v4.2.0
            </div>
            
            <h1 className="text-4xl md:text-7xl font-black tracking-tighter max-w-5xl leading-[0.9] mb-6 uppercase">
              The <span className="text-accent">Bloomberg</span><br />
              of Retail Trading
            </h1>
            
            <p className="text-xs md:text-sm text-text-secondary max-w-xl mb-10 leading-relaxed font-medium mx-auto">
              Institutional-grade market intelligence. Sub-15ms data propagation. 
              Automated structure mapping. AI-powered confluence synthesis.
              <span className="text-accent"> Built for systematic traders.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link href="/register" className="h-10 px-8 bg-accent text-background flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] hover:bg-accent-bright transition-colors">
                Launch Terminal <ArrowRight size={14} />
              </Link>
              <Link href="/register" className="h-10 px-8 bg-surface border border-border flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-text-primary hover:border-accent/50 transition-colors">
                Request Demo
              </Link>
            </div>
          </div>
          
          {/* Terminal Preview */}
          <div className="mt-16 relative z-10">
            <TerminalPreview />
          </div>
        </section>

        {/* ═══ PLATFORM ═══ */}
        <section id="platform" className="py-24 px-6 md:px-12 bg-surface border-y border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-16">
              <div className="md:w-1/3 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="bb-fn-key bb-fn-key-amber">F1</span>
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">Platform Overview</span>
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">
                  Institutional<br /><span className="text-accent">Infrastructure</span>
                </h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Proprietary network architecture built for zero-compromise execution. 
                  Private nodes in Equinix NY4, LD4, and TY3 ensure sub-millisecond data propagation.
                </p>
                <div className="space-y-3 pt-4">
                  {[
                    { icon: Shield, label: "AES-256 End-to-End Encryption" },
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
              
              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Cpu, title: "Quant Engine v4", desc: "Automated SMC and VPA on every tick. No lag, no repainting. Sub-second conviction scoring." },
                  { icon: Lock, title: "Isolated Security", desc: "Hardware-level isolation for API keys. Credentials never touch persistent storage in plain text." },
                  { icon: Layers, title: "Logic Synthesis", desc: "Multi-modal AI agents synthesize news, macro, and technicals into high-conviction bias scores." },
                  { icon: Activity, title: "Real-time L2", desc: "Full order book depth and T&S filtering for institutional-grade liquidity analysis." }
                ].map((card, i) => (
                  <div key={i} className="p-6 bg-background border border-border hover:border-accent/30 transition-colors group">
                    <card.icon size={20} className="text-text-tertiary group-hover:text-accent transition-colors mb-4" />
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3">{card.title}</h3>
                    <p className="text-[10px] text-text-secondary leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ DATA FEEDS ═══ */}
        <section id="data" className="py-24 px-6 md:px-12 bg-background border-b border-border">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="bb-fn-key bb-fn-key-amber">F3</span>
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">Data Matrix</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
              Unified <span className="text-accent">Data</span> Matrix
            </h2>
            <p className="text-xs text-text-secondary max-w-2xl mx-auto">
              Aggregated from the world's most reliable exchanges into a single, low-latency stream.
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
            {[
              { label: "Equities", sources: ["NASDAQ", "NYSE", "CBOE"], icon: BarChart3 },
              { label: "Futures", sources: ["CME", "CBOT", "NYMEX"], icon: Activity },
              { label: "Forex", sources: ["OANDA", "ICE", "LMAX"], icon: Globe },
              { label: "Crypto", sources: ["Binance", "Coinbase", "Kraken"], icon: Database }
            ].map((feed, i) => (
              <div key={i} className="p-8 bg-surface space-y-5 hover:bg-surface-highlight transition-colors">
                <feed.icon size={22} className="text-accent mx-auto" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-center">{feed.label}</h3>
                <div className="flex flex-col gap-2">
                  {feed.sources.map(s => (
                    <div key={s} className="flex items-center justify-between text-[10px] font-mono text-text-tertiary">
                      <span>{s}</span>
                      <span className="text-positive flex items-center gap-1">
                        <span className="w-1 h-1 bg-positive rounded-full" />
                        LIVE
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="max-w-4xl mx-auto mt-12 p-5 bg-surface border border-border flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Radio size={28} className="text-accent" />
              <div className="text-left">
                <h4 className="text-xs font-bold uppercase tracking-widest">Direct Exchange Connectivity</h4>
                <p className="text-[10px] text-text-tertiary">Raw binary feeds bypassing retail aggregators.</p>
              </div>
            </div>
            <div className="flex gap-2 text-[9px] font-bold uppercase">
              {['L1 Quote', 'L2 Depth', 'Full Tape'].map(t => (
                <span key={t} className="px-3 py-1 bg-background border border-border">{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="pricing" className="py-24 px-6 md:px-12 bg-surface border-b border-border">
          <div className="max-w-6xl mx-auto text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="bb-fn-key bb-fn-key-amber">F7</span>
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em]">Entitlements</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Terminal <span className="text-accent">Entitlements</span></h2>
            <p className="text-xs text-text-secondary max-w-2xl mx-auto">Select the tier that matches your execution requirements.</p>
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Professional */}
            <div className="p-8 bg-background border border-border flex flex-col hover:border-accent/30 transition-colors">
              <div className="flex items-center gap-2 text-text-primary mb-2">
                <Zap size={16} />
                <span className="text-[11px] font-bold uppercase tracking-widest">Professional</span>
              </div>
              <div className="text-3xl font-black tracking-tighter mb-6">
                $499<span className="text-xs text-text-tertiary font-bold">/MO</span>
              </div>
              <ul className="space-y-3 mb-10 flex-1">
                {["Real-time L1 Data", "Quant Engine Access", "Standard AI Depth", "10 Active Watchlists", "Mobile Companion"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-[10px] font-bold text-text-secondary uppercase">
                    <Check size={12} className="text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="w-full py-2.5 bg-surface-highlight border border-border text-[10px] font-bold uppercase tracking-widest text-center hover:text-accent hover:border-accent/50 transition-colors">
                Select Tier
              </Link>
            </div>

            {/* Trading Desk — Featured */}
            <div className="p-8 bg-background border-2 border-accent flex flex-col relative">
              <div className="absolute top-0 right-0 bg-accent text-background px-3 py-1 text-[8px] font-black uppercase tracking-widest">
                RECOMMENDED
              </div>
              <div className="flex items-center gap-2 text-accent mb-2">
                <Users size={16} />
                <span className="text-[11px] font-bold uppercase tracking-widest">Trading Desk</span>
              </div>
              <div className="text-3xl font-black tracking-tighter mb-6">
                $1,299<span className="text-xs text-text-tertiary font-bold">/MO</span>
              </div>
              <ul className="space-y-3 mb-10 flex-1">
                {["Everything in Pro", "Full L2 Order Depth", "Deep AI Synthesis", "Shared Workspaces", "Priority Node Access", "API Access (100 req/s)"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-[10px] font-bold text-text-primary uppercase">
                    <Check size={12} className="text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="w-full py-2.5 bg-accent text-background text-[10px] font-bold uppercase tracking-widest text-center hover:bg-accent-bright transition-colors">
                Request Desk Access
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-8 bg-background border border-border flex flex-col hover:border-accent/30 transition-colors">
              <div className="flex items-center gap-2 text-text-primary mb-2">
                <Building2 size={16} />
                <span className="text-[11px] font-bold uppercase tracking-widest">Enterprise</span>
              </div>
              <div className="text-3xl font-black tracking-tighter mb-6">Custom</div>
              <ul className="space-y-3 mb-10 flex-1">
                {["White-label Terminal", "On-premise Deployment", "Custom Quant Models", "Dedicated Account Manager", "SLA Guarantee (99.99%)", "Unlimited API Access"].map(f => (
                  <li key={f} className="flex items-center gap-3 text-[10px] font-bold text-text-secondary uppercase">
                    <Check size={12} className="text-accent" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="w-full py-2.5 bg-surface-highlight border border-border text-[10px] font-bold uppercase tracking-widest text-center hover:text-accent hover:border-accent/50 transition-colors">
                Contact Sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background flex flex-col items-center gap-5">
        <div className="flex items-center gap-8 text-[9px] font-bold text-text-tertiary uppercase tracking-[0.2em]">
          <Link href="#" className="hover:text-accent transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-accent transition-colors">Terms</Link>
          <Link href="#" className="hover:text-accent transition-colors">SLA</Link>
          <Link href="#" className="hover:text-accent transition-colors">API Docs</Link>
          <Link href="#" className="hover:text-accent transition-colors">Status</Link>
        </div>
        <div className="flex items-center gap-3 opacity-40">
          <div className="h-px w-8 bg-accent" />
          <span className="text-[10px] font-black tracking-tight uppercase">VANTAGE<span className="text-accent">.</span>TERMINAL</span>
          <div className="h-px w-8 bg-accent" />
        </div>
        <p className="text-[8px] text-text-muted font-mono uppercase tracking-[0.3em]">
          © 2026 VANTAGE TERMINAL // INSTITUTIONAL INTELLIGENCE
        </p>
      </footer>
    </div>
  );
}