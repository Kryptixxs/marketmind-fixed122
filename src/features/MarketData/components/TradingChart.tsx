'use client';

import { useEffect, useRef } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { ColorType, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts';

export interface ChartOverlay {
  type: 'level' | 'box' | 'marker';
  price: number;
  price2?: number; // For boxes
  color: string;
  label: string;
  style?: number; // 0: Solid, 1: Dotted, 2: Dashed
}

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function TradingChart({ 
  data, 
  symbol = '',
  overlays = []
}: { 
  data: ChartData[]; 
  symbol?: string;
  overlays?: ChartOverlay[];
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a1a1aa',
      },
      grid: {
        vertLines: { color: 'rgba(39, 39, 42, 0.2)' },
        horzLines: { color: 'rgba(39, 39, 42, 0.2)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: '#52525b', style: 3, labelBackgroundColor: '#18181b' },
        horzLine: { width: 1, color: '#52525b', style: 3, labelBackgroundColor: '#18181b' },
      },
      rightPriceScale: { 
        borderColor: 'rgba(39, 39, 42, 0.8)',
      },
      timeScale: { 
        borderColor: 'rgba(39, 39, 42, 0.8)', 
        timeVisible: true, 
        secondsVisible: false 
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00ff9d',
      downColor: '#ff3333',
      borderVisible: false,
      wickUpColor: '#00ff9d',
      wickDownColor: '#ff3333',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    return () => {
      chart.remove();
    };
  }, []);

  // Update Data
  useEffect(() => {
    if (seriesRef.current && data && data.length > 0) {
      const sorted = [...data].sort((a, b) => a.time - b.time);
      const unique = [];
      for (const d of sorted) {
        if (unique.length === 0 || d.time > unique[unique.length - 1].time) {
          unique.push(d);
        }
      }
      seriesRef.current.setData(unique);
    }
  }, [data]);

  // Update Overlays (Institutional Levels)
  useEffect(() => {
    if (!seriesRef.current) return;

    // Clear old lines
    priceLinesRef.current.forEach(line => seriesRef.current?.removePriceLine(line));
    priceLinesRef.current = [];

    overlays.forEach(ov => {
      if (ov.type === 'level') {
        const line = seriesRef.current!.createPriceLine({
          price: ov.price,
          color: ov.color,
          lineWidth: 1,
          lineStyle: ov.style || 0,
          axisLabelVisible: true,
          title: ov.label,
        });
        priceLinesRef.current.push(line);
      }
    });
  }, [overlays]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}