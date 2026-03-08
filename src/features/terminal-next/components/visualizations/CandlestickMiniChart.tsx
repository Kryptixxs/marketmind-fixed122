'use client';

import React, { memo, useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi, type CandlestickData } from 'lightweight-charts';
import { useTerminalStore } from '../../store/TerminalStore';
import type { IntradayBar } from '../../types';

function barsToCandleData(bars: IntradayBar[]): CandlestickData[] {
  return bars.slice(-32).map((b) => ({
    time: Math.floor(b.ts / 1000) as unknown as CandlestickData['time'],
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
  }));
}

export interface CandlestickMiniChartProps {
  symbol?: string;
  className?: string;
  height?: number;
}

export const CandlestickMiniChart = memo(function CandlestickMiniChart({
  symbol: symbolProp,
  className = '',
  height = 48,
}: CandlestickMiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { state } = useTerminalStore();
  const activeSymbol = symbolProp ?? state.activeSymbol;

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#5a6b7a',
        fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
        fontSize: 8,
      },
      grid: {
        vertLines: { color: '#0d0d0d' },
        horzLines: { color: '#0d0d0d' },
      },
      width: containerRef.current.clientWidth,
      height,
      rightPriceScale: {
        borderColor: '#1a1a1a',
        scaleMargins: { top: 0.1, bottom: 0.1 },
        visible: false,
      },
      timeScale: {
        borderColor: '#1a1a1a',
        visible: false,
      },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF00',
      downColor: '#FF0000',
      borderUpColor: '#00FF00',
      borderDownColor: '#FF0000',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    const bars = state.barsBySymbol[activeSymbol] ?? [];
    const data = barsToCandleData(bars);
    if (seriesRef.current && data.length) {
      seriesRef.current.setData(data);
    }
  }, [activeSymbol, state.barsBySymbol]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = chartRef.current;
    const onResize = () => {
      if (chart && el) chart.applyOptions({ width: el.clientWidth });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`min-w-0 min-h-0 overflow-hidden bg-[#000000] border border-[#1a1a1a] ${className}`}>
      <div ref={containerRef} style={{ height }} />
    </div>
  );
});
