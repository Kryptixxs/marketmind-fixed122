'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import {
  Filter, ArrowUpDown, ArrowUpRight, ArrowDownRight, Loader2,
  TrendingUp, Search, BarChart3, Zap,
} from 'lucide-react';

const SCREENER_UNIVERSE = [
  'AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'NFLX', 'DIS',
  'PYPL', 'INTC', 'UBER', 'CRM', 'ORCL', 'ADBE', 'CSCO', 'QCOM', 'AVGO', 'TXN',
  'NAS100', 'SPX500', 'US30', 'RUSSELL',
  'GOLD', 'SILVER', 'CRUDE', 'NATGAS', 'COPPER',
  'BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD',
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD',
];

const LABELS: Record<string, string> = {
  AAPL: 'Apple Inc.', NVDA: 'NVIDIA Corp.', MSFT: 'Microsoft Corp.', TSLA: 'Tesla Inc.',
  GOOGL: 'Alphabet Inc.', AMZN: 'Amazon.com', META: 'Meta Platforms', AMD: 'Advanced Micro',
  NFLX: 'Netflix Inc.', DIS: 'Walt Disney', PYPL: 'PayPal Holdings', INTC: 'Intel Corp.',
  UBER: 'Uber Technologies', CRM: 'Salesforce Inc.', ORCL: 'Oracle Corp.', ADBE: 'Adobe Inc.',
  CSCO: 'Cisco Systems', QCOM: 'Qualcomm Inc.', AVGO: 'Broadcom Inc.', TXN: 'Texas Instruments',
  NAS100: 'Nasdaq 100', SPX500: 'S&P 500', US30: 'Dow Jones', RUSSELL: 'Russell 2000',
  GOLD: 'Gold', SILVER: 'Silver', CRUDE: 'Crude Oil', NATGAS: 'Natural Gas', COPPER: 'Copper',
  BTCUSD: 'Bitcoin', ETHUSD: 'Ethereum', SOLUSD: 'Solana', BNBUSD: 'BNB', XRPUSD: 'XRP', ADAUSD: 'Cardano',
  EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', USDJPY: 'USD/JPY', AUDUSD: 'AUD/USD', USDCAD: 'USD/CAD',
};

const ASSET_CLASS: Record<string, string> = {};
['AAPL','NVDA','MSFT','TSLA','GOOGL','AMZN','META','AMD','NFLX','DIS','PYPL','INTC','UBER','CRM','ORCL','ADBE','CSCO','QCOM','AVGO','TXN'].forEach(s => ASSET_CLASS[s] = 'Equity');
['NAS100','SPX500','US30','RUSSELL'].forEach(s => ASSET_CLASS[s] = 'Index');
['GOLD','SILVER','CRUDE','NATGAS','COPPER'].forEach(s => ASSET_CLASS[s] = 'Commodity');
['BTCUSD','ETHUSD','SOLUSD','BNBUSD','XRPUSD','ADAUSD'].forEach(s => ASSET_CLASS[s] = 'Crypto');
['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD'].forEach(s => ASSET_CLASS[s] = 'Forex');

type SortField = 'symbol' | 'price' | 'change' | 'absChange';
type SortDir = 'asc' | 'desc';

const PRESETS = [
  { label: 'All', filter: () => true },
  { label: 'Top Gainers', filter: (pct: number) => pct > 0, sort: 'change' as SortField, dir: 'desc' as SortDir },
  { label: 'Top Losers', filter: (pct: number) => pct < 0, sort: 'change' as SortField, dir: 'asc' as SortDir },
  { label: 'Most Volatile', filter: () => true, sort: 'absChange' as SortField, dir: 'desc' as SortDir },
  { label: 'Equities', filter: (_: number, sym: string) => ASSET_CLASS[sym] === 'Equity' },
  { label: 'Crypto', filter: (_: number, sym: string) => ASSET_CLASS[sym] === 'Crypto' },
  { label: 'Commodities', filter: (_: number, sym: string) => ASSET_CLASS[sym] === 'Commodity' },
  { label: 'Forex', filter: (_: number, sym: string) => ASSET_CLASS[sym] === 'Forex' },
];

