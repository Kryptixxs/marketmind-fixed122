'use client';

import React, { useEffect, useRef } from 'react';

let tvScriptLoadingPromise: Promise<void> | null = null;

export default function TradingViewChart({ symbol }: { symbol: string }) {
  const onLoadScriptRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onLoadScriptRef.current = createWidget;

    if (!tvScriptLoadingPromise) {
      tvScriptLoadingPromise = new Promise((resolve) => {
        const script = document.createElement('script');
        script.id = 'tradingview-widget-loading-script';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.type = 'text/javascript';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    }

    tvScriptLoadingPromise.then(() => onLoadScriptRef.current && onLoadScriptRef.current());

    return () => {
      onLoadScriptRef.current = null;
    };

    function createWidget() {
      if (document.getElementById('tradingview_widget') && 'TradingView' in window) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: '5',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#000000',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: 'tradingview_widget',
          backgroundColor: '#000000',
          gridColor: 'rgba(42, 46, 57, 0.06)',
          studies: [
            'RSI@tv-basicstudies',
            'MASimple@tv-basicstudies'
          ],
        });
      }
    }
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full w-full">
      <div id="tradingview_widget" className="h-full w-full" />
    </div>
  );
}