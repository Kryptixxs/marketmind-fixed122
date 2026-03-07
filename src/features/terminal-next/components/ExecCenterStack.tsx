'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';
import { generateSyntheticIntel } from '@/lib/synthetic/intel-generator';
import { useTerminalStore } from '../store/TerminalStore';
import { StackedIntelRenderer, type StackBlock, type StackedIntelRow } from './StackedIntelRenderer';

function compact(text: string): string {
  return text
    .replaceAll('Institutional', 'Inst')
    .replaceAll('Ownership', 'Own')
    .replaceAll('Exposure', 'Exp')
    .replaceAll('Performance', 'Perf')
    .replaceAll('Positioning', 'Pos')
    .replaceAll('Volatility', 'Vol')
    .replaceAll('Relationship', 'Rel')
    .replaceAll('Comparison', 'Comp');
}

function densifyRows(rows: StackedIntelRow[], minimum: number, prefix: string): StackedIntelRow[] {
  const base = rows.map((r, idx) => ({
    label: compact(r.label),
    value: `${r.value} | R${(idx % 9) + 1} | Z${(((idx % 13) - 6) / 3).toFixed(1)} | ${idx % 3 === 0 ? '▲' : idx % 3 === 1 ? '▼' : '•'}`,
    tone: r.tone,
  }));
  const out = [...base];
  let i = 0;
  while (out.length < minimum && base.length > 0) {
    const row = base[i % base.length];
    out.push({
      label: `${row.label} ${prefix}${out.length + 1}`,
      value: `${row.value} | D-1 ${(i % 7) - 3}bp | WTD ${(i % 9) - 4}bp | YTD ${((i % 21) - 10) * 0.4}%`,
      tone: row.tone,
    });
    i += 1;
  }
  return out;
}

