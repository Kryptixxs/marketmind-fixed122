'use client';

import Link from 'next/link';
import { Terminal, Activity, Zap, Shield, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-accent/30 selection:text-accent">
      {/* Public Navbar */}
      <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-md flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Terminal size={24} className="text-accent" />
          <span className="text-lg font-bold tracking-tight">VANTAGE</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
          <Link href="#features" className="hover:text-text-primary transition-colors">Platform</Link>
          <Link href="#data" className="hover:text-text-primary transition-colors">Data Feeds</Link>
          <Link href="#pricing" className="hover:text-text-primary transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-text-secondary hover:text-text-primary transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 bg-accent text-accent-text text-sm font-bold rounded-sm hover:opacity-90 transition-opacity">
            Request Access
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col">
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Vantage v4.0 is Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter max-w-4xl leading-[1.1] mb-6">
            Institutional Intelligence. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-500">
              Unlocked for Retail.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mb-10 leading-relaxed">
            A unified algorithmic terminal replacing your fragmented workflow. Real-time tick data, AI-driven macro synthesis, and Smart Money Concepts mapped automatically.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/register" className="h-12 px-8 bg-text-primary text-background flex items-center gap-2 text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-text-secondary transition-colors">
              Launch Terminal <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="h-12 px-8 bg-surface border border-border flex items-center gap-2 text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-surface-highlight transition-colors">
              Sign In
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 px-6 md:px-12 bg-surface/30 border-t border-border">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-background border border-border rounded-md hover:border-accent/30 transition-colors">
              <Zap size={32} className="text-accent mb-6" />
              <h3 className="text-xl font-bold mb-3">AI Synthesis Engine</h3>
              <p className="text-text-secondary leading-relaxed">
                We ingest millions of news articles, SEC filings, and FOMC minutes in real-time, mapping them directly to algorithmic price setups.
              </p>
            </div>
            <div className="p-8 bg-background border border-border rounded-md hover:border-accent/30 transition-colors">
              <Activity size={32} className="text-accent mb-6" />
              <h3 className="text-xl font-bold mb-3">Sub-Second Ticks</h3>
              <p className="text-text-secondary leading-relaxed">
                Institutional-grade WebSockets deliver real-time FX, Equities, Crypto, and Futures data directly into your browser with zero lag.
              </p>
            </div>
            <div className="p-8 bg-background border border-border rounded-md hover:border-accent/30 transition-colors">
              <Shield size={32} className="text-accent mb-6" />
              <h3 className="text-xl font-bold mb-3">SMC Autopilot</h3>
              <p className="text-text-secondary leading-relaxed">
                Stop drawing boxes. Our math engine automatically identifies Fair Value Gaps, Liquidity Sweeps, and Market Structure Shifts.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border text-center text-xs text-text-tertiary">
        <p>© 2026 Vantage Terminal. All rights reserved.</p>
      </footer>
    </div>
  );
}