'use client';

import { cn } from '@/lib/utils';
import { TerminalChart } from '@/components/charts/TerminalChart';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';

const NON_USD_SYMBOLS = new Set([
  'EURUSD=X', 'GBPUSD=X', 'JPY=X', 'AUDUSD=X', 'CAD=X', 'CHF=X', 'DX-Y.NYB',
]);

function formatPrice(price: number, symbol: string, isCrypto: boolean): string {
  if (NON_USD_SYMBOLS.has(symbol)) return price.toFixed(4);
  if (isCrypto) {
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
  }
  if (price < 10) return price.toFixed(4);
  if (price < 1000) return price.toFixed(2);
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function normalize(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

export function MiniChart({
  title,
  symbol,
  isCrypto,
}: {
  title: string;
  symbol: string;
  isCrypto?: boolean;
}) {
  const { data } = useMarketData([symbol]);
  const tick = data[symbol];
  const history = tick?.history?.map((h) => h.close).slice(-28) ?? [];
  const series = normalize(history);
  const marketState = tick?.marketState || 'REGULAR';
  const priceStr = tick ? formatPrice(tick.price, symbol, isCrypto ?? false) : '...';
  const pct = tick ? `${tick.changePercent >= 0 ? '+' : ''}${tick.changePercent.toFixed(2)}%` : '--';
  const positive = (tick?.changePercent ?? 0) >= 0;

  return (
    <div className="flex flex-col relative h-full w-full min-w-0 min-h-0 border border-[#111] bg-black p-[2px]">
      <div className="h-[14px] px-[2px] border-b border-[#111] text-[8px] flex items-center justify-between font-mono tracking-tight uppercase">
        <span className="text-[#9bc3e8] font-bold truncate">{title}</span>
        <span className={cn('font-bold', positive ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]')}>{pct}</span>
      </div>
      <div className="h-[12px] px-[2px] border-b border-[#111] text-[7px] flex items-center justify-between font-mono tracking-tight">
        <span className="text-[#8ea4bf]">{marketState}</span>
        <span className="text-[#d8e6f8]">{NON_USD_SYMBOLS.has(symbol) ? '' : '$'}{priceStr}</span>
      </div>
      <div className="flex-1 min-h-0 w-full min-w-0 relative">
        <TerminalChart
          type="area"
          series={series}
          secondary={series.map((v, i) => (series[i - 1] ?? v))}
          labels={tick?.history?.map((h) => new Date(h.timestamp).toISOString().slice(11, 16)).slice(-28)}
          metricLabel={symbol}
          metricValue={pct}
        />
      </div>
    </div>
  );
}
