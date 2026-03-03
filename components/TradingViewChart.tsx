'use client';

import React, { useEffect, useRef } from 'react';
import { useSettings } from '@/context/SettingsContext';

interface TradingViewChartProps {
  symbol: string;
  interval?: string;
  style?: string;
}

export default function TradingViewChart({ symbol, interval = "15", style = "1" }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    
    // In Terminal mode, force Amber/Orange overrides
    const terminalOverrides = settings.uiTheme === 'terminal' ? {
      "mainSeriesProperties.barStyle.upColor": "#FFB000",
      "mainSeriesProperties.barStyle.downColor": "#CC8800",
      "paneProperties.background": "#000000",
      "paneProperties.vertGridProperties.color": "#222222",
      "paneProperties.horzGridProperties.color": "#222222",
      "scalesProperties.textColor": "#FFB000"
    } : {};

    const config = {
      "autosize": true,
      "symbol": symbol,
      "interval": interval,
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": style, // 0 = Bars, 1 = Candles
      "locale": "en",
      "backgroundColor": settings.uiTheme === 'terminal' ? "#000000" : "rgba(0,0,0,0)",
      "gridColor": settings.uiTheme === 'terminal' ? "#222222" : "rgba(255, 255, 255, 0.05)",
      "hide_side_toolbar": true,
      "allow_symbol_change": false,
      "save_image": false,
      "details": false,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "overrides": terminalOverrides
    };

    script.innerHTML = JSON.stringify(config);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [symbol, interval, style, settings.uiTheme]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}