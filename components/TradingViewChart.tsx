'use client';

import React, { useEffect, useRef } from 'react';

export default function TradingViewChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    
    // Configuration for the Pepperstone Advanced Chart
    const config = {
      "autosize": true,
      "symbol": symbol,
      "interval": "5",
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "backgroundColor": "#000000",
      "gridColor": "rgba(242, 242, 242, 0.06)",
      "hide_side_toolbar": true,
      "allow_symbol_change": true,
      "save_image": true,
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
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}