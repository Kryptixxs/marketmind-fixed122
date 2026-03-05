'use client';

import { useEffect, useRef } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { ColorType, CrosshairMode, IChartApi } from 'lightweight-charts';

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
}: { 
  data: ChartData[]; 
  symbol?: string;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // Use any to avoid type conflicts between v4 and v5 ISeriesApi definitions
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a1a1aa',
      },
      grid: {
        vertLines: { color: 'rgba(39, 39, 42, 0.4)' },
        horzLines: { color: 'rgba(39, 39, 42, 0.4)' },
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
      watermark: {
        visible: !!symbol,
        fontSize: 48,
        horzAlign: 'center',
        vertAlign: 'center',
        color: 'rgba(255, 255, 255, 0.04)',
        text: symbol,
      }
    });

    const seriesOptions = {
      upColor: '#00ff9d',
      downColor: '#ff3333',
      borderVisible: false,
      wickUpColor: '#00ff9d',
      wickDownColor: '#ff3333',
    };

    const candlestickSeries = chart.addCandlestickSeries(seriesOptions);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    return () => {
      chart.remove();
    };
  }, [symbol]);

  useEffect(() => {
    if (seriesRef.current && data && data.length > 0) {
      // Clean, sort, and deduplicate timestamps (canvas engine requires strictly ascending time)
      const sorted = [...data].sort((a, b) => a.time - b.time);
      const unique = [];
      for (const d of sorted) {
        if (unique.length === 0 || d.time > unique[unique.length - 1].time) {
          unique.push(d);
        } else if (d.time === unique[unique.length - 1].time) {
          unique[unique.length - 1] = d;
        }
      }
      
      try {
        seriesRef.current.setData(unique);
      } catch(e) {
        console.error("Chart rendering error", e);
      }
    }
  }, [data, symbol]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}