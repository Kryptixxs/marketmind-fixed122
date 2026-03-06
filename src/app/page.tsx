'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight, Activity, BarChart3, Cpu, Globe, Shield,
  Zap, LineChart, Database, Layers, Terminal, Radio,
  TrendingUp, TrendingDown,
} from 'lucide-react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

const TICKER_SYMBOLS = ['SPX500', 'NAS100', 'US30', 'GOLD', 'CRUDE', 'BTCUSD', 'EURUSD', 'VIX'];

const FEATURES = [
  {
    icon: Activity,
    title: 'Real-Time Market Data',
    description: 'Live streaming quotes across equities, indices, commodities, forex, and crypto with institutional-grade latency.',
    color: 'text-cyan',
    bg: 'bg-cyan/5 border-cyan/10',
  },
  {
    icon: LineChart,
    title: 'Advanced Charting',
    description: 'Professional candlestick charts with multiple timeframes, from 1-minute scalping to weekly macro views.',
    color: 'text-accent',
    bg: 'bg-accent/5 border-accent/10',
  },
  {
    icon: BarChart3,
    title: 'Stock Screener',
    description: 'Filter thousands of instruments by performance, volatility, and sector with preset institutional screens.',
    color: 'text-positive',
    bg: 'bg-positive/5 border-positive/10',
  },
  {
    icon: Cpu,
    title: 'Quantitative Engine',
    description: 'Built-in confluence analysis, technical scoring, and signal detection powered by real-time calculations.',
    color: 'text-warning',
    bg: 'bg-warning/5 border-warning/10',
  },
  {
    icon: Globe,
    title: 'Economic Intelligence',
    description: 'Comprehensive economic calendar with impact ratings, surprise analysis, and event-driven intelligence.',
    color: 'text-accent-bright',
    bg: 'bg-accent-bright/5 border-accent-bright/10',
  },
  {
    icon: Shield,
    title: 'Portfolio Analytics',
    description: 'Track positions, measure risk metrics including VaR and Sharpe ratio, and monitor real-time P&L.',
    color: 'text-negative',
    bg: 'bg-negative/5 border-negative/10',
  },
];

