'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchMarketData } from '@/app/actions/fetchMarketData';

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
  const [price, setPrice] = useState<string | null>(null);
  const [change, setChange] = useState<string | null>(null);
  const [isPositive, setIsPositive] = useState(true);
  const [history, setHistory] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketState, setMarketState] = useState('REGULAR');
  const [flash, setFlash] = useState(false);
  const prevPrice = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const idSafe = symbol.replace(/[^a-z0-9]/gi, '');

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMarketData(symbol);
        if (!mountedRef.current || !data) return;
        const newPrice = formatPrice(data.price, symbol, isCrypto ?? false);
        if (prevPrice.current && prevPrice.current !== newPrice) {
          setFlash(true);
          setTimeout(() => setFlash(false), 450);
        }
        prevPrice.current = newPrice;
        setPrice(newPrice);
        setChange(Math.abs(data.changePercent).toFixed(2) + '%');
        setIsPositive(data.changePercent >= 0);
        setHistory(data.history);
        setMarketState(data.marketState);
      } catch (e) {
        console.error('MiniChart error', e);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [symbol, isCrypto]);

  // SVG sparkline
  let pathD = '';
  let areaD = '';
  if (history.length > 1) {
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const pts = history.map((val, i) => {
      const x = (i / (history.length - 1)) * 100;
      const y = 36 - ((val - min) / range) * 30;
      return [x, y] as [number, number];
    });
    pathD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    areaD = pathD + ` L100,40 L0,40 Z`;
  } else {
    pathD = isPositive
      ? 'M0,36 L25,26 L50,30 L75,12 L100,5'
      : 'M0,5 L25,14 L50,10 L75,28 L100,36';
    areaD = pathD + ' L100,40 L0,40 Z';
  }

  const positiveColor = 'var(--color-positive)';
  const negativeColor = 'var(--color-negative)';
  const lineColor = isPositive ? positiveColor : negativeColor;
  const showPrefix = !NON_USD_SYMBOLS.has(symbol);
  const isAfterHours = marketState === 'POST' || marketState === 'PRE';

  return (
    <div
      className="glass-card glass-interactive flex flex-col relative"
      style={{ height: 140, padding: '14px 16px 10px' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between z-10 relative">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={isPositive ? 'dot-positive' : 'dot-negative'} />
            <span className="section-header truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {title}
            </span>
          </div>
          {loading ? (
            <div
              style={{
                height: 22, width: 80,
                borderRadius: 6,
                background: 'rgba(255,255,255,0.06)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ) : price ? (
            <span
              className={flash ? 'price-flash' : ''}
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                letterSpacing: '-0.025em',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: 1.2,
              }}
            >
              {showPrefix ? '$' : ''}{price}
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.30)' }}>N/A</span>
          )}
        </div>

        {/* Change badge */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          {loading ? (
            <Loader2 size={14} className="animate-spin" style={{ color: 'rgba(255,255,255,0.25)' }} />
          ) : change ? (
            <>
              <span className={isPositive ? 'chip-positive' : 'chip-negative'}>
                {isPositive ? '+' : '−'}{change}
              </span>
              {isAfterHours && (
                <span className="section-header" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.5625rem' }}>
                  {marketState === 'POST' ? 'AH' : 'Pre'}
                </span>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Sparkline */}
      <div className="flex-1 relative mt-2" style={{ minHeight: 38 }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          preserveAspectRatio="none"
          viewBox="0 0 100 40"
        >
          <defs>
            <linearGradient id={`area-${idSafe}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.20" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
            <filter id={`glow-${idSafe}`}>
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Area fill */}
          <path d={areaD} fill={`url(#area-${idSafe})`} />
          {/* Line with glow */}
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            filter={`url(#glow-${idSafe})`}
          />
          {/* End dot */}
          {history.length > 1 && (() => {
            const lastPt = history.length - 1;
            const min = Math.min(...history);
            const max = Math.max(...history);
            const range = max - min || 1;
            const ex = 100;
            const ey = 36 - ((history[lastPt] - min) / range) * 30;
            return (
              <circle
                cx={ex}
                cy={ey}
                r="2.5"
                fill={lineColor}
                vectorEffect="non-scaling-stroke"
                style={{ filter: `drop-shadow(0 0 3px ${lineColor})` }}
              />
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
