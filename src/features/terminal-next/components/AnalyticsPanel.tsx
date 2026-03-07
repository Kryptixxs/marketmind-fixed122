'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import { resolveFunctionModule } from '../services/functionRouter';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

function points(values: number[], width: number, y: (v: number) => number) {
  if (values.length === 0) return '';
  return values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * width},${y(v)}`).join(' ');
}

export function AnalyticsPanel({ execMode = 'PRIMARY' }: { execMode?: 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' | 'ESC' }) {
  const { state, dispatch, deckRows } = useTerminalStore();
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchInstitutionalDepth(sym).then(setDepth).catch(() => {});
  }, [state.activeSymbol]);

  const active = useMemo(() => {
    const prefix = `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''}`;
    return state.quotes.find((q) => q.symbol.startsWith(prefix)) ?? state.quotes[0];
  }, [state.quotes, state.security.market, state.security.ticker]);

  const moduleDef = resolveFunctionModule(state.activeFunction);
  const recentBars = (state.barsBySymbol[active?.symbol ?? ''] ?? []).slice(-72);
  const high = Math.max(...recentBars.map((b) => b.high), active?.high ?? 0);
  const low = Math.min(...recentBars.map((b) => b.low), active?.low ?? 0);
  const range = Math.max(0.0001, high - low);
  const maxVol = Math.max(1, ...recentBars.map((b) => b.volume), 1);

  const chartW = 430;
  const chartH = execMode === 'ESC' ? 108 : 126;
  const volTop = chartH + 10;
  const svgH = chartH + 58;
  const bodyW = Math.max(4, (chartW / Math.max(1, recentBars.length)) * 0.58);
  const yPrice = (p: number) => chartH - ((p - low) / range) * chartH;
  const yVol = (v: number) => volTop + 28 - (v / maxVol) * 28;

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
    execMode === 'MICROSTRUCTURE' ? 'grid-cols-[42%_58%]'
      : execMode === 'FACTORS' ? 'grid-cols-[40%_60%]'
        : execMode === 'EVENTS' ? 'grid-cols-[36%_64%]'
          : execMode === 'ESC' ? 'grid-cols-[32%_68%]'
            : 'grid-cols-[44%_56%]';

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

  const horizonRows = [
    ['1m', recentBars.length > 2 ? (((recentBars[recentBars.length - 1]?.close ?? 0) / (recentBars[recentBars.length - 2]?.close ?? 1) - 1) * 100).toFixed(2) : '0.00'],
    ['5m', recentBars.length > 6 ? (((recentBars[recentBars.length - 1]?.close ?? 0) / (recentBars[recentBars.length - 6]?.close ?? 1) - 1) * 100).toFixed(2) : '0.00'],
    ['15m', recentBars.length > 16 ? (((recentBars[recentBars.length - 1]?.close ?? 0) / (recentBars[recentBars.length - 16]?.close ?? 1) - 1) * 100).toFixed(2) : '0.00'],
    ['72b', recentBars.length > 1 ? (((recentBars[recentBars.length - 1]?.close ?? 0) / (recentBars[0]?.close ?? 1) - 1) * 100).toFixed(2) : '0.00'],
  ];

  const vwap = recentBars.map((b) => b.vwap);
  const ma9 = recentBars.map((b) => b.ma9);
  const ma21 = recentBars.map((b) => b.ma21);
  const sectorRows = depth?.market.sectors ?? [];
  const flowRows = depth?.market.flows ?? [];
  const impactRows = depth?.news.impacts ?? [];
  const revisionRows = depth?.financial.analystRevisions ?? [];
  const peerRows = state.quotes.filter((q) => q.symbol !== active?.symbol).slice(0, 80);

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
        <div className={`${modePanelBand} min-h-0 overflow-y-auto custom-scrollbar`}>
          <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">{execMode === 'ESC' ? 'ESC PRICE CONTEXT (COMPACT)' : 'INTRADAY PRICE CONTEXT'}</div>
          <div className="p-1 border-b border-[#1a1a1a]">
            <svg viewBox={`0 0 ${chartW} ${svgH}`} preserveAspectRatio="none" className="w-full h-[170px]">
              <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="#1f3149" strokeWidth="1" />
              {recentBars.map((b, i) => {
                const x = (i / Math.max(1, recentBars.length - 1)) * chartW;
                const openY = yPrice(b.open);
                const closeY = yPrice(b.close);
                const highY = yPrice(b.high);
                const lowY = yPrice(b.low);
                const up = b.close >= b.open;
                return (
                  <g key={`c-${b.ts}-${i}`}>
                    <line x1={x} y1={highY} x2={x} y2={lowY} stroke={up ? '#50e8ac' : '#ff7ca3'} strokeWidth="1" />
                    <rect x={x - bodyW / 2} y={Math.min(openY, closeY)} width={bodyW} height={Math.max(1, Math.abs(closeY - openY))} fill={up ? '#1f5a41' : '#59243a'} stroke={up ? '#50e8ac' : '#ff7ca3'} strokeWidth="0.8" />
                    <rect x={x - bodyW / 2} y={yVol(b.volume)} width={bodyW} height={svgH - yVol(b.volume)} fill={up ? '#1f5a41aa' : '#59243aaa'} />
                  </g>
                );
              })}
              <polyline fill="none" stroke="#8cc7f3" strokeWidth="1.3" points={points(vwap, chartW, yPrice)} />
              <polyline fill="none" stroke="#f4cf6b" strokeWidth="1" points={points(ma9, chartW, yPrice)} />
              <polyline fill="none" stroke="#d18cff" strokeWidth="1" points={points(ma21, chartW, yPrice)} />
            </svg>
          </div>

          <div className="h-4 px-1 border-b border-[#1a1a1a] text-[9px] text-[#9bc3e8] flex items-center">RISK + HORIZON SNAPSHOT</div>
          <div className="grid grid-cols-4 gap-px bg-[#142034] text-[9px] border-b border-[#1a1a1a]">
            <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">RV</div><div className="text-[#e7f1ff] font-bold">{state.risk.realizedVol}%</div></div>
            <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">IVx</div><div className="text-[#e7f1ff] font-bold">{state.risk.impliedVolProxy}%</div></div>
            <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">BETA</div><div className="text-[#e7f1ff] font-bold">{state.risk.beta}</div></div>
            <div className="bg-[#0a0a0a] px-1 py-[2px]"><div className="text-[#7d91ac]">CORR</div><div className="text-[#e7f1ff] font-bold">{state.risk.corrToBenchmark}</div></div>
          </div>
          {horizonRows.map(([h, r]) => (
            <div key={h} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] flex justify-between">
              <span className="text-[#9fb4cd]">{h}</span>
              <span className={`${Number(r) >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'} font-bold`}>{Number(r) >= 0 ? '+' : ''}{r}%</span>
            </div>
          ))}
        </div>

        <div className={`${modePanelBand} min-h-0 overflow-y-auto custom-scrollbar`}>
          <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">ANALYTICS + FLOW STACK</div>
          <div className="h-4 px-1 border-b border-[#1a1a1a] text-[9px] text-[#9bc3e8] flex items-center">PRIMARY ANALYTICS</div>
          {tabRows.map(([k, v]) => (
            <div key={k} className="text-[10px] px-1 py-0.5 border-b border-[#1a1a1a] flex items-center justify-between">
              <span className="text-[#93a9c6]">{k}</span>
              <span className="text-[#e0eaf7] font-bold">{v}</span>
            </div>
          ))}

          <div className="h-4 px-1 border-b border-[#1a1a1a] text-[9px] text-[#9bc3e8] flex items-center">SECTOR / FLOW / IMPACT</div>
          {sectorRows.map((s) => (
            <div key={`sec-${s.sector}`} className="text-[9px] px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto]">
              <span className="text-[#93a9c6]">{s.sector}</span>
              <span className={`text-right ${s.movePct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'} font-bold`}>{s.movePct >= 0 ? '+' : ''}{s.movePct.toFixed(2)}%</span>
              <span className="text-right text-[#b2c4db]">b {s.beta.toFixed(2)}</span>
            </div>
          ))}
          {flowRows.map((f) => (
            <div key={`flow-${f.vehicle}`} className="text-[9px] px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto]">
              <span className="text-[#93a9c6]">{f.vehicle}</span>
              <span className={`${f.direction === 'Inflow' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'} font-bold`}>{`${f.flowUsdM >= 0 ? '+' : ''}$${f.flowUsdM.toFixed(0)}M`}</span>
              <span className="text-right text-[#b2c4db]">{f.direction}</span>
            </div>
          ))}
          {impactRows.map((i, idx) => (
            <div key={`imp-${idx}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#6e85a3]">
              {`${i.date} ${i.priceImpactPct >= 0 ? '+' : ''}${i.priceImpactPct.toFixed(2)}% vol ${i.volShiftPct >= 0 ? '+' : ''}${i.volShiftPct.toFixed(2)}%`}
            </div>
          ))}

          <div className="h-4 px-1 border-b border-[#1a1a1a] text-[9px] text-[#9bc3e8] flex items-center">EXEC FLOW</div>
          {state.executionEvents.map((e) => (
            <div key={e.id} className="text-[9px] px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_.9fr_auto]">
              <span className="text-[#c8d8ee] truncate">{e.symbol}</span>
              <span className="text-[#9bb2cc]">{e.status}</span>
              <span className="text-right text-[#ffd98f]">{e.fillQty}@{fmt(e.fillPrice, 2)}</span>
            </div>
          ))}

          <div className="h-4 px-1 border-b border-[#1a1a1a] text-[9px] text-[#9bc3e8] flex items-center">PEER + REVISIONS + SYSTEM</div>
          {peerRows.map((q) => (
            <div key={`peer-${q.symbol}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto_auto]">
              <span className="text-[#93a9c6]">{q.symbol}</span>
              <span className="text-right text-[#b2c4db]">{fmt(q.last, 2)}</span>
              <span className={`text-right ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'} font-bold`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}%</span>
              <span className="text-right text-[#6e85a3]">LQ {q.liquidityScore}</span>
            </div>
          ))}
          {revisionRows.map((r) => (
            <div key={r.date} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#6e85a3]">
              {`${r.date} EPS ${r.epsRevPct >= 0 ? '+' : ''}${r.epsRevPct.toFixed(2)}% REV ${r.revRevPct >= 0 ? '+' : ''}${r.revRevPct.toFixed(2)}% TP ${r.target.toFixed(2)}`}
            </div>
          ))}
          {state.systemFeed.map((line, i) => (
            <div key={`${line}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#6e85a3]">{line}</div>
          ))}
          {state.headlines.map((line, i) => (
            <div key={`head-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-[#6e85a3]">{line}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
