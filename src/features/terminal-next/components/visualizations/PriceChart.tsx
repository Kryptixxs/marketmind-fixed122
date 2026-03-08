'use client';

import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type HistogramData,
  LineStyle,
} from 'lightweight-charts';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { useTerminalStore } from '../../store/TerminalStore';
import { useCrosshairSync } from '../../context/CrosshairSyncContext';
import type { IntradayBar } from '../../types';

const BLOOMBERG_BLUE = '#0068FF';
const GRID_FAINT = 'rgba(51, 51, 51, 0.4)';
const AMBER = '#FFB000';

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

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = NaN;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(NaN);
    } else {
      const v =
        i === period - 1
          ? values.slice(0, period).reduce((a, b) => a + b, 0) / period
          : values[i]! * k + prev * (1 - k);
      out.push(v);
      prev = v;
    }
  }
  return out;
}

function std(values: number[], period: number, mean: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1 || !Number.isFinite(mean[i])) {
      out.push(NaN);
    } else {
      let sumSq = 0;
      for (let j = 0; j < period; j++) sumSq += (values[i - j] - mean[i]) ** 2;
      out.push(Math.sqrt(sumSq / period));
    }
  }
  return out;
}

function bollingerBands(closes: number[], period = 20, mult = 2) {
  const middle = sma(closes, period);
  const stdev = std(closes, period, middle);
  return {
    upper: middle.map((m, i) => (Number.isFinite(m) && Number.isFinite(stdev[i]) ? m + mult * stdev[i]! : NaN)),
    middle,
    lower: middle.map((m, i) => (Number.isFinite(m) && Number.isFinite(stdev[i]) ? m - mult * stdev[i]! : NaN)),
  };
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
        const ch = closes[i - j + 1]! - closes[i - j]!;
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

function macd(closes: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push(Number.isFinite(emaFast[i]) && Number.isFinite(emaSlow[i])
      ? emaFast[i]! - emaSlow[i]!
      : NaN);
  }
  const validMacd = macdLine.filter((v) => Number.isFinite(v));
  const signalEma = ema(validMacd, signal);
  let si = 0;
  const signalLine = macdLine.map((v) => {
    if (!Number.isFinite(v)) return NaN;
    const s = signalEma[si];
    si++;
    return s;
  });
  const histogram = macdLine.map((m, i) =>
    Number.isFinite(m) && Number.isFinite(signalLine[i]) ? m - signalLine[i]! : NaN
  );
  return { macdLine, signalLine, histogram };
}

function formatVol(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
}

export interface PriceChartProps {
  ticker?: string;
  className?: string;
  height?: number;
  chartId?: string;
}

