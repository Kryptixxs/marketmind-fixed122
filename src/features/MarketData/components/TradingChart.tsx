'use client';

import { useEffect, useRef } from 'react';
import * as LightweightCharts from 'lightweight-charts';
import { ColorType, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts';

/** Theme colors matching globals.css (background, surface, border, positive, negative, cyan, text-tertiary) */
const THEME = {
  background: '#000205',
  surface: '#070d17',
  border: '#2b3f5f',
  borderMuted: 'rgba(43, 63, 95, 0.4)',
  text: '#7a90ac',
  positive: '#4ce0a5',
  negative: '#ff7ca3',
  cyan: '#63c8ff',
};

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
  height,
  compact = false,
}: {
  data: ChartData[];
  symbol?: string;
  height?: number;
  compact?: boolean;
}) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const lastDataRef = useRef<ChartData[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = LightweightCharts.createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: THEME.background },
        textColor: THEME.text,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: compact ? 9 : 10,
      },
      localization: { locale: navigator.language },
      grid: {
        vertLines: { color: THEME.borderMuted },
        horzLines: { color: THEME.borderMuted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { width: 1, color: THEME.border, style: 3, labelBackgroundColor: THEME.surface },
        horzLine: { width: 1, color: THEME.border, style: 3, labelBackgroundColor: THEME.surface },
      },
      rightPriceScale: {
        borderColor: THEME.border,
        autoScale: true,
        alignLabels: true,
      },
      timeScale: {
        borderColor: THEME.border,
        timeVisible: true,
        secondsVisible: false,
        barSpacing: compact ? 6 : 10,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: THEME.positive,
      borderUpColor: THEME.positive,
      wickUpColor: THEME.positive,
      downColor: THEME.negative,
      borderDownColor: THEME.negative,
      wickDownColor: THEME.negative,
      borderVisible: true,
      wickVisible: true,
    });

    const lineSeries = chart.addLineSeries({
      color: THEME.cyan,
      lineWidth: 2,
      crosshairMarkerVisible: false,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    lineSeriesRef.current = lineSeries;

    return () => {
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !lineSeriesRef.current || !data || data.length === 0) return;

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
      lineSeriesRef.current.update({ time: lastUnique.time as any, value: lastUnique.close });
    } else {
      seriesRef.current.setData(unique);
      lineSeriesRef.current.setData(unique.map((d) => ({ time: d.time as any, value: d.close })));
    }

    lastDataRef.current = unique;
  }, [data]);

  const style = height != null ? { height: `${height}px` } : undefined;
  return (
    <div
      ref={chartContainerRef}
      className="w-full"
      style={style}
    />
  );
}
