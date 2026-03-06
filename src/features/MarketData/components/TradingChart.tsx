'use client';

import { useEffect, useRef } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { ColorType, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts';

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function TradingChart({
  data,
  symbol = ''
}: {
  data: ChartData[];
  symbol?: string;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastDataRef = useRef<ChartData[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#060a13' },
        textColor: '#475569',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      },
      localization: {
        locale: navigator.language,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: '#334155', style: 3, labelBackgroundColor: '#131c2e' },
        horzLine: { width: 1, color: '#334155', style: 3, labelBackgroundColor: '#131c2e' },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        autoScale: true,
        alignLabels: true,
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 10,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: 'transparent',
      borderUpColor: '#10b981',
      wickUpColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      wickDownColor: '#ef4444',
      borderVisible: true,
      wickVisible: true,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    return () => {
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return;

    const sorted = [...data].sort((a, b) => a.time - b.time);
    const unique: ChartData[] = [];
    for (const d of sorted) {
      if (unique.length === 0 || d.time > unique[unique.length - 1].time) {
        unique.push(d);
      }
    }

    if (unique.length === 0) return;

    const lastUnique = unique[unique.length - 1];
    const prevUnique = lastDataRef.current[lastDataRef.current.length - 1];

    if (prevUnique && lastUnique.time >= prevUnique.time && unique.length === lastDataRef.current.length) {
      seriesRef.current.update(lastUnique);
    } else {
      seriesRef.current.setData(unique);
    }

    lastDataRef.current = unique;
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}
