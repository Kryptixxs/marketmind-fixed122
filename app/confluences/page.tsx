'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, CheckCircle2, XCircle, Loader2, Zap, AlertTriangle } from 'lucide-react';
import { ConfluenceEngine } from '@/lib/confluence/engine';
import { ConfluenceResult, ConfluenceCategory } from '@/lib/confluence/types';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { TerminalCommandBar } from '@/components/TerminalCommandBar';

export default function ConfluencePage() {
  const [activeSymbol, setActiveSymbol] = useState('NQ=F');
  const [results, setResults] = useState<ConfluenceResult[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ConfluenceCategory | 'ALL'>('ALL');

  // Fetch real data
  const { data } = useMarketData([activeSymbol]);
  const tick = data[activeSymbol];

  useEffect(() => {
    const handleSymbolChange = (e: any) => setActiveSymbol(e.detail);
    window.addEventListener('vantage-symbol-change', handleSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', handleSymbolChange);
  }, []);

  useEffect(() => {
    if (!tick || !tick.history || tick.history.length < 50) return;

    const engine = new ConfluenceEngine({
      symbol: activeSymbol,
      interval: '1D',
      quotes: tick.history
    });
    
    // Calculate all 160+ metrics
    setResults(engine.calculateAll());
  }, [tick]);

  const loading = !tick || !tick.history || tick.history.length < 50;

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = r.label.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'ALL' || r.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [results, search, filter]);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <TerminalCommandBar />
      
      <div className="h-12 border-b border-border bg-surface flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            Terminal Engine // {activeSymbol}
          </h1>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2 bg-background border border-border px-2 py-1 rounded-sm">
            <Search size={12} className="text-text-tertiary" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search 160+ indicators..."
              className="bg-transparent border-none outline-none text-[10px] font-mono w-48 uppercase text-text-primary"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
          {['ALL', 'STRUCTURE', 'SMC', 'SR', 'MA', 'MOMENTUM', 'VOLUME', 'CANDLE', 'QUANT', 'DERIVATIVES'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`px-2 py-1 text-[9px] font-bold rounded-sm border transition-all whitespace-nowrap ${filter === cat ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-surface-highlight border-border text-text-tertiary hover:text-text-secondary'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
            <Loader2 size={32} className="animate-spin text-accent" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-text-primary">Loading live OHLCV for {activeSymbol}...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filteredResults.map(res => (
              <div key={res.id} className={`p-3 border rounded-sm transition-all ${res.isActive ? 'bg-accent/5 border-accent/30' : 'bg-surface border-border opacity-60'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase ${res.isActive ? 'text-text-primary' : 'text-text-secondary'}`}>{res.label}</span>
                    <span className="text-[8px] text-text-tertiary font-mono">{res.category}</span>
                  </div>
                  {res.isActive ? <CheckCircle2 size={14} className="text-positive shrink-0" /> : <XCircle size={14} className="text-text-tertiary shrink-0" />}
                </div>
                <p className="text-[9px] text-text-secondary leading-tight mb-3 h-6 overflow-hidden">{res.description}</p>
                
                {/* Footer status row */}
                {res.isActive ? (
                  <div className="flex items-center justify-between pt-2 border-t border-accent/10">
                    <span className="text-[8px] font-bold text-accent uppercase">Confidence</span>
                    <span className="text-[10px] font-mono font-bold text-accent">{res.score}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 pt-2 border-t border-border/50">
                     {res.description.includes('Requires') ? (
                       <>
                         <AlertTriangle size={10} className="text-warning" />
                         <span className="text-[8px] font-bold text-warning uppercase">Missing Feed</span>
                       </>
                     ) : (
                       <span className="text-[8px] font-bold text-text-tertiary uppercase">Inactive</span>
                     )}
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