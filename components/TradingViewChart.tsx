'use client';

import React, { useEffect, useRef, useState } from 'react';
import { resolveTradingViewSymbol } from '@/lib/instruments';
import { AlertCircle } from 'lucide-react';

interface TradingViewChartProps {
  instrumentId: string;
  interval?: string;
}

export default function TradingViewChart({ instrumentId, interval = "5" }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const tvSymbol = resolveTradingViewSymbol(instrumentId);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!tvSymbol) {
      setError("Advanced feed unavailable for this instrument");
      return;
    }

    setError(null);
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    
    const config = {
      "autosize": true,
      "symbol": tvSymbol,
      "interval": interval,
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "backgroundColor": "#000000",
      "gridColor": "rgba(242, 242, 242, 0.06)",
      "hide_side_toolbar": true,
      "allow_symbol_change": false,
      "save_image": false,
      "details": false,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    };

    script.innerHTML = JSON.stringify(config);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [tvSymbol, interval]);

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black gap-3 p-4 text-center">
        <AlertCircle size={24} className="text-warning opacity-50" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-text-primary uppercase tracking-widest">{error}</p>
          <p className="text-[10px] text-text-tertiary">Switch to Standard view for native OHLC data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}