'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, CheckCircle2, XCircle, Info, Loader2, Zap } from 'lucide-react';
import { ConfluenceEngine } from '@/lib/confluence/engine';
import { ConfluenceResult, ConfluenceCategory } from '@/lib/confluence/types';
import { fetchMarketData } from '@/app/actions/fetchMarketData';
import YahooFinance from 'yahoo-finance2';

export default function ConfluencePage() {
  const [activeSymbol, setActiveSymbol] = useState('NQ=F');
  const [results, setResults] = useState<ConfluenceResult[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConfluenceCategory | 'ALL'>('ALL');

  useEffect(() => {
    async function runEngine() {
      setLoading(true);
      // In a real app, we'd fetch full OHLCV here. 
      // For this demo, we'll simulate the engine run with the active symbol.
      const engine = new ConfluenceEngine({
        symbol: activeSymbol,
        interval: '15m',
        quotes: Array.from({ length: 200 }, (_, i) => ({
          timestamp: Date.now() - i * 900000,
          open: 18000 + Math.random() * 100,
          high: 18100 + Math.random() * 100,
          low: 17900 + Math.random() * 100,
          close: 18050 + Math.random() * 100,
          volume: 5000 + Math.random() * 5000
        }))
      });
      
      setResults(engine.calculateAll());
      setLoading(false);
    }
    runEngine();
  }, [activeSymbol]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = r.label.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'ALL' || r.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [results, search, filter]);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <div className="h-12 border-b border-border bg-surface flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
            <Zap size={16} className="text-accent" />
            Confluence Terminal
          </h1>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2 bg-background border border-border px-2 py-1 rounded-sm">
            <Search size={12} className="text-text-tertiary" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search 100+ confluences..."
              className="bg-transparent border-none outline-none text-[10px] font-mono w-48 uppercase"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {['ALL', 'STRUCTURE', 'SMC', 'VOLUME', 'MOMENTUM', 'TIME'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat as any)}
              className={`px-2 py-1 text-[9px] font-bold rounded-sm border transition-all ${filter === cat ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-surface-highlight border-border text-text-tertiary'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 opacity-50">
            <Loader2 size={24} className="animate-spin text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Running Vantage Engine...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredResults.map(res => (
              <div key={res.id} className={`p-3 border rounded-sm transition-all ${res.isActive ? 'bg-accent/5 border-accent/30' : 'bg-surface border-border opacity-60'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-primary uppercase">{res.label}</span>
                    <span className="text-[8px] text-text-tertiary font-mono">{res.category}</span>
                  </div>
                  {res.isActive ? <CheckCircle2 size={14} className="text-positive" /> : <XCircle size={14} className="text-text-tertiary" />}
                </div>
                <p className="text-[9px] text-text-secondary leading-tight mb-3">{res.description}</p>
                {res.isActive && (
                  <div className="flex items-center justify-between pt-2 border-t border-accent/10">
                    <span className="text-[8px] font-bold text-accent uppercase">Confidence</span>
                    <span className="text-[10px] font-mono font-bold text-accent">{res.score}%</span>
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