function TickerBar() {
  const { data } = useMarketData(TICKER_SYMBOLS);
  return (
    <div className="border-b border-border bg-background/50 backdrop-blur-xl overflow-hidden">
      <div className="flex items-center gap-6 px-6 py-2 ticker-scroll whitespace-nowrap" style={{ width: 'max-content' }}>
        {[...TICKER_SYMBOLS, ...TICKER_SYMBOLS].map((sym, i) => {
          const tick = data[TICKER_SYMBOLS[i % TICKER_SYMBOLS.length]];
          const isPos = tick?.changePercent != null ? tick.changePercent >= 0 : true;
          return (
            <div key={`${sym}-${i}`} className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-text-secondary font-bold">{sym}</span>
              <span className="text-text-primary font-bold">
                {tick?.price != null ? tick.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '---'}
              </span>
              <span className={`font-bold flex items-center gap-0.5 ${isPos ? 'text-positive' : 'text-negative'}`}>
                {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {tick?.changePercent != null ? `${isPos ? '+' : ''}${tick.changePercent.toFixed(2)}%` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans selection:bg-accent/30 selection:text-white scroll-smooth overflow-y-auto">
      <TickerBar />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <Terminal size={16} className="text-accent" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-text-primary uppercase">Vantage</span>
              <span className="text-[8px] font-bold text-text-tertiary tracking-[0.2em] uppercase">Terminal</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {['Features', 'Data', 'Pricing'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors uppercase tracking-wider">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs font-bold text-text-secondary hover:text-text-primary transition-colors uppercase tracking-wider">
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-accent hover:bg-accent-muted text-white text-xs font-bold uppercase tracking-wider rounded transition-colors"
            >
              Get Access
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/5 border border-accent/15 rounded-full mb-6">
              <Radio size={10} className="text-accent" />
              <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Live Market Intelligence</span>
            </div>

            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[0.9] mb-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <span className="text-text-primary">Institutional-Grade</span>
              <br />
              <span className="bg-gradient-to-r from-accent via-cyan to-accent-bright bg-clip-text text-transparent">
                Market Terminal
              </span>
            </h1>

            <p className={`text-base md:text-lg text-text-secondary leading-relaxed max-w-xl mb-10 font-sans transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              Real-time data aggregation, professional charting, quantitative analytics,
              and AI-powered intelligence — built for traders who demand more.
            </p>

            <div className={`flex flex-wrap gap-3 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Link
                href="/register"
                className="group flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-muted text-white font-bold text-sm uppercase tracking-wider rounded transition-all glow-blue"
              >
                Launch Terminal
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-3 bg-surface border border-border hover:border-border-highlight text-text-secondary hover:text-text-primary font-bold text-sm uppercase tracking-wider rounded transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Floating Stats */}
          <div className={`hidden lg:grid grid-cols-4 gap-3 mt-20 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {[
              { label: 'Instruments', value: '5,000+', icon: Database },
              { label: 'Data Sources', value: '15+', icon: Layers },
              { label: 'Update Latency', value: '<500ms', icon: Zap },
              { label: 'Asset Classes', value: '6', icon: Globe },
            ].map(stat => (
              <div key={stat.label} className="bg-surface/50 border border-border rounded-lg p-4 backdrop-blur">
                <stat.icon size={16} className="text-accent mb-2" />
                <div className="text-2xl font-black text-text-primary font-mono">{stat.value}</div>
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-text-primary mb-3">
              Professional-Grade Capabilities
            </h2>
            <p className="text-text-secondary text-sm max-w-lg mx-auto font-sans">
              Every tool a serious trader needs, unified in a single platform with real-time data feeds and institutional analytics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(feat => (
              <div key={feat.title} className={`${feat.bg} border rounded-lg p-6 group hover:scale-[1.01] transition-transform`}>
                <feat.icon size={20} className={`${feat.color} mb-3`} />
                <h3 className="text-sm font-bold text-text-primary mb-2">{feat.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed font-sans">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section id="data" className="border-t border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-text-primary mb-4">
                Multi-Source Data Aggregation
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-8 font-sans">
                We aggregate data from multiple institutional-grade sources to provide
                comprehensive market coverage across all major asset classes.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  'Equities & ETFs', 'Global Indices', 'Commodities', 'Forex Pairs',
                  'Crypto Assets', 'Fixed Income', 'Economic Data', 'News & Sentiment',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 bg-surface border border-border rounded px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-positive" />
                    <span className="text-xs text-text-primary font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 font-mono text-[11px]">
              <div className="flex items-center gap-2 text-text-tertiary mb-4">
                <div className="w-2 h-2 rounded-full bg-positive" />
                <span className="text-positive font-bold">CONNECTED</span>
                <span className="text-text-muted ml-auto">feeds://vantage.live</span>
              </div>
              <div className="space-y-1 text-text-secondary">
                <div><span className="text-accent">GET</span> /v1/quote/AAPL <span className="text-positive ml-2">200 OK</span> <span className="text-text-muted">12ms</span></div>
                <div><span className="text-accent">GET</span> /v1/chart/SPX500 <span className="text-positive ml-2">200 OK</span> <span className="text-text-muted">8ms</span></div>
                <div><span className="text-accent">WSS</span> /v1/stream <span className="text-cyan ml-2">OPEN</span> <span className="text-text-muted">symbols=42</span></div>
                <div><span className="text-accent">GET</span> /v1/calendar <span className="text-positive ml-2">200 OK</span> <span className="text-text-muted">45ms</span></div>
                <div><span className="text-accent">GET</span> /v1/news/feed <span className="text-positive ml-2">200 OK</span> <span className="text-text-muted">92ms</span></div>
                <div className="text-text-muted pt-2 border-t border-border mt-2">
                  <span className="text-positive">▲</span> throughput: 2.4k req/min | <span className="text-positive">●</span> uptime: 99.97%
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-black text-text-primary mb-3">Ready to Elevate Your Trading?</h2>
          <p className="text-text-secondary text-sm mb-8 max-w-md mx-auto font-sans">
            Join traders who demand institutional-grade tools without the institutional price tag.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent-muted text-white font-bold text-sm uppercase tracking-wider rounded transition-all glow-blue"
          >
            Get Started Free
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-accent" />
            <span className="text-xs font-bold text-text-secondary uppercase">Vantage Terminal</span>
          </div>
          <div className="text-[10px] text-text-tertiary font-mono">
            Market data provided for informational purposes. Not financial advice.
          </div>
        </div>
      </footer>
    </div>
  );
}
