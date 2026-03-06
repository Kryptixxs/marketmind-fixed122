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
        textColor: '#888888',
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: '#444444', style: 3, labelBackgroundColor: '#121212' },
        horzLine: { width: 1, color: '#444444', style: 3, labelBackgroundColor: '#121212' },
      },
      rightPriceScale: { 
        borderColor: '#1a1a1a',
        autoScale: true,
        alignLabels: true,
      },
      timeScale: { 
        borderColor: '#1a1a1a', 
        timeVisible: true, 
        secondsVisible: false,
        barSpacing: 10,
      },
    });

    // --- HOLO CANDLE STYLING ---
    const candlestickSeries = chart.addCandlestickSeries({
      // Bullish (Up) - Hollow
      upColor: 'transparent', 
      borderUpColor: '#00ff9d',
      wickUpColor: '#00ff9d',
      
      // Bearish (Down) - Solid
      downColor: '#ff3333',
      borderDownColor: '#ff3333',
      wickDownColor: '#ff3333',
      
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