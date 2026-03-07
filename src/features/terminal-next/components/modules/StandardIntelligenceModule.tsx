'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';
import { generateSyntheticIntel } from '@/lib/synthetic/intel-generator';
import type { StackBlock } from '../StackedIntelRenderer';
import { StackedIntelRenderer } from '../StackedIntelRenderer';
import { useTerminalStore } from '../../store/TerminalStore';

type ModuleVariant = 'FA' | 'HP' | 'WEI' | 'YAS' | 'OVME' | 'PORT' | 'INTEL' | 'NEWS' | 'CAL' | 'SEC' | 'MKT';

function fmt(v: number, d = 2) {
  return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
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
  const symbol = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
  const synthetic = useMemo(() => generateSyntheticIntel(symbol), [symbol]);

  useEffect(() => {
    fetchInstitutionalDepth(symbol).then(setDepth).catch(() => {});
  }, [symbol]);

  const primaryRows = useMemo(() => variantRows(code, depth), [code, depth]);
  const blockProv = depth?.meta?.sections ?? {};
  const marketIndices = depth?.market.indices ?? synthetic.peerComparison.peers.map((peer, idx) => ({
    symbol: peer.symbol,
    level: Number((100 + peer.relativeValuation * 18 + idx * 3.1).toFixed(2)),
    movePct: Number((peer.relativeGrowth * 2.2).toFixed(2)),
    volumeM: Number((95 + idx * 7.4).toFixed(2)),
  }));
  const marketSectors = depth?.market.sectors ?? synthetic.relationshipGraph.entities.slice(0, 12).map((e, idx) => ({
    sector: e.sector,
    movePct: Number((Math.sin((idx + synthetic.seed) * 0.2) * 1.8).toFixed(2)),
    beta: Number((0.7 + (idx % 5) * 0.12).toFixed(2)),
    concentrationPct: 4 + (idx % 9) * 3,
  }));
  const skewHistory = depth?.options.skewHistory ?? synthetic.eventTimeline.events.map((e, idx) => ({
    date: e.date,
    rr25d: Number((e.priceImpactPct * 0.6).toFixed(2)),
    bf25d: Number((Math.abs(e.volatilityImpactPct) * 0.2 + (idx % 4) * 0.1).toFixed(2)),
  }));
  const optionsSurface = depth?.options.surface ?? ['10D', '25D', '50D', '75D', '90D'].map((delta, idx) => ({
    delta,
    w1: 16 + idx * 1.1,
    m1: 17 + idx * 1.05,
    m3: 18 + idx * 0.96,
    m6: 19 + idx * 0.9,
  }));
  const marketFlows = depth?.market.flows ?? synthetic.peerComparison.peers.slice(0, 10).map((peer, idx) => ({
    vehicle: peer.symbol,
    flowUsdM: Number((peer.relativeGrowth * 420 + idx * 21).toFixed(0)),
    direction: peer.relativeGrowth >= 0 ? ('Inflow' as const) : ('Outflow' as const),
  }));
  const shortTrend = depth?.flowPositioning.shortInterestTrend ?? synthetic.flowMetrics.shortInterestTrend;
  const factors = depth?.portfolio.factors ?? synthetic.peerComparison.peers.slice(0, 6).map((p) => ({
    factor: p.symbol,
    exposure: Number((p.relativeGrowth * 1.5).toFixed(2)),
    contribution: Number((p.relativeValuation * 0.7).toFixed(2)),
  }));
  const peersData = depth?.relationships?.entities ?? synthetic.relationshipGraph.entities;
  const riskProfile = depth?.riskProfile ?? synthetic.riskProfile;
  const eventImpacts = depth?.news.impacts ?? synthetic.eventTimeline.events.map((e) => ({
    date: e.date,
    event: e.title,
    priceImpactPct: e.priceImpactPct,
    volShiftPct: e.volatilityImpactPct,
  }));
  const archive = depth?.news.archive ?? synthetic.newsArchive.articles.map((a) => ({
    title: `[SIMULATED] ${a.title}`,
    published_at: a.date,
    source: 'demo-wire',
    relevanceWeight: a.relevanceWeight,
  }));
  const relationshipEdges = depth?.relationships?.edges ?? synthetic.relationshipGraph.edges;
  const historicalSeries = depth?.historical.history20y ?? synthetic.financialHistory.points.map((p) => ({
    year: p.year,
    value: p.revenue,
    yoy: p.yoyRevenuePct,
  }));
  const historicalCrises = depth?.historical.crises ?? [
    { period: 'Synthetic Stress 1', drawdownPct: -31, recoveryMonths: 9, volShiftPct: 84 },
    { period: 'Synthetic Stress 2', drawdownPct: -22, recoveryMonths: 7, volShiftPct: 63 },
  ];
  const historicalEvents = depth?.historical.eventMarkers ?? synthetic.eventTimeline.events.map((e) => ({
    date: e.date,
    event: e.title,
    impactPct: e.priceImpactPct,
  }));
  const secHolders = depth?.sec.holders ?? synthetic.peerComparison.peers.slice(0, 8).map((p, idx) => ({
    holder: `Holder ${idx + 1}`,
    shares: 100_000_000 + idx * 12_500_000,
    pctOut: Number((1.2 + idx * 0.55).toFixed(2)),
    changePct: Number((Math.sin((synthetic.seed + idx) * 0.2) * 0.9).toFixed(2)),
  }));
  const secInsider = depth?.sec.insider ?? synthetic.eventTimeline.events.slice(0, 40).map((e, idx) => ({
    insider: idx % 2 === 0 ? 'Director' : 'Officer',
    side: idx % 3 === 0 ? ('Sell' as const) : ('Buy' as const),
    shares: 5_000 + idx * 275,
    price: Number((85 + idx * 1.3).toFixed(2)),
    date: e.date,
  }));
  const exposures = depth?.portfolio.exposures ?? synthetic.peerComparison.peers.slice(0, 6).map((p, idx) => ({
    bucket: `${p.symbol} Exposure`,
    gross: 8 + idx * 4,
    net: 4 + idx * 2,
    betaAdj: 3 + idx,
  }));
  const flowPositioning = depth?.flowPositioning ?? synthetic.flowMetrics;
  const marketOverviewRows = [
    ...primaryRows,
    ...marketIndices.map((r) => ({
      label: `Index ${r.symbol}`,
      value: `${fmt(r.level, 2)} (${r.movePct >= 0 ? '+' : ''}${r.movePct.toFixed(2)}%)`,
      tone: r.movePct >= 0 ? ('positive' as const) : ('negative' as const),
    })),
    ...marketSectors.map((s) => ({
      label: `Sector ${s.sector}`,
      value: `${s.movePct >= 0 ? '+' : ''}${s.movePct.toFixed(2)}% | Beta ${s.beta.toFixed(2)}`,
      tone: s.movePct >= 0 ? ('positive' as const) : ('negative' as const),
    })),
  ];
  const volatilityRows = [
    ...skewHistory.map((r) => ({
      label: r.date,
      value: `RR25 ${r.rr25d.toFixed(2)} | BF25 ${r.bf25d.toFixed(2)}`,
      tone: r.rr25d >= 0 ? ('positive' as const) : ('negative' as const),
    })),
    ...optionsSurface.map((r) => ({
      label: `Surface ${r.delta}`,
      value: `W1 ${r.w1.toFixed(2)} | M1 ${r.m1.toFixed(2)} | M3 ${r.m3.toFixed(2)} | M6 ${r.m6.toFixed(2)}`,
      tone: 'accent' as const,
    })),
  ];
  const flowRows = [
    ...marketFlows.map((r) => ({
      label: `${r.vehicle} ${r.direction}`,
      value: `${r.flowUsdM >= 0 ? '+' : ''}$${r.flowUsdM.toFixed(0)}M`,
      tone: r.direction === 'Inflow' ? ('positive' as const) : ('negative' as const),
    })),
    ...shortTrend.map((r) => ({
      label: `Short ${r.date}`,
      value: `${r.shortPctFloat.toFixed(2)}%`,
      tone: 'accent' as const,
    })),
    ...factors.map((f) => ({
      label: `Factor ${f.factor}`,
      value: `Exp ${f.exposure.toFixed(2)} | Ctb ${f.contribution.toFixed(2)}`,
      tone: f.contribution >= 0 ? ('positive' as const) : ('negative' as const),
    })),
  ];
  const peersRows = peersData.map((e) => ({
    label: `${e.symbol} ${e.sector}`,
    value: `${e.name} | ${e.country}`,
    tone: 'neutral' as const,
  }));
  const riskRows = [
    { label: 'RealizedVol', value: `${state.risk.realizedVol}%`, tone: 'accent' as const },
    { label: 'ImpliedVol', value: `${state.risk.impliedVolProxy}%`, tone: 'accent' as const },
    { label: 'Beta', value: `${state.risk.beta}`, tone: 'neutral' as const },
    { label: 'Regime', value: state.risk.regime, tone: 'neutral' as const },
    { label: 'VaR', value: fmt(state.risk.intradayVar, 0), tone: 'negative' as const },
    ...riskProfile.debtMaturityLadder.map((d) => ({
      label: `Debt ${d.bucket}`,
      value: `${d.amount.toFixed(0)} | ${d.pctOfDebt.toFixed(2)}%`,
      tone: 'neutral' as const,
    })),
    ...riskProfile.interestCoverageTrend.map((r) => ({
      label: `Coverage ${r.year}`,
      value: `${r.ratio.toFixed(2)}x`,
      tone: r.ratio >= 3 ? ('positive' as const) : ('negative' as const),
    })),
    ...riskProfile.countryRevenuePct.map((r) => ({
      label: `Country ${r.country}`,
      value: `${r.pct.toFixed(2)}%`,
      tone: 'neutral' as const,
    })),
    ...riskProfile.fxExposurePct.map((r) => ({
      label: `FX ${r.currency}`,
      value: `${r.pct.toFixed(2)}%`,
      tone: 'neutral' as const,
    })),
  ];
  const eventRows = eventImpacts.map((e) => ({
    label: `${e.date}`,
    value: `${e.event} | Px ${e.priceImpactPct >= 0 ? '+' : ''}${e.priceImpactPct}% | Vol ${e.volShiftPct >= 0 ? '+' : ''}${e.volShiftPct}%`,
    tone: e.priceImpactPct >= 0 ? ('positive' as const) : ('negative' as const),
  }));
  const docsRows = archive.map((d) => ({
    label: `${d.published_at} ${d.source}`,
    value: `${d.title} [Relevance ${(d.relevanceWeight * 100).toFixed(0)}]`,
    tone: 'neutral' as const,
  }));
  const relationshipRows = relationshipEdges.map((e) => ({
    label: `${e.relationshipType} w${e.weight.toFixed(2)}`,
    value: `${e.fromId.slice(0, 8)} -> ${e.toId.slice(0, 8)}`,
    tone: 'neutral' as const,
  }));
  const historicalRows = [
    ...historicalSeries.map((h) => ({
      label: `${h.year}`,
      value: `${fmt(h.value, 2)} (${h.yoy >= 0 ? '+' : ''}${h.yoy.toFixed(2)}%)`,
      tone: h.yoy >= 0 ? ('positive' as const) : ('negative' as const),
    })),
    ...historicalCrises.map((c) => ({
      label: c.period,
      value: `DD ${c.drawdownPct}% | Rec ${c.recoveryMonths}m | Vol ${c.volShiftPct}%`,
      tone: 'negative' as const,
    })),
    ...historicalEvents.map((e) => ({
      label: e.date,
      value: `${e.event} | ${e.impactPct >= 0 ? '+' : ''}${e.impactPct}%`,
      tone: e.impactPct >= 0 ? ('positive' as const) : ('negative' as const),
    })),
  ];
  const ownershipRows = [
    ...secHolders.map((h) => ({
      label: `Holder ${h.holder}`,
      value: `${h.pctOut.toFixed(2)}% | Δ ${h.changePct >= 0 ? '+' : ''}${h.changePct.toFixed(2)}%`,
      tone: h.changePct >= 0 ? ('positive' as const) : ('negative' as const),
    })),
    ...secInsider.map((i) => ({
      label: `${i.date} ${i.insider}`,
      value: `${i.side} ${i.shares.toLocaleString()} @ ${i.price.toFixed(2)}`,
      tone: i.side === 'Buy' ? ('positive' as const) : ('negative' as const),
    })),
    ...exposures.map((e) => ({
      label: `Exposure ${e.bucket}`,
      value: `G ${e.gross}% | N ${e.net}% | B ${e.betaAdj}%`,
      tone: 'accent' as const,
    })),
    { label: 'ETF Ownership', value: `${flowPositioning.etfOwnershipPct.toFixed(2)}%`, tone: 'neutral' as const },
    { label: 'Passive Weight', value: `${flowPositioning.passiveIndexWeightPct.toFixed(2)}%`, tone: 'neutral' as const },
    { label: 'Institutional Ownership', value: `${flowPositioning.institutionalOwnershipPct.toFixed(2)}%`, tone: 'neutral' as const },
  ];

  const blocks: StackBlock[] = [
    { id: `${code}-market-overview`, title: 'MARKET OVERVIEW', rows: marketOverviewRows, provenance: blockProv.financial },
    { id: `${code}-volatility-skew`, title: 'VOLATILITY & SKEW', rows: volatilityRows, provenance: blockProv.flow },
    { id: `${code}-flow-positioning`, title: 'FLOW & POSITIONING', rows: flowRows, provenance: blockProv.flow },
    { id: `${code}-peer-comparison`, title: 'PEER COMPARISON', rows: peersRows, provenance: blockProv.peers },
    { id: `${code}-risk-diagnostics`, title: 'RISK DIAGNOSTICS', rows: riskRows, provenance: blockProv.risk },
    { id: `${code}-event-timeline`, title: 'EVENT TIMELINE', rows: eventRows, provenance: blockProv.events },
    { id: `${code}-linked-documents`, title: 'LINKED DOCUMENTS', rows: docsRows, provenance: blockProv.news },
    { id: `${code}-relationship-summary`, title: 'RELATIONSHIP SUMMARY', rows: relationshipRows, provenance: blockProv.relationships },
    { id: `${code}-historical-performance`, title: 'HISTORICAL PERFORMANCE', rows: historicalRows, provenance: blockProv.financial },
    { id: `${code}-ownership-positioning`, title: 'OWNERSHIP & POSITIONING BREAKDOWN', rows: ownershipRows, provenance: blockProv.flow },
  ];

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col flex-1">
      <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] flex items-center justify-between">
        <span className="text-[#9bc3e8] font-bold">{title}</span>
        <span className="text-[#f4cf76] text-[9px]">{depth?.meta?.overall.label ?? 'SIMULATED'}</span>
      </div>
      <StackedIntelRenderer blocks={blocks} className="bg-[#08111d]" />
    </section>
  );
}
