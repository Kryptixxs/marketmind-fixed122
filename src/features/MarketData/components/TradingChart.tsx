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
        background: { type: ColorType.Solid, color: '#050505' },
        textColor: '#a1a1aa',
      },
      grid: {
        vertLines: { color: 'rgba(39, 39, 42, 0.1)' },
        horzLines: { color: 'rgba(39, 39, 42, 0.1)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: '#52525b', style: 3, labelBackgroundColor: '#18181b' },
        horzLine: { width: 1, color: '#52525b', style: 3, labelBackgroundColor: '#18181b' },
      },
      rightPriceScale: { 
        borderColor: 'rgba(39, 39, 42, 0.8)',
        autoScale: true,
      },
      timeScale: { 
        borderColor: 'rgba(39, 39, 42, 0.8)', 
        timeVisible: true, 
        secondsVisible: false 
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ffffff',
      downColor: '#ff3333',
      borderVisible: false,
      wickUpColor: '#ffffff',
      wickDownColor: '#ff3333',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    return () => {
      chart.remove();
    };
  }, []);

  // Optimized Data Update Logic
  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return;

    // Sort and unique check
    const sorted = [...data].sort((a, b) => a.time - b.time);
    const unique: ChartData[] = [];
    for (const d of sorted) {
      if (unique.length === 0 || d.time > unique[unique.length - 1].time) {
        unique.push(d);
      }
    }

    const lastUnique = unique[unique.length - 1];
    const prevUnique = lastDataRef.current[lastDataRef.current.length - 1];

    // If only the last candle changed (or a new one was added), use .update() for performance
    if (prevUnique && lastUnique.time >= prevUnique.time && unique.length === lastDataRef.current.length) {
      seriesRef.current.update(lastUnique);
    } else {
      // Full reload for symbol changes or large gaps
      seriesRef.current.setData(unique);
    }

    lastDataRef.current = unique;
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}