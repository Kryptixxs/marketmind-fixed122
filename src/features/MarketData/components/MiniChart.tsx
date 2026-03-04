'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  const [flash, setFlash] = useState(false);
  const prevPrice = useRef<number | null>(null);
  const idSafe = symbol.replace(/[^a-z0-9]/gi, '');

  useEffect(() => {
    if (tick && prevPrice.current !== null && prevPrice.current !== tick.price) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(timer);
    }
    if (tick) {
      prevPrice.current = tick.price;
    }
  }, [tick?.price]);

  const loading = !tick;
  const priceStr = tick ? formatPrice(tick.price, symbol, isCrypto ?? false) : null;
  const isPositive = tick ? tick.changePercent >= 0 : true;
  const changeStr = tick ? Math.abs(tick.changePercent).toFixed(2) + '%' : null;
  
  // Extract closing prices from the new OHLCV format for the sparkline
  const history = tick?.history?.map(h => h.close).slice(-20) || [];
  const marketState = tick?.marketState || 'REGULAR';

  let points = '';
  let areaPoints = '';
  
  if (history.length > 1) {
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    
    points = history.map((val, i) => {
      const x = (i / (history.length - 1)) * 100;
      const normalizedVal = (val - min) / range;
      const y = 35 - (normalizedVal * 30);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    
    areaPoints = `0,40 ${points} 100,40`;
  }

  const positiveColor = 'var(--color-positive)';
  const negativeColor = 'var(--color-negative)';
  const lineColor = isPositive ? positiveColor : negativeColor;
  const showPrefix = !NON_USD_SYMBOLS.has(symbol);
  const isAfterHours = marketState === 'POST' || marketState === 'PRE';

  return (
    <div className="glass-card glass-interactive flex flex-col relative h-full w-full p-3 overflow-hidden">
      <div className="flex justify-between items-start z-10 relative mb-1">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", isPositive ? "bg-positive shadow-[0_0_6px_rgba(48,209,88,0.7)]" : "bg-negative shadow-[0_0_6px_rgba(255,69,58,0.7)]")} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary truncate">
              {title}
            </span>
          </div>
          {loading ? (
            <div className="h-5 w-20 rounded bg-surface animate-pulse mt-0.5" />
          ) : (
            <span className={cn(
              "text-sm font-mono font-bold text-text-primary transition-opacity duration-300",
              flash && "opacity-50"
            )}>
              {showPrefix && '$'}{priceStr || 'N/A'}
            </span>
          )}
        </div>

        <div className="flex flex-col items-end shrink-0 ml-2">
          {loading ? (
            <div className="h-4 w-12 rounded-full bg-surface animate-pulse" />
          ) : changeStr ? (
            <div className="flex flex-col items-end">
               <span className={cn(
                 "text-[10px] font-bold px-1.5 py-0.5 rounded-full border",
                 isPositive
                   ? "bg-positive/10 text-positive border-positive/20"
                   : "bg-negative/10 text-negative border-negative/20"
               )}>
                 {isPositive ? '+' : '-'}{changeStr}
               </span>
               {isAfterHours && (
                 <span className="text-[9px] text-text-tertiary mt-0.5">{marketState === 'POST' ? 'AH' : 'Pre'}</span>
               )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-[60%] opacity-80 pointer-events-none">
         {points && (
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`grad-${idSafe}`} x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
                   <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill={`url(#grad-${idSafe})`} />
              <polyline
                 points={points}
                 fill="none"
                 stroke={lineColor}
                 strokeWidth="1.5"
                 vectorEffect="non-scaling-stroke"
                 strokeLinecap="round"
                 strokeLinejoin="round"
              />
            </svg>
         )}
      </div>
    </div>
  );
}