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
    
    // Strict institutional overrides
    const overrides = settings.uiTheme === 'terminal' ? {
      "mainSeriesProperties.barStyle.upColor": "#00FF41", // Green
      "mainSeriesProperties.barStyle.downColor": "#FF003C", // Red
      "paneProperties.background": "#000000",
      "paneProperties.vertGridProperties.color": "#111111",
      "paneProperties.horzGridProperties.color": "#111111",
      "scalesProperties.textColor": "#666666"
    } : {
      "paneProperties.background": "#0C0D0F",
      "paneProperties.vertGridProperties.color": "#1A1C1F",
      "paneProperties.horzGridProperties.color": "#1A1C1F",
    };

    const config = {
      "autosize": true,
      "symbol": symbol,
      "interval": interval,
      "timezone": "Etc/UTC",
      "theme": "dark",
      "style": style, // 0 = Bars (Terminal), 1 = Candles (Architect)
      "locale": "en",
      "backgroundColor": settings.uiTheme === 'terminal' ? "#000000" : "#0C0D0F",
      "gridColor": settings.uiTheme === 'terminal' ? "#111111" : "#1A1C1F",
      "hide_side_toolbar": true,
      "allow_symbol_change": false,
      "save_image": false,
      "details": false,
      "calendar": false,
      "support_host": "https://www.tradingview.com",
      "overrides": overrides
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