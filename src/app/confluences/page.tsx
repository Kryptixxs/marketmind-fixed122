'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle2, XCircle, Loader2, Zap, ChevronDown } from 'lucide-react';
import { ConfluenceEngine } from '@/features/Terminal/services/confluence/engine';
import { ConfluenceResult, ConfluenceCategory } from '@/features/Terminal/services/confluence/types';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

const QUICK_SYMBOLS = ['NAS100', 'SPX500', 'AAPL', 'NVDA', 'BTCUSD', 'GOLD', 'EURUSD'];

export default function ConfluencePage() {
  const [activeSymbol, setActiveSymbol] = useState('NAS100');
  const [results, setResults] = useState<ConfluenceResult[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ConfluenceCategory | 'ALL'>('ALL');

  const { data } = useMarketData([activeSymbol]);
  const tick = data[activeSymbol];

  useEffect(() => {
    const handleSymbolChange = (e: any) => setActiveSymbol(e.detail);
    window.addEventListener('vantage-symbol-change', handleSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', handleSymbolChange);
  }, []);

  useEffect(() => {
    if (!tick?.history || tick.history.length < 50) return;
    const engine = new ConfluenceEngine({ symbol: activeSymbol, interval: '1D', quotes: tick.history });
    setResults(engine.calculateAll());
  }, [tick, activeSymbol]);

  const loading = !tick?.history || tick.history.length < 50;

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = r.label.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'ALL' || r.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [results, search, filter]);

  const activeCount = results.filter(r => r.isActive).length;
  const totalScore = results.filter(r => r.isActive).reduce((s, r) => s + r.score, 0);
  const avgScore = activeCount > 0 ? totalScore / activeCount : 0;

  const categories = useMemo(() => {
    const cats = new Set(results.map(r => r.category));
    return ['ALL', ...Array.from(cats)] as (ConfluenceCategory | 'ALL')[];
  }, [results]);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-surface p-3 shrink-0 space-y-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-warning" />
            <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Confluence Engine</span>
          </div>

          <div className="h-5 w-px bg-border hidden md:block" />

          {/* Symbol Quick Select */}
          <div className="flex items-center gap-1">
            {QUICK_SYMBOLS.map(sym => (
              <button
                key={sym}
                onClick={() => setActiveSymbol(sym)}
                className={`px-2 py-1 text-[9px] font-bold uppercase rounded transition-colors ${
                  activeSymbol === sym
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-tertiary hover:text-text-secondary border border-transparent'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="text-center">
              <div className="text-[8px] text-text-tertiary font-bold uppercase">Active Signals</div>
              <div className="text-sm font-mono font-bold text-positive">{activeCount} / {results.length}</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-text-tertiary font-bold uppercase">Avg Confidence</div>
              <div className={`text-sm font-mono font-bold ${avgScore > 70 ? 'text-positive' : avgScore > 40 ? 'text-warning' : 'text-negative'}`}>
                {avgScore.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-background border border-border rounded px-2 py-1 focus-within:border-accent/40 transition-colors">
            <Search size={12} className="text-text-tertiary" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search indicators..."
              className="bg-transparent border-none outline-none text-[10px] font-mono w-40 uppercase text-text-primary placeholder:text-text-tertiary"
            />
          </div>
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded whitespace-nowrap transition-colors ${
                  filter === cat
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-tertiary hover:text-text-secondary border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Loading data for {activeSymbol}...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredResults.map(res => (
              <div
                key={res.id}
                className={`p-3 border rounded transition-all ${
                  res.isActive
                    ? 'bg-surface border-accent/20 hover:border-accent/40'
                    : 'bg-surface/50 border-border opacity-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] font-bold uppercase truncate ${res.isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {res.label}
                    </span>
                    <span className="text-[8px] text-text-tertiary font-mono uppercase">{res.category}</span>
                  </div>
                  {res.isActive
                    ? <CheckCircle2 size={13} className="text-positive shrink-0" />
                    : <XCircle size={13} className="text-text-muted shrink-0" />
                  }
                </div>
                <p className="text-[9px] text-text-tertiary leading-snug mb-3 line-clamp-2">{res.description}</p>
                {res.isActive && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-[8px] font-bold text-accent uppercase">Confidence</span>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1 bg-surface-highlight rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${res.score}%` }} />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-accent">{res.score}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
