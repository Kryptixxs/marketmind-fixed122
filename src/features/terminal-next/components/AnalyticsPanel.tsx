'use client';

import { useMemo } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import { resolveFunctionModule } from '../services/functionRouter';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

function polylinePoints(values: number[], width: number, yScale: (v: number) => number) {
  if (!values.length) return '';
  return values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * width},${yScale(v)}`).join(' ');
}

export function AnalyticsPanel({ execMode = 'PRIMARY' }: { execMode?: 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' | 'ESC' }) {
  const { state, dispatch, deckRows } = useTerminalStore();

  const active = useMemo(() => {
    const prefix = `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''}`;
    return state.quotes.find((q) => q.symbol.startsWith(prefix)) ?? state.quotes[0];
  }, [state.quotes, state.security.market, state.security.ticker]);

  const bars = state.barsBySymbol[active?.symbol ?? ''] ?? [];
  const moduleDef = resolveFunctionModule(state.activeFunction);
  const recentBars = bars.slice(-48);
  const high = Math.max(...recentBars.map((b) => b.high), active?.high ?? 0);
  const low = Math.min(...recentBars.map((b) => b.low), active?.low ?? 0);
  const range = Math.max(0.0001, high - low);
  const maxVol = Math.max(1, ...recentBars.map((b) => b.volume));

  const priceY = (p: number) => 132 - ((p - low) / range) * 128;
  const volumeY = (v: number) => 174 - (v / maxVol) * 38;
  const chartW = execMode === 'ESC' ? 540 : 620;
  const bodyW = Math.max(4, (chartW / Math.max(1, recentBars.length)) * 0.58);

  const vwapValues = recentBars.map((b) => b.vwap);
  const ma9Values = recentBars.map((b) => b.ma9);
  const ma21Values = recentBars.map((b) => b.ma21);

  const hiBar = recentBars.reduce((best, b, i) => (b.high > (best?.high ?? -Infinity) ? { i, high: b.high } : best), null as null | { i: number; high: number });
  const loBar = recentBars.reduce((best, b, i) => (b.low < (best?.low ?? Infinity) ? { i, low: b.low } : best), null as null | { i: number; low: number });

  const effectiveTab = execMode === 'FACTORS' ? 'FACTORS' : execMode === 'EVENTS' ? 'EVENTS' : state.analyticsTab;

  const tabRows = useMemo(() => {
    if (effectiveTab === 'OVERVIEW') return deckRows;
    if (effectiveTab === 'FACTORS') {
      return [
        ['RealizedVol', `${state.risk.realizedVol}%`],
        ['ImpliedVol', `${state.risk.impliedVolProxy}%`],
        ['BetaSPX', `${active?.betaToSPX.toFixed(2) ?? '0.00'}`],
        ['CorrSPX', `${active?.corrToSPX.toFixed(2) ?? '0.00'}`],
        ['CorrNDX', `${active?.corrToNDX.toFixed(2) ?? '0.00'}`],
        ['Liquidity', `${active?.liquidityScore ?? 0}`],
        ['Momentum', `${active?.momentum.toFixed(2) ?? '0.00'}`],
        ['OFI', `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`],
      ];
    }
    return [
      ['IntradayVaR', `${fmt(state.risk.intradayVar, 0)}`],
      ['GrossExp', `${fmt(state.risk.grossExposure, 0)}`],
      ['NetExp', `${fmt(state.risk.netExposure, 0)}`],
      ['Concentration', `${state.risk.concentration}%`],
      ['Regime', state.risk.regime],
      ['Sweep', state.microstructure.sweep.text],
    ];
  }, [active?.betaToSPX, active?.corrToNDX, active?.corrToSPX, active?.liquidityScore, active?.momentum, deckRows, effectiveTab, state.microstructure.orderFlowImbalance, state.microstructure.sweep.text, state.risk.concentration, state.risk.grossExposure, state.risk.impliedVolProxy, state.risk.intradayVar, state.risk.netExposure, state.risk.realizedVol, state.risk.regime]);

  const splitClass =
    execMode === 'MICROSTRUCTURE'
      ? 'grid-cols-[46%_54%]'
      : execMode === 'FACTORS'
        ? 'grid-cols-[42%_58%]'
        : execMode === 'EVENTS'
          ? 'grid-cols-[38%_62%]'
          : execMode === 'ESC'
            ? 'grid-cols-[34%_66%]'
            : 'grid-cols-[54%_46%]';
  const leftRowsClass =
    execMode === 'MICROSTRUCTURE'
      ? 'grid-rows-[minmax(0,0.54fr)_minmax(0,0.46fr)]'
      : execMode === 'FACTORS'
        ? 'grid-rows-[minmax(0,0.42fr)_minmax(0,0.58fr)]'
        : execMode === 'ESC'
          ? 'grid-rows-[minmax(0,0.38fr)_minmax(0,0.62fr)]'
          : 'grid-rows-[minmax(0,0.56fr)_minmax(0,0.44fr)]';
  const modeHeaderClass =
    execMode === 'MICROSTRUCTURE'
      ? 'border-[#274b66] text-[#63c8ff]'
      : execMode === 'FACTORS'
        ? 'border-[#174432] text-[#7dffcc]'
        : execMode === 'EVENTS'
          ? 'border-[#5a1f35] text-[#e3b4ff]'
          : execMode === 'ESC'
            ? 'border-[#1a5f4b] text-[#99f1d6]'
          : 'border-[#2b3f5f] text-[#9bc3e8]';
  const modePanelBand =
    execMode === 'MICROSTRUCTURE'
      ? 'bg-[#091a2b]'
      : execMode === 'FACTORS'
        ? 'bg-[#0a1f15]'
        : execMode === 'EVENTS'
          ? 'bg-[#1a0c16]'
          : execMode === 'ESC'
            ? 'bg-[#0a1a14]'
          : 'bg-[#08111d]';

  const flashClass = state.delta.priceFlash[active?.symbol ?? ''] === 'up' ? 'text-[#7dffcc]' : state.delta.priceFlash[active?.symbol ?? ''] === 'down' ? 'text-[#ff9bbb]' : 'text-[#edf4fc]';

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col">
      <div className={`h-5 px-1 border-b bg-[#0a0a0a] flex items-center justify-between text-[10px] ${modeHeaderClass}`}>
        <span className="font-bold">{state.security.ticker} {state.security.market} &lt;{state.activeFunction}&gt; {moduleDef.title.toUpperCase()} [{execMode}]</span>
        <div className="flex items-center gap-1">
          <span className={`text-[9px] ${moduleDef.isDeferred ? 'text-[#ffb2c8]' : 'text-[#7f99ba]'}`}>{moduleDef.track === 'A' ? 'TRACK-A' : 'TRACK-B'}</span>
          {(['OVERVIEW', 'FACTORS', 'EVENTS'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => dispatch({ type: 'SET_ANALYTICS_TAB', payload: tab })}
              className={`px-1 border text-[9px] ${effectiveTab === tab ? 'border-[#2a7b60] text-[#99f1d6] bg-[#113328]' : 'border-[#263247] text-[#9fb4cd] bg-[#0a0a0a]'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="h-11 grid grid-cols-4 gap-px bg-[#1a1a1a] text-[10px]">
        <div className="bg-[#08111d] px-1 py-0.5">
          <div className="text-[#6f89aa]">Last</div>
          <div className={`font-bold text-[13px] tabular-nums ${flashClass}`}>{fmt(active?.last ?? 0, active && active.last < 10 ? 4 : 2)}</div>
        </div>
        <div className="bg-[#08111d] px-1 py-0.5">
          <div className="text-[#6f89aa]">Abs</div>
          <div className={`font-bold tabular-nums ${(active?.abs ?? 0) >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{(active?.abs ?? 0) >= 0 ? '+' : ''}{fmt(active?.abs ?? 0, 2)}</div>
        </div>
        <div className="bg-[#08111d] px-1 py-0.5">
          <div className="text-[#6f89aa]">Chg%</div>
          <div className={`font-bold tabular-nums ${(active?.pct ?? 0) >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{(active?.pct ?? 0) >= 0 ? '+' : ''}{fmt(active?.pct ?? 0, 2)}</div>
        </div>
        <div className="bg-[#08111d] px-1 py-0.5">
          <div className="text-[#6f89aa]">Volume</div>
          <div className="text-[#8cc7f3] font-bold tabular-nums">{fmt(active?.volumeM ?? 0, 2)}M</div>
        </div>
      </div>

      <div className={`grid ${splitClass} gap-px bg-[#1a1a1a] flex-1 min-h-0`}>
        <div className={`${modePanelBand} min-h-0 grid ${leftRowsClass}`}>
          <div className="min-h-0 flex flex-col">
          <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">{execMode === 'ESC' ? 'ESC PRICE CONTEXT (COMPACT CANDLE + VWAP + MA)' : 'INTRADAY (CANDLE + VWAP + MA + VOL)'}</div>
          <div className="relative flex-1">
            <svg viewBox={`0 0 ${chartW} ${execMode === 'ESC' ? 154 : 176}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              <line x1="0" y1={execMode === 'ESC' ? 112 : 132} x2={chartW} y2={execMode === 'ESC' ? 112 : 132} stroke="#1f3149" strokeWidth="1" />
              {recentBars.map((b, i) => {
                const x = (i / Math.max(1, recentBars.length - 1)) * chartW;
                const openY = priceY(b.open);
                const closeY = priceY(b.close);
                const highY = priceY(b.high);
                const lowY = priceY(b.low);
                const up = b.close >= b.open;
                return (
                  <g key={`c-${b.ts}-${i}`}>
                    <line x1={x} y1={highY} x2={x} y2={lowY} stroke={up ? '#50e8ac' : '#ff7ca3'} strokeWidth="1" />
                    <rect
                      x={x - bodyW / 2}
                      y={Math.min(openY, closeY)}
                      width={bodyW}
                      height={Math.max(1, Math.abs(closeY - openY))}
                      fill={up ? '#1f5a41' : '#59243a'}
                      stroke={up ? '#50e8ac' : '#ff7ca3'}
                      strokeWidth="0.8"
                    />
                    <rect
                      x={x - bodyW / 2}
                      y={execMode === 'ESC' ? Math.max(116, volumeY(b.volume)) : volumeY(b.volume)}
                      width={bodyW}
                      height={(execMode === 'ESC' ? 152 : 174) - (execMode === 'ESC' ? Math.max(116, volumeY(b.volume)) : volumeY(b.volume))}
                      fill={up ? '#1f5a41aa' : '#59243aaa'}
                    />
                  </g>
                );
              })}
              <polyline fill="none" stroke="#8cc7f3" strokeWidth="1.3" points={polylinePoints(vwapValues, chartW, priceY)} />
              <polyline fill="none" stroke="#f4cf6b" strokeWidth="1" points={polylinePoints(ma9Values, chartW, priceY)} />
              <polyline fill="none" stroke="#d18cff" strokeWidth="1" points={polylinePoints(ma21Values, chartW, priceY)} />
              {hiBar && (
                <>
                  <line x1="0" y1={priceY(hiBar.high)} x2={chartW} y2={priceY(hiBar.high)} stroke="#2f4d78" strokeDasharray="3 2" />
                  <text x="4" y={priceY(hiBar.high) - 2} fill="#9fb4cd" fontSize="8">HI {fmt(hiBar.high, 2)}</text>
                </>
              )}
              {loBar && (
                <>
                  <line x1="0" y1={priceY(loBar.low)} x2={chartW} y2={priceY(loBar.low)} stroke="#2f4d78" strokeDasharray="3 2" />
                  <text x="4" y={priceY(loBar.low) - 2} fill="#9fb4cd" fontSize="8">LO {fmt(loBar.low, 2)}</text>
                </>
              )}
            </svg>
          </div>
        </div>
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            <div className="h-4 px-1 border-b border-[#1a1a1a] text-[9px] text-[#9bc3e8] flex items-center">RISK SNAPSHOT</div>
            <div className="grid grid-cols-4 gap-px bg-[#142034] text-[9px]">
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">RV</div><div className="text-[#e7f1ff] font-bold">{state.risk.realizedVol}%</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">IVx</div><div className="text-[#e7f1ff] font-bold">{state.risk.impliedVolProxy}%</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">BETA</div><div className="text-[#e7f1ff] font-bold">{state.risk.beta}</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">CORR</div><div className="text-[#e7f1ff] font-bold">{state.risk.corrToBenchmark}</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">OFI</div><div className="text-[#e7f1ff] font-bold">{(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">LIQ</div><div className="text-[#e7f1ff] font-bold">{active?.liquidityScore ?? 0}</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">VaR</div><div className="text-[#e7f1ff] font-bold">{fmt(state.risk.intradayVar, 0)}</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">Sharpe</div><div className="text-[#e7f1ff] font-bold">{(1.2 + state.risk.beta * 0.3).toFixed(2)}</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">Drawdown</div><div className="text-[#e7f1ff] font-bold">{(state.risk.intradayVar * 0.4).toFixed(1)}%</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">Gross</div><div className="text-[#e7f1ff] font-bold">{fmt(state.risk.grossExposure, 0)}</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">Net</div><div className="text-[#e7f1ff] font-bold">{fmt(state.risk.netExposure, 0)}</div></div>
              <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">Conc</div><div className="text-[#e7f1ff] font-bold">{state.risk.concentration}%</div></div>
            </div>
          </div>
        </div>
        <div className={`${modePanelBand} min-h-0 grid grid-rows-[minmax(0,0.58fr)_minmax(0,0.42fr)]`}>
          <div className="min-h-0 overflow-y-auto custom-scrollbar">
            <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">ANALYTICS STACK</div>
            {tabRows.map(([k, v]) => (
              <div key={k} className="text-[10px] px-1 py-0.5 border-b border-[#1a1a1a] flex items-center justify-between">
                <span className="text-[#93a9c6]">{k}</span>
                <span className="text-[#e0eaf7] font-bold">{v}</span>
              </div>
            ))}
          </div>
          <div className="min-h-0 overflow-y-auto custom-scrollbar">
            <div className="h-4 px-1 border-b border-[#1a1a1a] text-[9px] text-[#9bc3e8] flex items-center">EXEC FLOW</div>
            {state.executionEvents.map((e) => (
              <div key={e.id} className="text-[9px] px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_.9fr_auto]">
                <span className="text-[#c8d8ee] truncate">{e.symbol}</span>
                <span className="text-[#9bb2cc]">{e.status}</span>
                <span className="text-right text-[#ffd98f]">{e.fillQty}@{fmt(e.fillPrice, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
