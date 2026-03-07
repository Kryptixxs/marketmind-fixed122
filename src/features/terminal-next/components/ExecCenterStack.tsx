'use client';

import { useEffect, useState } from 'react';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';
import { useTerminalStore } from '../store/TerminalStore';
import { StackedIntelRenderer, type StackBlock } from './StackedIntelRenderer';

export function ExecCenterStack({ execMode }: { execMode: 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' | 'ESC' }) {
  const { state } = useTerminalStore();
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);

  useEffect(() => {
    const symbol = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchInstitutionalDepth(symbol).then(setDepth).catch(() => {});
  }, [state.activeSymbol]);

  const p = depth?.meta?.sections ?? {};
  const microRows = state.orderBook.flatMap((lvl, idx) => [
    { label: `L${idx + 1} BID`, value: `${lvl.bid.toFixed(2)} x ${lvl.bidSize}`, tone: 'positive' as const },
    { label: `L${idx + 1} ASK`, value: `${lvl.ask.toFixed(2)} x ${lvl.askSize}`, tone: 'negative' as const },
  ]);
  const tapeRows = state.tape.map((t) => ({
    label: `${t.time} ${t.side}`,
    value: `${t.price.toFixed(2)} x ${t.size}${t.isSweep ? ' SWP' : ''}`,
    tone: t.side === 'BUY' ? ('positive' as const) : ('negative' as const),
  }));
  const executionRows = state.executionEvents.map((e) => ({
    label: `${e.symbol} ${e.status}`,
    value: `${e.fillQty}@${e.fillPrice.toFixed(2)} ${e.source}`,
    tone: 'accent' as const,
  }));
  const systemRows = [...state.systemFeed, ...state.headlines, ...state.alerts].map((line, idx) => ({
    label: `SYS ${idx + 1}`,
    value: line,
    tone: line.includes('ALERT') || line.includes('SWEEP') ? ('negative' as const) : ('neutral' as const),
  }));

  const blocks: StackBlock[] = [
    { id: 'price', title: `PRICE / MARKET [${execMode}]`, rows: (depth?.market.indices ?? []).map((r) => ({ label: r.symbol, value: `${r.level.toFixed(2)} (${r.movePct >= 0 ? '+' : ''}${r.movePct.toFixed(2)}%)`, tone: r.movePct >= 0 ? 'positive' : 'negative' })), provenance: p.financial },
    { id: 'vol', title: 'VOLATILITY & SKEW', rows: (depth?.options.surface ?? []).map((r) => ({ label: r.delta, value: `W1 ${r.w1} M1 ${r.m1} M3 ${r.m3} M6 ${r.m6}`, tone: 'accent' })), provenance: p.flow },
    { id: 'flow', title: 'FLOW & POSITIONING', rows: (depth?.market.flows ?? []).map((r) => ({ label: `${r.vehicle} ${r.direction}`, value: `${r.flowUsdM >= 0 ? '+' : ''}${r.flowUsdM}M`, tone: r.direction === 'Inflow' ? 'positive' : 'negative' })), provenance: p.flow },
    { id: 'peer', title: 'PEER COMPARISON', rows: (depth?.relationships?.entities ?? []).slice(1).map((e) => ({ label: `${e.symbol} ${e.country}`, value: e.sector, tone: 'neutral' })), provenance: p.peers },
    { id: 'risk', title: 'RISK DIAGNOSTICS', rows: [{ label: 'Regime', value: state.risk.regime }, { label: 'RealizedVol', value: `${state.risk.realizedVol}%`, tone: 'accent' }, { label: 'ImpliedVol', value: `${state.risk.impliedVolProxy}%`, tone: 'accent' }, { label: 'VaR', value: state.risk.intradayVar.toFixed(0), tone: 'negative' }], provenance: p.risk },
    { id: 'micro', title: 'MICROSTRUCTURE LADDER', rows: microRows },
    { id: 'tape', title: 'TIME & SALES STREAM', rows: tapeRows },
    { id: 'exec', title: 'EXECUTION EVENTS', rows: executionRows },
    { id: 'events', title: 'EVENT TIMELINE', rows: (depth?.news.impacts ?? []).map((e) => ({ label: e.date, value: `${e.event} | Px ${e.priceImpactPct}% Vol ${e.volShiftPct}%`, tone: e.priceImpactPct >= 0 ? 'positive' : 'negative' })), provenance: p.events },
    { id: 'docs', title: 'LINKED DOCUMENTS', rows: (depth?.news.archive ?? []).map((d) => ({ label: `${d.published_at} ${d.source}`, value: d.title, tone: d.title.includes('[SIMULATED]') ? 'accent' : 'neutral' })), provenance: p.news },
    { id: 'rel', title: 'RELATIONSHIP SUMMARY', rows: (depth?.relationships?.edges ?? []).map((e) => ({ label: `${e.relationshipType} ${e.weight.toFixed(2)}`, value: `${e.fromId.slice(0, 8)} -> ${e.toId.slice(0, 8)}` })), provenance: p.relationships },
    { id: 'sys', title: 'SYSTEM / ALERT / NEWS TRACE', rows: systemRows },
  ];

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col h-full">
      <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#9bc3e8] flex items-center justify-between">
        <span className="font-bold">EXEC CENTER STACK [{execMode}]</span>
        <span className="text-[#f4cf76] text-[9px]">{depth?.meta?.overall.label ?? 'SIMULATED'}</span>
      </div>
      <StackedIntelRenderer blocks={blocks} className="bg-[#08111d]" />
    </section>
  );
}
