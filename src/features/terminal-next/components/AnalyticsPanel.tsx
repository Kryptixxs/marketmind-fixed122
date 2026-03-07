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

type ExecMode = 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' | 'ESC';
type Tone = 'neutral' | 'positive' | 'negative' | 'accent';
type Row = { label: string; value: string; tone?: Tone };

const toneClass: Record<Tone, string> = {
  neutral: 'text-[#d8e6f8]',
  positive: 'text-[#4ce0a5]',
  negative: 'text-[#ff7ca3]',
  accent: 'text-[#8cc7f3]',
};

function sectionRows(modeRows: Row[], peerSectorFlow: Row[], revisionSystem: Row[], explanation: string): { rows: Row[]; reason?: string } {
  if (modeRows.length > 0) return { rows: modeRows };
  if (peerSectorFlow.length > 0) return { rows: peerSectorFlow, reason: 'fallback: peer/sector/flow' };
  if (revisionSystem.length > 0) return { rows: revisionSystem, reason: 'fallback: revision/news/system' };
  return {
    rows: [{ label: 'NOTICE', value: explanation, tone: 'accent' }],
    reason: 'explicit-empty-state',
  };
}

function modeBandClass(mode: ExecMode): string {
  if (mode === 'MICROSTRUCTURE') return 'bg-[#081925]';
  if (mode === 'FACTORS') return 'bg-[#0a1f15]';
  if (mode === 'EVENTS') return 'bg-[#1a0c16]';
  if (mode === 'ESC') return 'bg-[#0a1a14]';
  return 'bg-[#08111d]';
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
  const recentBars = state.barsBySymbol[active?.symbol ?? ''] ?? [];
  const high = Math.max(...recentBars.map((b) => b.high), active?.high ?? 0);
  const low = Math.min(...recentBars.map((b) => b.low), active?.low ?? 0);
  const range = Math.max(0.0001, high - low);
  const maxVol = Math.max(1, ...recentBars.map((b) => b.volume), 1);

  const chartW = 430;
  const chartH = execMode === 'ESC' ? 66 : execMode === 'EVENTS' ? 72 : 78;
  const volTop = chartH + 8;
  const svgH = chartH + 30;
  const bodyW = Math.max(4, (chartW / Math.max(1, recentBars.length)) * 0.58);
  const yPrice = (p: number) => chartH - ((p - low) / range) * chartH;
  const yVol = (v: number) => volTop + 18 - (v / maxVol) * 18;

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

  const modePanelBand = modeBandClass(execMode);

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
  const peerRows = state.quotes.filter((q) => q.symbol !== active?.symbol).slice(0, 120);

  const flashClass = state.delta.priceFlash[active?.symbol ?? ''] === 'up' ? 'text-[#7dffcc]' : state.delta.priceFlash[active?.symbol ?? ''] === 'down' ? 'text-[#ff9bbb]' : 'text-[#edf4fc]';

  const riskRows: Row[] = [
    { label: 'RV', value: `${state.risk.realizedVol}%`, tone: 'accent' },
    { label: 'IVx', value: `${state.risk.impliedVolProxy}%`, tone: 'accent' },
    { label: 'BETA', value: `${state.risk.beta}` },
    { label: 'CORR', value: `${state.risk.corrToBenchmark}` },
    { label: 'Regime', value: `${state.risk.regime}` },
    { label: 'VaR', value: fmt(state.risk.intradayVar, 0) },
    { label: 'Gross', value: fmt(state.risk.grossExposure, 0) },
    { label: 'Net', value: fmt(state.risk.netExposure, 0) },
  ];

  const horizonRowsDense: Row[] = horizonRows.map(([h, r]) => ({
    label: h,
    value: `${Number(r) >= 0 ? '+' : ''}${r}%`,
    tone: Number(r) >= 0 ? 'positive' : 'negative',
  }));

  const modeRows: Record<ExecMode, Row[]> = {
    PRIMARY: [
      ...tabRows.map(([k, v]) => ({ label: k, value: String(v), tone: 'neutral' as Tone })),
      ...state.executionEvents.map((e) => ({
        label: `${e.symbol} ${e.status}`,
        value: `${e.fillQty}@${fmt(e.fillPrice, 2)}`,
        tone: 'accent' as Tone,
      })),
    ],
    MICROSTRUCTURE: [
      { label: 'OFI', value: `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`, tone: state.microstructure.orderFlowImbalance >= 0 ? 'positive' : 'negative' },
      { label: 'Sweep', value: state.microstructure.sweep.text, tone: 'accent' },
      { label: 'Liquidity', value: `${active?.liquidityScore ?? 0}` },
      { label: 'Momentum', value: `${active?.momentum.toFixed(2) ?? '0.00'}` },
      ...state.executionEvents.map((e) => ({
        label: `${e.status}`,
        value: `${e.symbol} ${e.fillQty}@${fmt(e.fillPrice, 2)}`,
        tone: 'accent' as Tone,
      })),
    ],
    FACTORS: [
      ...tabRows.map(([k, v]) => ({ label: k, value: String(v), tone: 'neutral' as Tone })),
      ...peerRows.map((q) => ({
        label: `${q.symbol} b${q.betaToSPX.toFixed(2)} c${q.corrToSPX.toFixed(2)}`,
        value: `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`,
        tone: q.pct >= 0 ? 'positive' : 'negative',
      })),
    ],
    EVENTS: [
      ...impactRows.map((i) => ({
        label: `${i.date} ${i.event}`,
        value: `${i.priceImpactPct >= 0 ? '+' : ''}${i.priceImpactPct.toFixed(2)}% / vol ${i.volShiftPct >= 0 ? '+' : ''}${i.volShiftPct.toFixed(2)}%`,
        tone: i.priceImpactPct >= 0 ? 'positive' : 'negative',
      })),
      ...state.headlines.map((h) => ({ label: 'HEADLINE', value: h, tone: 'accent' as Tone })),
    ],
    ESC: [
      ...state.executionEvents.map((e) => ({
        label: `${e.symbol} ${e.status}`,
        value: `${e.fillQty}@${fmt(e.fillPrice, 2)}`,
        tone: 'accent' as Tone,
      })),
      ...horizonRowsDense,
      ...riskRows.slice(0, 6),
    ],
  };

  const peerSectorFlow: Row[] = [
    ...sectorRows.map((s) => ({
      label: `${s.sector} b${s.beta.toFixed(2)}`,
      value: `${s.movePct >= 0 ? '+' : ''}${s.movePct.toFixed(2)}%`,
      tone: s.movePct >= 0 ? 'positive' : 'negative',
    })),
    ...flowRows.map((f) => ({
      label: `${f.vehicle} ${f.direction}`,
      value: `${f.flowUsdM >= 0 ? '+' : ''}$${f.flowUsdM.toFixed(0)}M`,
      tone: f.direction === 'Inflow' ? 'positive' : 'negative',
    })),
    ...peerRows.map((q) => ({
      label: `${q.symbol} LQ ${q.liquidityScore}`,
      value: `${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`,
      tone: q.pct >= 0 ? 'positive' : 'negative',
    })),
  ];

  const revisionSystem: Row[] = [
    ...revisionRows.map((r) => ({
      label: `${r.date} EPS ${r.epsRevPct >= 0 ? '+' : ''}${r.epsRevPct.toFixed(2)}%`,
      value: `REV ${r.revRevPct >= 0 ? '+' : ''}${r.revRevPct.toFixed(2)}% TP ${r.target.toFixed(2)}`,
      tone: r.epsRevPct >= 0 ? 'positive' : 'negative',
    })),
    ...state.systemFeed.map((line) => ({ label: 'SYSTEM', value: line, tone: 'accent' as Tone })),
    ...state.headlines.map((line) => ({ label: 'NEWS', value: line, tone: 'neutral' as Tone })),
  ];
  const depthTelemetryRows: Row[] = state.orderBook.flatMap((r, idx) => [
    {
      label: `L${idx + 1} BID`,
      value: `${r.bid.toFixed(2)} x ${r.bidSize}`,
      tone: 'positive',
    },
    {
      label: `L${idx + 1} ASK`,
      value: `${r.ask.toFixed(2)} x ${r.askSize}`,
      tone: 'negative',
    },
  ]);

  const resolvedModeRows = sectionRows(
    modeRows[execMode],
    peerSectorFlow,
    revisionSystem,
    `No ${execMode} intelligence rows available after fallback chain.`
  );
  const resolvedRiskRows = sectionRows(riskRows, peerSectorFlow, revisionSystem, 'No risk/regime rows available.');
  const resolvedFlowRows = sectionRows(peerSectorFlow, revisionSystem, [], 'No flow/peer rows available.');
  const resolvedLinkedRows = sectionRows(revisionSystem, peerSectorFlow, [], 'No linked system/news/revision rows available.');
  const eventRows: Row[] = [
    ...(depth?.calendar.macro ?? []).map((m) => ({
      label: `${m.date} ${m.impact}`,
      value: m.title,
      tone: m.impact === 'High' ? 'negative' : 'neutral',
    })),
    ...impactRows.map((i) => ({
      label: `${i.date} ${i.event}`,
      value: `${i.priceImpactPct >= 0 ? '+' : ''}${i.priceImpactPct.toFixed(2)}% / vol ${i.volShiftPct >= 0 ? '+' : ''}${i.volShiftPct.toFixed(2)}%`,
      tone: i.priceImpactPct >= 0 ? 'positive' : 'negative',
    })),
    ...state.headlines.map((h) => ({ label: 'HEADLINE', value: h, tone: 'accent' as Tone })),
  ];
  const peerRowsDense: Row[] = state.quotes
    .filter((q) => q.symbol !== active?.symbol)
    .map((q) => ({
      label: `${q.symbol} b${q.betaToSPX.toFixed(2)} c${q.corrToSPX.toFixed(2)} lq${q.liquidityScore}`,
      value: `${q.last.toFixed(q.last < 10 ? 4 : 2)} / ${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`,
      tone: q.pct >= 0 ? 'positive' : 'negative',
    }));
  const microRows: Row[] = [
    ...depthTelemetryRows,
    ...state.tape.map((t) => ({
      label: `${t.time} ${t.side}`,
      value: `${t.price.toFixed(2)} x ${t.size}${t.isSweep ? ' SWP' : ''}`,
      tone: t.side === 'BUY' ? 'positive' : 'negative',
    })),
    ...state.executionEvents.map((e) => ({
      label: `${e.symbol} ${e.status}`,
      value: `${e.fillQty}@${fmt(e.fillPrice, 2)}`,
      tone: 'accent',
    })),
  ];
  const stackBlocks: Array<{ id: string; title: string; rows: Row[]; reason?: string }> = [
    { id: 'focus', title: `${execMode} FOCUS`, rows: resolvedModeRows.rows, reason: resolvedModeRows.reason },
    { id: 'risk', title: 'RISK / HORIZON / REGIME', rows: horizonRowsDense.concat(resolvedRiskRows.rows), reason: resolvedRiskRows.reason },
    { id: 'micro', title: 'MICROSTRUCTURE', rows: microRows },
    { id: 'flow', title: 'FLOW / SECTOR / POSITIONING', rows: resolvedFlowRows.rows, reason: resolvedFlowRows.reason },
    { id: 'peer', title: 'PEER COMPARISON GRID', rows: peerRowsDense },
    { id: 'events', title: 'EVENT TIMELINE', rows: eventRows },
    { id: 'linked', title: 'LINKED REVISIONS / NEWS / SYSTEM', rows: resolvedLinkedRows.rows, reason: resolvedLinkedRows.reason },
  ];

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

      <div className={`${modePanelBand} flex-1 min-h-0 overflow-y-auto custom-scrollbar`}>
        <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">
          {execMode === 'ESC' ? 'ESC VERTICAL INTELLIGENCE STACK' : 'VERTICAL INTELLIGENCE STACK'}
        </div>
        <div className="p-1 border-b border-[#1a1a1a]">
          <svg viewBox={`0 0 ${chartW} ${svgH}`} preserveAspectRatio="none" className="w-full h-[96px]">
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
                  <rect x={x - bodyW / 2} y={yVol(b.volume)} width={bodyW} height={Math.max(1, svgH - yVol(b.volume))} fill={up ? '#1f5a41aa' : '#59243aaa'} />
                </g>
              );
            })}
            <polyline fill="none" stroke="#8cc7f3" strokeWidth="1.3" points={points(vwap, chartW, yPrice)} />
            <polyline fill="none" stroke="#f4cf6b" strokeWidth="1" points={points(ma9, chartW, yPrice)} />
            <polyline fill="none" stroke="#d18cff" strokeWidth="1" points={points(ma21, chartW, yPrice)} />
          </svg>
        </div>
        {stackBlocks.map((block) => (
          <div key={block.id} className="border-b border-[#1a1a1a]">
            <div className="h-4 px-1 border-b border-[#1a1a1a] text-[9px] text-[#9bc3e8] flex items-center">{block.title}</div>
            {block.rows.map((row, idx) => (
              <div key={`${block.id}-${row.label}-${idx}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_1fr] gap-1">
                <span className="text-[#93a9c6] truncate">{row.label}</span>
                <span className={`${toneClass[row.tone ?? 'neutral']} truncate text-right font-bold`}>{row.value}</span>
              </div>
            ))}
            {block.reason ? (
              <div className="text-[8px] px-1 py-[1px] text-[#7fa4c8]">CHAIN: {block.reason}</div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
