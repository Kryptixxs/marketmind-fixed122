'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';
import type { StackBlock, StackedIntelRow } from '../StackedIntelRenderer';
import { StackedIntelRenderer } from '../StackedIntelRenderer';
import { useTerminalStore } from '../../store/TerminalStore';

type ModuleVariant = 'FA' | 'HP' | 'WEI' | 'YAS' | 'OVME' | 'PORT' | 'INTEL' | 'NEWS' | 'CAL' | 'SEC' | 'MKT';

function fmt(v: number, d = 2) {
  return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function withMinimumRows(rows: StackedIntelRow[], minimum: number, labelPrefix: string): StackedIntelRow[] {
  if (rows.length >= minimum) return rows;
  const out = [...rows];
  while (out.length < minimum) {
    out.push({
      label: `${labelPrefix} ${out.length + 1}`,
      value: 'SIMULATED DATA STANDBY',
      tone: 'accent',
    });
  }
  return out;
}

function variantRows(variant: ModuleVariant, depth: InstitutionalDepth | null) {
  if (!depth) return [];
  if (variant === 'FA') {
    return depth.financial.statement20y.map((p) => ({ label: `${p.year} Rev/NI`, value: `${fmt(p.revenue, 0)} / ${fmt(p.netIncome, 0)}`, tone: p.netIncome >= 0 ? ('positive' as const) : ('negative' as const) }));
  }
  if (variant === 'HP') {
    return depth.historical.history20y.map((p) => ({ label: `${p.year}`, value: `${fmt(p.value, 2)} (${p.yoy >= 0 ? '+' : ''}${p.yoy.toFixed(2)}%)`, tone: p.yoy >= 0 ? ('positive' as const) : ('negative' as const) }));
  }
  if (variant === 'WEI') {
    return depth.earnings.revisionsTimeline.map((e) => ({ label: `${e.date}`, value: `EPS ${e.epsDeltaPct >= 0 ? '+' : ''}${e.epsDeltaPct}% | REV ${e.revDeltaPct >= 0 ? '+' : ''}${e.revDeltaPct}%`, tone: e.epsDeltaPct >= 0 ? ('positive' as const) : ('negative' as const) }));
  }
  if (variant === 'YAS') {
    return depth.bond.curve.map((r) => ({ label: `${r.tenor}`, value: `Yld ${r.yld.toFixed(3)} | OAS ${r.oas.toFixed(1)} | Z ${r.zSpread.toFixed(1)}`, tone: 'accent' as const }));
  }
  if (variant === 'OVME') {
    return depth.options.surface.map((r) => ({ label: `${r.delta}`, value: `W1 ${r.w1} / M1 ${r.m1} / M3 ${r.m3} / M6 ${r.m6}`, tone: 'accent' as const }));
  }
  if (variant === 'PORT') {
    return depth.portfolio.exposures.map((r) => ({ label: r.bucket, value: `G ${r.gross}% | N ${r.net}% | B ${r.betaAdj}%`, tone: 'neutral' as const }));
  }
  if (variant === 'INTEL') {
    return (depth.relationships?.edges ?? []).map((r) => ({ label: `${r.relationshipType} w${r.weight.toFixed(2)}`, value: `${r.fromId.slice(0, 8)} -> ${r.toId.slice(0, 8)}`, tone: 'neutral' as const }));
  }
  if (variant === 'NEWS') {
    return depth.news.archive.map((r) => ({ label: `${r.published_at} ${r.source}`, value: r.title, tone: r.title.includes('[SIMULATED]') ? ('accent' as const) : ('neutral' as const) }));
  }
  if (variant === 'CAL') {
    return depth.calendar.catalysts.map((r) => ({ label: `${r.date} ${r.type}`, value: r.title, tone: 'neutral' as const }));
  }
  if (variant === 'SEC') {
    return depth.sec.filings.map((r) => ({ label: `${r.filed} ${r.form}`, value: r.description, tone: 'neutral' as const }));
  }
  return depth.market.indices.map((r) => ({ label: r.symbol, value: `${fmt(r.level, 2)} (${r.movePct >= 0 ? '+' : ''}${r.movePct.toFixed(2)}%)`, tone: r.movePct >= 0 ? ('positive' as const) : ('negative' as const) }));
}

export function StandardIntelligenceModule({ code, title }: { code: ModuleVariant; title: string }) {
  const { state } = useTerminalStore();
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchInstitutionalDepth(sym).then(setDepth).catch(() => {});
  }, [state.activeSymbol]);

  const primaryRows = useMemo(() => withMinimumRows(variantRows(code, depth), 18, `${code} ROW`), [code, depth]);
  const blockProv = depth?.meta?.sections ?? {};
  const ladderRows = withMinimumRows(state.orderBook.flatMap((lvl, idx) => [
    { label: `L${idx + 1} BID`, value: `${lvl.bid.toFixed(2)} x ${lvl.bidSize}`, tone: 'positive' as const },
    { label: `L${idx + 1} ASK`, value: `${lvl.ask.toFixed(2)} x ${lvl.askSize}`, tone: 'negative' as const },
  ]), 28, 'LADDER');
  const tapeRows = withMinimumRows(state.tape.map((t) => ({
    label: `${t.time} ${t.side}`,
    value: `${t.price.toFixed(2)} x ${t.size}${t.isSweep ? ' SWP' : ''}`,
    tone: t.side === 'BUY' ? ('positive' as const) : ('negative' as const),
  })), 24, 'TAPE');
  const executionRows = withMinimumRows(state.executionEvents.map((e) => ({
    label: `${e.symbol} ${e.status}`,
    value: `${e.fillQty}@${fmt(e.fillPrice, 2)} ${e.source}`,
    tone: 'accent' as const,
  })), 18, 'EXEC');
  const telemetryRows = withMinimumRows([...state.systemFeed, ...state.headlines, ...state.alerts].map((line, idx) => ({
    label: `TRACE ${idx + 1}`,
    value: line,
    tone: line.includes('ALERT') || line.includes('SWEEP') ? ('negative' as const) : ('neutral' as const),
  })), 40, 'TRACE');
  const quoteRows = withMinimumRows(state.quotes.map((q) => ({
    label: `${q.symbol} LQ ${q.liquidityScore} B ${q.betaToSPX.toFixed(2)}`,
    value: `${fmt(q.last, q.last < 10 ? 4 : 2)} / ${q.pct >= 0 ? '+' : ''}${q.pct.toFixed(2)}%`,
    tone: q.pct >= 0 ? ('positive' as const) : ('negative' as const),
  })), 36, 'QUOTE');

  const blocks: StackBlock[] = [
    { id: `${code}-primary`, title: `${code} PRIMARY DATASET`, rows: primaryRows, provenance: blockProv.financial },
    {
      id: `${code}-vol`,
      title: 'VOLATILITY & SKEW',
      rows: withMinimumRows((depth?.options.skewHistory ?? []).map((r) => ({
        label: r.date,
        value: `RR25 ${r.rr25d.toFixed(2)} | BF25 ${r.bf25d.toFixed(2)}`,
        tone: r.rr25d >= 0 ? ('positive' as const) : ('negative' as const),
      })), 24, 'VOL'),
      provenance: blockProv.flow,
    },
    {
      id: `${code}-flow`,
      title: 'FLOW & POSITIONING',
      rows: withMinimumRows((depth?.market.flows ?? []).map((r) => ({
        label: `${r.vehicle} ${r.direction}`,
        value: `${r.flowUsdM >= 0 ? '+' : ''}$${r.flowUsdM.toFixed(0)}M`,
        tone: r.direction === 'Inflow' ? ('positive' as const) : ('negative' as const),
      })), 16, 'FLOW'),
      provenance: blockProv.flow,
    },
    {
      id: `${code}-peers`,
      title: 'PEER COMPARISON',
      rows: withMinimumRows((depth?.relationships?.entities ?? []).slice(1).map((e) => ({
        label: `${e.symbol} ${e.sector}`,
        value: `${e.name} | ${e.country}`,
        tone: 'neutral' as const,
      })), 12, 'PEER'),
      provenance: blockProv.peers,
    },
    {
      id: `${code}-risk`,
      title: 'RISK DIAGNOSTICS',
      rows: [
        { label: 'RealizedVol', value: `${state.risk.realizedVol}%`, tone: 'accent' as const },
        { label: 'ImpliedVol', value: `${state.risk.impliedVolProxy}%`, tone: 'accent' as const },
        { label: 'Beta', value: `${state.risk.beta}`, tone: 'neutral' as const },
        { label: 'Regime', value: state.risk.regime, tone: 'neutral' as const },
        { label: 'VaR', value: fmt(state.risk.intradayVar, 0), tone: 'negative' as const },
      ],
      provenance: blockProv.risk,
    },
    {
      id: `${code}-events`,
      title: 'EVENT TIMELINE',
      rows: withMinimumRows((depth?.news.impacts ?? []).map((e) => ({
        label: `${e.date}`,
        value: `${e.event} | Px ${e.priceImpactPct >= 0 ? '+' : ''}${e.priceImpactPct}% | Vol ${e.volShiftPct >= 0 ? '+' : ''}${e.volShiftPct}%`,
        tone: e.priceImpactPct >= 0 ? ('positive' as const) : ('negative' as const),
      })), 20, 'EVENT'),
      provenance: blockProv.events,
    },
    {
      id: `${code}-docs`,
      title: 'LINKED DOCUMENTS',
      rows: withMinimumRows((depth?.news.archive ?? []).map((d) => ({
        label: `${d.published_at} ${d.source}`,
        value: d.title,
        tone: d.title.includes('[SIMULATED]') ? ('accent' as const) : ('neutral' as const),
      })), 24, 'DOC'),
      provenance: blockProv.news,
    },
    {
      id: `${code}-relationships`,
      title: 'RELATIONSHIP SUMMARY',
      rows: withMinimumRows((depth?.relationships?.edges ?? []).map((e) => ({
        label: `${e.relationshipType} w${e.weight.toFixed(2)}`,
        value: `${e.fromId.slice(0, 8)} -> ${e.toId.slice(0, 8)}`,
        tone: 'neutral' as const,
      })), 16, 'REL'),
      provenance: blockProv.relationships,
    },
    { id: `${code}-ladder`, title: 'DEPTH LADDER TRACE', rows: ladderRows },
    { id: `${code}-tape`, title: 'TIME & SALES TRACE', rows: tapeRows },
    { id: `${code}-execution`, title: 'EXECUTION TRACE', rows: executionRows },
    { id: `${code}-quotes`, title: 'CROSS-ASSET QUOTE TRACE', rows: quoteRows },
    { id: `${code}-telemetry`, title: 'SYSTEM / ALERT / NEWS TRACE', rows: telemetryRows },
  ];

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col h-full">
      <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] flex items-center justify-between">
        <span className="text-[#9bc3e8] font-bold">{title}</span>
        <span className="text-[#f4cf76] text-[9px]">{depth?.meta?.overall.label ?? 'SIMULATED'}</span>
      </div>
      <StackedIntelRenderer blocks={blocks} className="bg-[#08111d]" />
    </section>
  );
}