export default function ScreenerPage() {
  const { data: marketData } = useMarketData(SCREENER_UNIVERSE);
  const [search, setSearch] = useState('');
  const [activePreset, setActivePreset] = useState('All');
  const [sortField, setSortField] = useState<SortField>('absChange');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const loaded = Object.keys(marketData).length > 0;

  const preset = PRESETS.find(p => p.label === activePreset) || PRESETS[0];

  const results = useMemo(() => {
    let items = SCREENER_UNIVERSE
      .filter(sym => {
        const tick = marketData[sym];
        if (!tick) return false;
        const pct = tick.changePercent ?? 0;
        if (search && !sym.toLowerCase().includes(search.toLowerCase()) && !(LABELS[sym] || '').toLowerCase().includes(search.toLowerCase())) return false;
        return preset.filter(pct, sym);
      });

    const sf = preset.sort || sortField;
    const sd = preset.dir || sortDir;

    items.sort((a, b) => {
      const ta = marketData[a];
      const tb = marketData[b];
      if (!ta || !tb) return 0;
      let va = 0, vb = 0;
      if (sf === 'symbol') { return sd === 'asc' ? a.localeCompare(b) : b.localeCompare(a); }
      if (sf === 'price') { va = ta.price; vb = tb.price; }
      if (sf === 'change') { va = ta.changePercent; vb = tb.changePercent; }
      if (sf === 'absChange') { va = Math.abs(ta.changePercent); vb = Math.abs(tb.changePercent); }
      return sd === 'asc' ? va - vb : vb - va;
    });

    return items;
  }, [marketData, search, activePreset, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleSymbolClick = (sym: string) => {
    window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
    window.location.href = '/charts';
  };

  const stats = useMemo(() => {
    const ticks = SCREENER_UNIVERSE.map(s => marketData[s]).filter(Boolean);
    const gainers = ticks.filter(t => t!.changePercent > 0).length;
    const losers = ticks.filter(t => t!.changePercent < 0).length;
    const avgChange = ticks.length > 0 ? ticks.reduce((s, t) => s + t!.changePercent, 0) / ticks.length : 0;
    return { total: ticks.length, gainers, losers, avgChange };
  }, [marketData]);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-surface p-3 shrink-0 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Market Screener</span>
          </div>

          <div className="h-5 w-px bg-border hidden md:block" />

          {/* Quick Stats */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-text-tertiary font-bold uppercase">Loaded:</span>
              <span className="text-[10px] font-mono font-bold text-text-primary">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight size={10} className="text-positive" />
              <span className="text-[10px] font-mono font-bold text-positive">{stats.gainers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowDownRight size={10} className="text-negative" />
              <span className="text-[10px] font-mono font-bold text-negative">{stats.losers}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 size={10} className="text-text-tertiary" />
              <span className={`text-[10px] font-mono font-bold ${stats.avgChange >= 0 ? 'text-positive' : 'text-negative'}`}>
                Avg: {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center gap-2 bg-background border border-border rounded px-2 py-1 focus-within:border-accent/40 transition-colors">
            <Search size={12} className="text-text-tertiary" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter symbols..."
              className="bg-transparent border-none outline-none text-[10px] font-mono text-text-primary uppercase w-28 md:w-40 placeholder:text-text-tertiary"
            />
          </div>
        </div>

        {/* Preset Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => setActivePreset(p.label)}
              className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-colors ${
                activePreset === p.label
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-tertiary hover:text-text-secondary border border-transparent hover:border-border'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {!loaded ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 size={24} className="animate-spin text-accent" />
            <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">Loading Market Data...</span>
          </div>
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="cursor-pointer hover:text-text-secondary w-8" onClick={() => handleSort('symbol')}>#</th>
                <th className="cursor-pointer hover:text-text-secondary" onClick={() => handleSort('symbol')}>
                  <span className="flex items-center gap-1">Symbol <ArrowUpDown size={9} /></span>
                </th>
                <th>Name</th>
                <th>Class</th>
                <th className="text-right cursor-pointer hover:text-text-secondary" onClick={() => handleSort('price')}>
                  <span className="flex items-center gap-1 justify-end">Price <ArrowUpDown size={9} /></span>
                </th>
                <th className="text-right cursor-pointer hover:text-text-secondary" onClick={() => handleSort('change')}>
                  <span className="flex items-center gap-1 justify-end">Change <ArrowUpDown size={9} /></span>
                </th>
                <th className="text-right">Direction</th>
                <th className="text-center cursor-pointer hover:text-text-secondary" onClick={() => handleSort('absChange')}>
                  <span className="flex items-center gap-1 justify-center">Volatility <ArrowUpDown size={9} /></span>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((sym, idx) => {
                const tick = marketData[sym];
                if (!tick) return null;
                const isPos = tick.changePercent >= 0;
                const absChg = Math.abs(tick.changePercent);
                const volBar = Math.min(absChg / 5, 1);
                return (
                  <tr key={sym} onClick={() => handleSymbolClick(sym)} className="cursor-pointer">
                    <td className="text-text-muted text-center">{idx + 1}</td>
                    <td>
                      <span className="font-bold text-text-primary">{sym}</span>
                    </td>
                    <td className="text-text-tertiary">{LABELS[sym] || sym}</td>
                    <td>
                      <span className="badge badge-accent">{ASSET_CLASS[sym] || 'Other'}</span>
                    </td>
                    <td className="text-right font-mono font-bold text-text-primary">
                      {tick.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="text-right">
                      <span className={`font-mono font-bold ${isPos ? 'text-positive' : 'text-negative'}`}>
                        {isPos ? '+' : ''}{tick.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`inline-flex items-center gap-0.5 ${isPos ? 'text-positive' : 'text-negative'}`}>
                        {isPos ? <TrendingUp size={11} /> : <ArrowDownRight size={11} />}
                        <span className="text-[9px] font-bold uppercase">{isPos ? 'BULL' : 'BEAR'}</span>
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-16 h-1.5 bg-surface-highlight rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isPos ? 'bg-positive' : 'bg-negative'}`}
                            style={{ width: `${volBar * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-text-tertiary w-8 text-right">
                          {absChg.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
