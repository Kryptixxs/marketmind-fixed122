'use client';

import React, { memo, useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type LineData,
} from 'lightweight-charts';
import { useTerminalStore } from '../../store/TerminalStore';
import { useCrosshairSync } from '../../context/CrosshairSyncContext';
import type { IntradayBar } from '../../types';

function formatVol(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
}

function sma(values: number[], period: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(NaN);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += values[i - j];
      out.push(sum / period);
    }
  }
  return out;
}

function rsi(closes: number[], period = 14): number[] {
  const out: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      out.push(50);
    } else {
      let gains = 0;
      let losses = 0;
      for (let j = 1; j <= period; j++) {
        const ch = closes[i - j + 1] - closes[i - j];
        if (ch > 0) gains += ch;
        else losses -= ch;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      out.push(100 - 100 / (1 + rs));
    }
  }
  return out;
}

export interface TechnicalChartProps {
  symbol?: string;
  className?: string;
  height?: number;
}

export const TechnicalChart = memo(function TechnicalChart({
  symbol: symbolProp,
  className = '',
  height = 280,
}: TechnicalChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma50Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const sma200Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiRef = useRef<ISeriesApi<'Line'> | null>(null);
  const { state } = useTerminalStore();
  const { crosshair, setCrosshair } = useCrosshairSync();
  const activeSymbol = symbolProp ?? state.activeSymbol;
  const barsDataRef = useRef<{ bars: IntradayBar[] }>({ bars: [] });

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#5a6b7a',
        fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
        fontSize: 10,
      },
      grid: { vertLines: { color: '#0d0d0d' }, horzLines: { color: '#0d0d0d' } },
      width: containerRef.current.clientWidth,
      height,
      rightPriceScale: {
        borderColor: '#222',
        scaleMargins: { top: 0.1, bottom: 0.25 },
        visible: true,
      },
      timeScale: {
        borderColor: '#222',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { labelVisible: true },
        horzLine: { labelVisible: true },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00FF00',
      downColor: '#FF0000',
      borderUpColor: '#00FF00',
      borderDownColor: '#FF0000',
    });
    candleSeries.priceScale().applyOptions({ scaleMargins: { top: 0.1, bottom: 0.35 } });
    candleRef.current = candleSeries;

    const sma50 = chart.addSeries(LineSeries, {
      color: '#FFD700',
      lineWidth: 1,
      title: 'SMA 50',
    });
    sma50Ref.current = sma50;

    const sma200 = chart.addSeries(LineSeries, {
      color: '#00BFFF',
      lineWidth: 1,
      title: 'SMA 200',
    });
    sma200Ref.current = sma200;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.72, bottom: 0 },
      visible: true,
      borderVisible: false,
    });
    volumeRef.current = volumeSeries;

    const rsiSeries = chart.addSeries(LineSeries, { color: '#FF69B4', lineWidth: 1, title: 'RSI' }, 1);
    rsiSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.1 },
      visible: true,
      borderVisible: false,
    });
    rsiRef.current = rsiSeries;

    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      sma50Ref.current = null;
      sma200Ref.current = null;
      rsiRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    const bars = state.barsBySymbol[activeSymbol] ?? [];
    const slice = bars.slice(-252);
    if (slice.length === 0) return;

    const candleData: CandlestickData[] = slice.map((b) => ({
      time: Math.floor(b.ts / 1000) as unknown as CandlestickData['time'],
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    const closes = slice.map((b) => b.close);
    const sma50vals = sma(closes, 50);
    const sma200vals = sma(closes, 200);
    const rsiVals = rsi(closes, 14);

    const sma50Data: LineData[] = candleData
      .map((c, i) => (Number.isNaN(sma50vals[i]) ? null : { time: c.time, value: sma50vals[i] }))
      .filter((x): x is LineData => x !== null);
    const sma200Data: LineData[] = candleData
      .map((c, i) => (Number.isNaN(sma200vals[i]) ? null : { time: c.time, value: sma200vals[i] }))
      .filter((x): x is LineData => x !== null);
    const rsiData: LineData[] = candleData.map((c, i) => ({ time: c.time, value: rsiVals[i] }));

    const volumeData: HistogramData[] = slice.map((b, i) => ({
      time: candleData[i].time,
      value: b.volume,
      color: b.close >= b.open ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)',
    }));

    barsDataRef.current = { bars: slice };
    if (candleRef.current) candleRef.current.setData(candleData);
    if (sma50Ref.current && sma50Data.length) sma50Ref.current.setData(sma50Data);
    if (sma200Ref.current && sma200Data.length) sma200Ref.current.setData(sma200Data);
    if (volumeRef.current) volumeRef.current.setData(volumeData);
    if (rsiRef.current) rsiRef.current.setData(rsiData);
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

  const syncCrosshairFromExternal = useCallback(
    (chart: IChartApi, priceSeries: ISeriesApi<'Candlestick'>) => {
      if (!crosshair) {
        chart.clearCrosshairPosition();
        return;
      }
      chart.setCrosshairPosition(crosshair.price, crosshair.time as unknown as CandlestickData['time'], priceSeries);
    },
    [crosshair]
  );

  useEffect(() => {
    const chart = chartRef.current;
    const candle = candleRef.current;
    const tooltip = tooltipRef.current;
    if (!chart || !candle || !tooltip) return;

    const handler = (param: { point?: { x: number; y: number }; time?: unknown; seriesData: Map<unknown, unknown> }) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        tooltip.style.display = 'none';
        setCrosshair(null);
        return;
      }

      const data = param.seriesData.get(candle) as
        | { open: number; high: number; low: number; close: number }
        | undefined;
      if (!data) {
        tooltip.style.display = 'none';
        setCrosshair(null);
        return;
      }

      const { bars } = barsDataRef.current;
      const idx = bars.findIndex((b) => Math.floor(b.ts / 1000) === param.time);
      const vol = idx >= 0 ? bars[idx]?.volume ?? 0 : 0;

      setCrosshair({ time: param.time as number, price: data.close });
      tooltip.style.display = 'block';
      tooltip.innerHTML = [
        `O: ${data.open.toFixed(2)}`,
        `H: ${data.high.toFixed(2)}`,
        `L: ${data.low.toFixed(2)}`,
        `C: ${data.close.toFixed(2)}`,
        `Vol: ${formatVol(vol)}`,
      ].join(' ');
    };
    chart.subscribeCrosshairMove(handler);
    return () => chart.unsubscribeCrosshairMove(handler);
  }, [setCrosshair]);

  useEffect(() => {
    const chart = chartRef.current;
    const candle = candleRef.current;
    if (!chart || !candle || !crosshair) return;
    syncCrosshairFromExternal(chart, candle);
  }, [crosshair, syncCrosshairFromExternal]);

  return (
    <div
      className={`relative min-w-0 min-h-0 overflow-hidden bg-[#000000] border border-[#222] ${className}`}
    >
      <div className="px-2 py-1 border-b border-[#222] text-[10px] font-mono text-[#5a6b7a]">
        {activeSymbol} • SMA 50/200 • RSI
      </div>
      <div ref={tooltipRef} className="absolute top-8 left-2 z-10 px-2 py-1 text-[10px] font-mono bg-[#111] border border-[#333] pointer-events-none" style={{ display: 'none', color: '#CCC' }} />
      <div ref={containerRef} style={{ height: height - 24 }} />
    </div>
  );
});