export const PriceChart = memo(function PriceChart({
  ticker: tickerProp,
  className = '',
  height: heightProp,
  chartId = 'gp-main',
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const oscillatorRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const oscillatorChartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const sma50Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const sma200Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const rsiRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [gpoActive, setGpoActive] = useState(true);
  const { state } = useTerminalStore();
  const { crosshair, setCrosshair } = useCrosshairSync();
  const activeTicker = tickerProp ?? state.activeSymbol;
  const barsDataRef = useRef<{
    bars: IntradayBar[];
    candleData: CandlestickData[];
    timeToRsi: Map<number, number>;
    timeToMacd: Map<number, number>;
  }>({ bars: [], candleData: [], timeToRsi: new Map(), timeToMacd: new Map() });

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
    if (!containerRef.current) return;
    const el = containerRef.current;
    const w = el.clientWidth || 400;
    const h = el.clientHeight || 200;

    const chart = createChart(el, {
      layout: {
        background: { color: '#000000' },
        textColor: '#999',
        fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
        fontSize: 11,
      },
      grid: { vertLines: { color: GRID_FAINT }, horzLines: { color: GRID_FAINT } },
      width: w,
      height: h,
      rightPriceScale: {
        borderColor: '#333',
        scaleMargins: { top: 0.08, bottom: 0.32 },
        visible: true,
      },
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { labelVisible: true },
        horzLine: { labelVisible: true },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00C853',
      downColor: '#FF1744',
      borderUpColor: '#00C853',
      borderDownColor: '#FF1744',
    });
    candleRef.current = candleSeries;

    const sma50 = chart.addSeries(LineSeries, {
      color: AMBER,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'SMA 50',
    });
    sma50Ref.current = sma50;

    const sma200 = chart.addSeries(LineSeries, {
      color: BLOOMBERG_BLUE,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'SMA 200',
    });
    sma200Ref.current = sma200;

    const bbUpper = chart.addSeries(LineSeries, {
      color: '#888',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB+',
    });
    bbUpperRef.current = bbUpper;

    const bbMiddle = chart.addSeries(LineSeries, {
      color: '#666',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB',
    });
    bbMiddleRef.current = bbMiddle;

    const bbLower = chart.addSeries(LineSeries, {
      color: '#888',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'BB-',
    });
    bbLowerRef.current = bbLower;

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

    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      sma50Ref.current = null;
      sma200Ref.current = null;
      bbUpperRef.current = null;
      bbMiddleRef.current = null;
      bbLowerRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!oscillatorRef.current) return;
    const el = oscillatorRef.current;
    const w = el.clientWidth || 400;
    const h = Math.max(120, el.clientHeight || 120);

    const chart = createChart(el, {
      layout: {
        background: { color: '#000000' },
        textColor: '#888',
        fontFamily: '"JetBrains Mono", "Roboto Mono", monospace',
        fontSize: 10,
      },
      grid: { vertLines: { color: GRID_FAINT }, horzLines: { color: GRID_FAINT } },
      width: w,
      height: h,
      rightPriceScale: {
        borderColor: '#333',
        scaleMargins: { top: 0.1, bottom: 0.5 },
        visible: true,
      },
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
        visible: true,
      },
      crosshair: {
        vertLine: { labelVisible: true },
        horzLine: { labelVisible: true },
      },
    });

    const rsiSeries = chart.addSeries(LineSeries, {
      color: '#FF69B4',
      lineWidth: 1,
      title: 'RSI',
      priceScaleId: 'rsi',
    });
    rsiSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.1, bottom: 0.6 },
      visible: true,
      borderVisible: false,
    });
    rsiSeries.createPriceLine({ price: 70, color: '#FF1744', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'Overbought' });
    rsiSeries.createPriceLine({ price: 30, color: '#00C853', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'Oversold' });
    rsiRef.current = rsiSeries;

    const macdSeries = chart.addSeries(LineSeries, {
      color: BLOOMBERG_BLUE,
      lineWidth: 1,
      title: 'MACD',
      priceScaleId: 'macd',
    });
    macdSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.55, bottom: 0.1 },
      visible: true,
      borderVisible: false,
    });
    macdRef.current = macdSeries;

    const macdSignalSeries = chart.addSeries(LineSeries, {
      color: AMBER,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      title: 'Signal',
      priceScaleId: 'macd',
    });
    macdSignalRef.current = macdSignalSeries;

    const macdHistSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'macd',
    });
    macdHistSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.55, bottom: 0.1 },
      visible: false,
      borderVisible: false,
    });
    macdHistRef.current = macdHistSeries;

    oscillatorChartRef.current = chart;

    return () => {
      chart.remove();
      oscillatorChartRef.current = null;
      rsiRef.current = null;
      macdRef.current = null;
      macdSignalRef.current = null;
      macdHistRef.current = null;
    };
  }, []);

  useEffect(() => {
    const bars = state.barsBySymbol[activeTicker] ?? [];
    const slice = bars.slice(-252);
    if (slice.length === 0) return;

    const candleData: CandlestickData[] = slice.map((b) => ({
      time: Math.floor(b.ts / 1000) as unknown as CandlestickData['time'],
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
    const timeToRsi = new Map<number, number>();
    const timeToMacd = new Map<number, number>();
    candleData.forEach((c, i) => {
      timeToRsi.set(c.time as number, rsiVals[i]!);
      timeToMacd.set(c.time as number, macdLine[i]!);
    });
    barsDataRef.current = { bars: slice, candleData, timeToRsi, timeToMacd };

    const closes = slice.map((b) => b.close);
    const sma50vals = sma(closes, 50);
    const sma200vals = sma(closes, 200);
    const bb = bollingerBands(closes, 20, 2);
    const rsiVals = rsi(closes, 14);
    const { macdLine, signalLine, histogram } = macd(closes);

    const volData: HistogramData[] = slice.map((b, i) => ({
      time: candleData[i]!.time,
      value: b.volume,
      color: b.close >= b.open ? 'rgba(0,200,83,0.4)' : 'rgba(255,23,68,0.4)',
    }));

    const sma50Data: LineData[] = candleData
      .map((c, i) => (Number.isNaN(sma50vals[i]) ? null : { time: c.time, value: sma50vals[i]! }))
      .filter((x): x is LineData => x !== null);
    const sma200Data: LineData[] = candleData
      .map((c, i) => (Number.isNaN(sma200vals[i]) ? null : { time: c.time, value: sma200vals[i]! }))
      .filter((x): x is LineData => x !== null);
    const bbUpperData: LineData[] = candleData
      .map((c, i) => (Number.isNaN(bb.upper[i]) ? null : { time: c.time, value: bb.upper[i]! }))
      .filter((x): x is LineData => x !== null);
    const bbMiddleData: LineData[] = candleData
      .map((c, i) => (Number.isNaN(bb.middle[i]) ? null : { time: c.time, value: bb.middle[i]! }))
      .filter((x): x is LineData => x !== null);
    const bbLowerData: LineData[] = candleData
      .map((c, i) => (Number.isNaN(bb.lower[i]) ? null : { time: c.time, value: bb.lower[i]! }))
      .filter((x): x is LineData => x !== null);

    if (candleRef.current) candleRef.current.setData(candleData);
    if (volumeRef.current) volumeRef.current.setData(volData);

    if (gpoActive) {
      if (sma50Ref.current && sma50Data.length) sma50Ref.current.setData(sma50Data);
      if (sma200Ref.current && sma200Data.length) sma200Ref.current.setData(sma200Data);
      if (bbUpperRef.current && bbUpperData.length) bbUpperRef.current.setData(bbUpperData);
      if (bbMiddleRef.current && bbMiddleData.length) bbMiddleRef.current.setData(bbMiddleData);
      if (bbLowerRef.current && bbLowerData.length) bbLowerRef.current.setData(bbLowerData);
    }
    sma50Ref.current?.applyOptions({ visible: gpoActive });
    sma200Ref.current?.applyOptions({ visible: gpoActive });
    bbUpperRef.current?.applyOptions({ visible: gpoActive });
    bbMiddleRef.current?.applyOptions({ visible: gpoActive });
    bbLowerRef.current?.applyOptions({ visible: gpoActive });

    const rsiData: LineData[] = candleData.map((c, i) => ({ time: c.time, value: rsiVals[i]! }));
    const macdData: LineData[] = candleData
      .map((c, i) => (Number.isFinite(macdLine[i]) ? { time: c.time, value: macdLine[i]! } : null))
      .filter((x): x is LineData => x !== null);
    const macdSignalData: LineData[] = candleData
      .map((c, i) => (Number.isFinite(signalLine[i]) ? { time: c.time, value: signalLine[i]! } : null))
      .filter((x): x is LineData => x !== null);
    const macdHistData: HistogramData[] = [];
    candleData.forEach((c, i) => {
      if (!Number.isFinite(histogram[i])) return;
      macdHistData.push({
        time: c.time,
        value: histogram[i]!,
        color: histogram[i]! >= 0 ? 'rgba(0,104,255,0.5)' : 'rgba(255,23,68,0.5)',
      });
    });

    if (rsiRef.current) rsiRef.current.setData(rsiData);
    if (macdRef.current && macdData.length) macdRef.current.setData(macdData);
    if (macdSignalRef.current && macdSignalData.length) macdSignalRef.current.setData(macdSignalData);
    if (macdHistRef.current && macdHistData.length) macdHistRef.current.setData(macdHistData);
  }, [activeTicker, state.barsBySymbol, gpoActive]);

  const handleMainCrosshairMove = useCallback(
    (param: { point?: { x: number; y: number }; time?: unknown; seriesData: Map<unknown, unknown> }) => {
      const candle = candleRef.current;
      const tooltip = tooltipRef.current;
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        if (tooltip) tooltip.style.display = 'none';
        setCrosshair(null);
        return;
      }

      const data = param.seriesData.get(candle) as
        | { open: number; high: number; low: number; close: number }
        | undefined;
      if (!data) {
        if (tooltip) tooltip.style.display = 'none';
        setCrosshair(null);
        return;
      }

      const { bars } = barsDataRef.current;
      const idx = bars.findIndex((b) => Math.floor(b.ts / 1000) === param.time);
      const vol = idx >= 0 ? bars[idx]?.volume ?? 0 : 0;

      setCrosshair({ time: param.time as number, price: data.close });
      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.innerHTML = [
          `O: ${data.open.toFixed(2)}`,
          `H: ${data.high.toFixed(2)}`,
          `L: ${data.low.toFixed(2)}`,
          `C: ${data.close.toFixed(2)}`,
          `Vol: ${formatVol(vol)}`,
        ].join(' ');
      }
    },
    [setCrosshair]
  );

  const handleOscCrosshairMove = useCallback(
    (param: { point?: { x: number; y: number }; time?: unknown; seriesData: Map<unknown, unknown> }) => {
      const tooltip = tooltipRef.current;
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        if (tooltip) tooltip.style.display = 'none';
        setCrosshair(null);
        return;
      }

      const { bars, candleData } = barsDataRef.current;
      const idx = candleData.findIndex((c) => c.time === param.time);
      if (idx < 0) {
        setCrosshair(null);
        return;
      }
      const b = bars[idx]!;
      const vol = b.volume;
      setCrosshair({ time: param.time as number, price: b.close });
      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.innerHTML = [
          `O: ${b.open.toFixed(2)}`,
          `H: ${b.high.toFixed(2)}`,
          `L: ${b.low.toFixed(2)}`,
          `C: ${b.close.toFixed(2)}`,
          `Vol: ${formatVol(vol)}`,
        ].join(' ');
      }
    },
    [setCrosshair]
  );

  useEffect(() => {
    const chart = chartRef.current;
    const candle = candleRef.current;
    const tooltip = tooltipRef.current;
    if (!chart || !candle || !tooltip) return;

    chart.subscribeCrosshairMove(handleMainCrosshairMove);
    return () => chart.unsubscribeCrosshairMove(handleMainCrosshairMove);
  }, [handleMainCrosshairMove]);

  useEffect(() => {
    const oscChart = oscillatorChartRef.current;
    if (!oscChart) return;

    oscChart.subscribeCrosshairMove(handleOscCrosshairMove);
    return () => oscChart.unsubscribeCrosshairMove(handleOscCrosshairMove);
  }, [handleOscCrosshairMove]);

  useEffect(() => {
    const chart = chartRef.current;
    const candle = candleRef.current;
    const oscChart = oscillatorChartRef.current;
    const rsiSeries = rsiRef.current;
    if (!crosshair) {
      if (chart) chart.clearCrosshairPosition();
      if (oscChart) oscChart.clearCrosshairPosition();
      return;
    }
    if (!chart || !candle) return;
    syncCrosshairFromExternal(chart, candle);
    if (oscChart && rsiSeries) {
      const rsiVal = barsDataRef.current.timeToRsi.get(crosshair.time);
      if (rsiVal != null) {
        oscChart.setCrosshairPosition(rsiVal, crosshair.time as unknown as CandlestickData['time'], rsiSeries);
      } else {
        oscChart.clearCrosshairPosition();
      }
    }
  }, [crosshair, syncCrosshairFromExternal]);

  useEffect(() => {
    const el = containerRef.current;
    const osc = oscillatorRef.current;
    if (!el) return;
    const chart = chartRef.current;
    const oscChart = oscillatorChartRef.current;
    const onResize = () => {
      if (chart && el) chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
      if (oscChart && osc) oscChart.applyOptions({ width: osc.clientWidth, height: osc.clientHeight });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    if (osc) ro.observe(osc);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className={`flex flex-col min-w-0 min-h-0 overflow-hidden bg-[#000000] border border-[#333] h-full ${className}`}
      style={{ fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}
    >
      <div className="flex-none flex items-center justify-between px-2 py-1 border-b border-[#333]">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: AMBER }}>
          GP • Graph Price • {activeTicker}
        </span>
        <button
          type="button"
          onClick={() => setGpoActive((v) => !v)}
          className="text-[10px] px-2 py-0.5 border border-[#333] uppercase"
          style={{
            color: gpoActive ? AMBER : '#666',
            background: gpoActive ? 'rgba(255,176,0,0.1)' : 'transparent',
          }}
        >
          GPO {gpoActive ? 'ON' : 'OFF'}
        </button>
      </div>
      <Group orientation="vertical" id={`${chartId}-resize`}>
        <Panel id="main" defaultSize={70} minSize={30}>
          <div className="relative h-full">
            <div ref={tooltipRef} className="absolute top-2 left-2 z-10 px-2 py-1 text-[10px] font-mono bg-[#111] border border-[#333] pointer-events-none" style={{ display: 'none', color: '#CCC' }} />
            <div ref={containerRef} className="w-full h-full min-h-[120px]" />
          </div>
        </Panel>
        <Separator className="h-1 bg-[#222] hover:bg-[#333] transition-colors" />
        <Panel id="osc" defaultSize={30} minSize={12}>
          <div className="flex flex-col h-full">
            <div className="flex-none px-2 py-0.5 border-b border-[#222] text-[9px] text-[#666] uppercase">
              RSI (14) • MACD
            </div>
            <div ref={oscillatorRef} className="flex-1 min-h-[80px]" />
          </div>
        </Panel>
      </Group>
    </div>
  );
});
