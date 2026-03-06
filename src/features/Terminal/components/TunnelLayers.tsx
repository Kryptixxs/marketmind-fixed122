'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BarChart3, FileText, Newspaper, Loader2 } from 'lucide-react';
import { useTunnel } from '../context/TunnelContext';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { fetchMarketData } from '@/app/actions/fetchMarketData';
import { NewsFeed } from '@/features/News/components/NewsFeed';

const LABELS: Record<string, string> = {
  AAPL: 'Apple', NVDA: 'NVIDIA', MSFT: 'Microsoft', TSLA: 'Tesla', GOOGL: 'Alphabet', AMZN: 'Amazon', META: 'Meta', AMD: 'AMD',
  NAS100: 'Nasdaq 100', SPX500: 'S&P 500', US30: 'Dow Jones', GOLD: 'Gold', CRUDE: 'Crude Oil', BTCUSD: 'Bitcoin', EURUSD: 'EUR/USD',
};

function fmtPrice(sym: string, v: number) {
  if (sym.length === 6 && sym.includes('USD')) return v.toFixed(4);
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function SymbolLayer({ symbol }: { symbol: string }) {
  const { push } = useTunnel();
  const { data } = useMarketData([symbol]);
  const [candles, setCandles] = useState<Array<{ time: number; open: number; high: number; low: number; close: number }>>([]);

  const tick = data[symbol];

  useEffect(() => {
    fetchMarketData(symbol, '15m').then((r) => {
      if (r?.history?.length) {
        setCandles(r.history.map((h) => ({
          time: Math.floor(h.timestamp / 1000),
          open: h.open,
          high: h.high,
          low: h.low,
          close: h.close,
        })));
      }
    });
  }, [symbol]);

  const chartData = useMemo(() => {
    if (!candles.length) return [];
    const mapped = [...candles];
    if (tick?.price && mapped.length) {
      const last = mapped[mapped.length - 1];
      last.high = Math.max(last.high, tick.price);
      last.low = Math.min(last.low, tick.price);
      last.close = tick.price;
    }
    return mapped;
  }, [candles, tick?.price]);

  const drillTargets = [
    { label: 'Options', type: 'OPTIONS' as const, icon: BarChart3 },
    { label: 'News', type: 'NEWS' as const, icon: Newspaper },
    { label: 'Financials', type: 'TOOLS' as const, icon: FileText, tool: 'financials' },
  ];

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-text-primary">{symbol}</h2>
          <p className="text-[10px] text-text-tertiary">{LABELS[symbol] || symbol}</p>
        </div>
        {tick && (
          <div className="text-right">
            <div className="text-xl font-mono font-bold text-text-primary">{fmtPrice(symbol, tick.price)}</div>
            <div className={`text-sm font-mono font-bold ${tick.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
              {tick.changePercent >= 0 ? '+' : ''}{tick.changePercent.toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {drillTargets.map((d) => (
          <button
            key={d.label}
            onClick={() => push({ type: d.type, symbol, label: `${symbol} ${d.label}`, ...(d.tool && { tool: d.tool }) })}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded hover:border-accent/50 hover:bg-accent/5 transition-colors text-[11px] font-bold"
          >
            <d.icon size={14} />
            {d.label}
            <ArrowRight size={12} className="opacity-50" />
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-[300px] border border-border rounded bg-background">
        {chartData.length ? (
          <TradingChart data={chartData} symbol={symbol} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        )}
      </div>
    </div>
  );
}

export function OptionsLayer({ symbol }: { symbol: string }) {
  const { data } = useMarketData([symbol]);
  const tick = data[symbol];
  const price = tick?.price ?? 100;
  const strikes = useMemo(() => {
    const step = price < 50 ? 2.5 : 5;
    const base = Math.floor(price / step) * step;
    return Array.from({ length: 9 }, (_, i) => base - step * 4 + step * i);
  }, [price]);

  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-black text-text-primary mb-4">{symbol} — Options Chain</h2>
      <div className="flex-1 overflow-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Strike</th>
              <th className="text-right">Call Bid</th>
              <th className="text-right">Call Ask</th>
              <th className="text-right">Put Bid</th>
              <th className="text-right">Put Ask</th>
            </tr>
          </thead>
          <tbody>
            {strikes.map((s) => {
              const itm = price > s;
              const callVal = itm ? price - s : 0.5 + Math.random() * 2;
              const putVal = !itm ? s - price : 0.5 + Math.random() * 2;
              return (
                <tr key={s}>
                  <td className="font-mono font-bold">{s}</td>
                  <td className="text-right font-mono text-positive">{callVal.toFixed(2)}</td>
                  <td className="text-right font-mono text-positive">{(callVal + 0.05).toFixed(2)}</td>
                  <td className="text-right font-mono text-negative">{putVal.toFixed(2)}</td>
                  <td className="text-right font-mono text-negative">{(putVal + 0.05).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NewsLayer({ symbol }: { symbol?: string }) {
  const { push } = useTunnel();
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-black text-text-primary mb-4">{symbol ? `News — ${symbol}` : 'Intelligence Wire'}</h2>
      <div className="flex-1 min-h-0 overflow-hidden">
        <NewsFeed
          activeSymbol={symbol}
          onSelectArticle={(item) =>
            push({
              type: 'ARTICLE',
              id: item.id || `${item.source}-${item.time}-${item.title.slice(0, 8)}`,
              title: item.title,
              label: item.title,
              source: item.source,
              time: item.time,
              snippet: item.contentSnippet,
              link: item.link,
            })
          }
        />
      </div>
    </div>
  );
}

export function FinancialsLayer({ symbol }: { symbol: string }) {
  const metrics = [
    { label: 'Revenue (TTM)', value: '—', unit: 'B' },
    { label: 'Net Income', value: '—', unit: 'B' },
    { label: 'P/E', value: '—', unit: '' },
    { label: 'Market Cap', value: '—', unit: 'B' },
    { label: 'EPS', value: '—', unit: '' },
    { label: 'Dividend Yield', value: '—', unit: '%' },
  ];
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-black text-text-primary mb-4">{symbol} — Financials</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-surface border border-border rounded p-3">
            <div className="text-[9px] text-text-tertiary uppercase mb-1">{m.label}</div>
            <div className="text-sm font-mono font-bold text-text-primary">{m.value}{m.unit}</div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-text-tertiary mt-4">Prototype — connect to fundamentals API for live data</p>
    </div>
  );
}

export function ArticleLayer({
  title,
  source,
  time,
  snippet,
  link,
}: {
  title: string;
  source?: string;
  time?: string;
  snippet?: string;
  link?: string;
}) {
  return (
    <div className="h-full flex flex-col p-4">
      <div className="mb-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-text-tertiary">
          <span className="badge badge-accent">{source || 'Wire'}</span>
          {time && <span>{time}</span>}
        </div>
        <h2 className="mt-2 text-lg font-black text-text-primary leading-tight">{title}</h2>
      </div>
      <div className="bg-surface border border-border rounded p-3 text-sm text-text-secondary leading-relaxed">
        {snippet || 'No summary available for this item.'}
      </div>
      {link && link !== '#' && (
        <a
          href={link}
          target="_blank"
          className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-accent hover:underline"
        >
          Open full article
        </a>
      )}
    </div>
  );
}

export function EventLayer({ label, detail, impact }: { label: string; detail?: string; impact?: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-black text-text-primary mb-3">{label}</h2>
      <div className="bg-surface border border-border rounded p-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary">Event Detail</div>
        <div className="text-sm text-text-secondary">{detail || 'No additional detail available.'}</div>
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
          Impact: <span className="text-warning font-bold">{impact || 'MEDIUM'}</span>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailLayer({
  symbol,
  side,
  qty,
  price,
}: {
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
}) {
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-black text-text-primary mb-3">{symbol} — Order Detail</h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface border border-border rounded p-3">
          <div className="text-[9px] text-text-tertiary uppercase">Side</div>
          <div className={side === 'BUY' ? 'text-positive font-bold' : 'text-negative font-bold'}>{side}</div>
        </div>
        <div className="bg-surface border border-border rounded p-3">
          <div className="text-[9px] text-text-tertiary uppercase">Quantity</div>
          <div className="font-mono font-bold text-text-primary">{qty}</div>
        </div>
        <div className="bg-surface border border-border rounded p-3">
          <div className="text-[9px] text-text-tertiary uppercase">Price</div>
          <div className="font-mono font-bold text-text-primary">{price.toFixed(4)}</div>
        </div>
        <div className="bg-surface border border-border rounded p-3">
          <div className="text-[9px] text-text-tertiary uppercase">Status</div>
          <div className="font-bold text-cyan">Simulated Filled</div>
        </div>
      </div>
    </div>
  );
}

export function TapeDetailLayer({
  symbol,
  side,
  qty,
  price,
  time,
}: {
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
  time: string;
}) {
  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-lg font-black text-text-primary mb-3">{symbol} — Print Detail</h2>
      <div className="bg-surface border border-border rounded p-3 grid grid-cols-2 gap-2 text-sm">
        <div className="text-text-tertiary">Time</div>
        <div className="font-mono text-text-primary">{time}</div>
        <div className="text-text-tertiary">Price</div>
        <div className="font-mono text-text-primary">{price.toFixed(4)}</div>
        <div className="text-text-tertiary">Size</div>
        <div className="font-mono text-text-primary">{qty}</div>
        <div className="text-text-tertiary">Side</div>
        <div className={side === 'BUY' ? 'font-bold text-positive' : 'font-bold text-negative'}>{side}</div>
      </div>
    </div>
  );
}