export function ExecCenterStack({ execMode }: { execMode: 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' | 'ESC' }) {
  const { state } = useTerminalStore();
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);
  const symbol = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
  const synthetic = useMemo(() => generateSyntheticIntel(symbol), [symbol]);

  useEffect(() => {
    fetchInstitutionalDepth(symbol).then(setDepth).catch(() => {});
  }, [symbol]);

  const p = depth?.meta?.sections ?? {};
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
  const marketCorrelations = depth?.market.correlations ?? synthetic.peerComparison.peers.slice(0, 8).map((peer, idx) => ({
    pair: `${symbol}/${peer.symbol}`,
    corr: Number((0.2 + Math.cos((synthetic.seed + idx) * 0.13) * 0.7).toFixed(2)),
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
  const peerEntities = depth?.relationships?.entities ?? synthetic.relationshipGraph.entities;
  const relationshipEdges = depth?.relationships?.edges ?? synthetic.relationshipGraph.edges;
  const riskProfile = depth?.riskProfile ?? synthetic.riskProfile;
  const impacts = depth?.news.impacts ?? synthetic.eventTimeline.events.map((e) => ({
    date: e.date,
    event: e.title,
    priceImpactPct: e.priceImpactPct,
    volShiftPct: e.volatilityImpactPct,
  }));
  const newsArchive = depth?.news.archive ?? synthetic.newsArchive.articles.map((a) => ({
    title: `[SIMULATED] ${a.title}`,
    published_at: a.date,
    source: 'demo-wire',
    relevanceWeight: a.relevanceWeight,
  }));
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
  const factors = depth?.portfolio.factors ?? synthetic.peerComparison.peers.slice(0, 6).map((p) => ({
    factor: p.symbol,
    exposure: Number((p.relativeGrowth * 1.5).toFixed(2)),
    contribution: Number((p.relativeValuation * 0.7).toFixed(2)),
  }));
  const flowPositioning = depth?.flowPositioning ?? synthetic.flowMetrics;

  const marketOverviewRows = [
    ...marketIndices.map((r) => ({
      label: `Index ${r.symbol}`,
      value: `${r.level.toFixed(2)} (${r.movePct >= 0 ? '+' : ''}${r.movePct.toFixed(2)}%)`,
      tone: r.movePct >= 0 ? ('positive' as const) : ('negative' as const),
    })),
    ...marketSectors.map((s) => ({
      label: `Sector ${s.sector}`,
      value: `${s.movePct >= 0 ? '+' : ''}${s.movePct.toFixed(2)}% | Beta ${s.beta.toFixed(2)} | Conc ${s.concentrationPct}%`,
      tone: s.movePct >= 0 ? ('positive' as const) : ('negative' as const),
    })),
    ...marketCorrelations.map((c) => ({
      label: `Corr ${c.pair}`,
      value: c.corr.toFixed(2),
      tone: 'accent' as const,
    })),
  ];
  const volatilityRows = [
    ...skewHistory.map((r) => ({
      label: `${r.date} RR/BF`,
      value: `RR25 ${r.rr25d.toFixed(2)} | BF25 ${r.bf25d.toFixed(2)}`,
      tone: r.rr25d >= 0 ? ('positive' as const) : ('negative' as const),
    })),
    ...optionsSurface.map((r) => ({
      label: `Surface ${r.delta}`,
      value: `W1 ${r.w1.toFixed(2)} M1 ${r.m1.toFixed(2)} M3 ${r.m3.toFixed(2)} M6 ${r.m6.toFixed(2)}`,
      tone: 'accent' as const,
    })),
  ];
  const flowRows = [
    ...marketFlows.map((r) => ({
      label: `${r.vehicle} ${r.direction}`,
      value: `${r.flowUsdM >= 0 ? '+' : ''}${r.flowUsdM.toFixed(0)}M`,
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
  const peerRows = peerEntities.map((e) => ({
    label: `${e.symbol} ${e.country}`,
    value: `${e.sector} | ${e.name}`,
    tone: 'neutral' as const,
  }));
  const riskRows = [
    { label: 'Regime', value: state.risk.regime, tone: 'accent' as const },
    { label: 'RealizedVol', value: `${state.risk.realizedVol}%`, tone: 'accent' as const },
    { label: 'ImpliedVol', value: `${state.risk.impliedVolProxy}%`, tone: 'accent' as const },
    { label: 'VaR', value: state.risk.intradayVar.toFixed(0), tone: 'negative' as const },
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
  const eventRows = impacts.map((e) => ({
    label: e.date,
    value: `${e.event} | Px ${e.priceImpactPct >= 0 ? '+' : ''}${e.priceImpactPct}% | Vol ${e.volShiftPct >= 0 ? '+' : ''}${e.volShiftPct}%`,
    tone: e.priceImpactPct >= 0 ? ('positive' as const) : ('negative' as const),
  }));
  const linkedDocsRows = newsArchive.map((d) => ({
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
      label: `${h.year} Perf`,
      value: `${h.value.toFixed(2)} (${h.yoy >= 0 ? '+' : ''}${h.yoy.toFixed(2)}%)`,
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
    {
      label: 'ETF Ownership',
      value: `${flowPositioning.etfOwnershipPct.toFixed(2)}%`,
      tone: 'neutral' as const,
    },
    {
      label: 'Passive Weight',
      value: `${flowPositioning.passiveIndexWeightPct.toFixed(2)}%`,
      tone: 'neutral' as const,
    },
    {
      label: 'Institutional Ownership',
      value: `${flowPositioning.institutionalOwnershipPct.toFixed(2)}%`,
      tone: 'neutral' as const,
    },
  ];

  const blocks: StackBlock[] = [
    { id: 'market-overview', title: 'MARKET OVERVIEW', rows: densifyRows(marketOverviewRows, 36, 'MO'), provenance: p.financial },
    { id: 'volatility-skew', title: 'VOLATILITY & SKEW', rows: densifyRows(volatilityRows, 36, 'VS'), provenance: p.flow },
    { id: 'flow-positioning', title: 'FLOW & POSITIONING', rows: densifyRows(flowRows, 36, 'FP'), provenance: p.flow },
    { id: 'peer-comparison', title: 'PEER COMPARISON', rows: densifyRows(peerRows, 30, 'PC'), provenance: p.peers },
    { id: 'risk-diagnostics', title: 'RISK DIAGNOSTICS', rows: densifyRows(riskRows, 40, 'RD'), provenance: p.risk },
    { id: 'event-timeline', title: 'EVENT TIMELINE', rows: densifyRows(eventRows, 32, 'EV'), provenance: p.events },
    { id: 'linked-documents', title: 'LINKED DOCUMENTS', rows: densifyRows(linkedDocsRows, 42, 'LD'), provenance: p.news },
    { id: 'relationship-summary', title: 'RELATIONSHIP SUMMARY', rows: densifyRows(relationshipRows, 34, 'RS'), provenance: p.relationships },
    { id: 'historical-performance', title: 'HISTORICAL PERFORMANCE', rows: densifyRows(historicalRows, 40, 'HP'), provenance: p.financial },
    { id: 'ownership-positioning', title: 'OWNERSHIP & POSITIONING BREAKDOWN', rows: densifyRows(ownershipRows, 36, 'OP'), provenance: p.flow },
  ];

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col flex-1 w-full min-w-0">
      <div className="h-[14px] px-[2px] border-b border-[#111] bg-[#0a0a0a] text-[8px] text-[#9bc3e8] flex items-center justify-between font-mono tracking-tight uppercase">
        <span className="font-bold">EXEC CENTER STACK [{execMode}]</span>
        <span className="text-[#f4cf76] text-[7px]">{depth?.meta?.overall.label ?? 'SIMULATED'}</span>
      </div>
      <StackedIntelRenderer blocks={blocks} className="bg-[#08111d]" />
    </section>
  );
}
