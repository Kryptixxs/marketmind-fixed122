'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';
import { fetchSupplyChain } from '@/app/actions/fetchSupplyChain';
import { fetchEntityIntel } from '@/app/actions/fetchEntityIntel';
import type { SupplyChainData } from '@/lib/supply-chain-data';
import type { IntelligenceEnvelope } from '@/lib/intelligence-contract';
import { emptyIntelligenceEnvelope } from '@/lib/intelligence-contract';

const TABS = ['Overview', 'Capital Structure', 'Supply Chain', 'Ratings', 'Corporate Actions'];

function fmtNum(v: number, d = 2) {
  return v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function buildLongHistory(seedSeries: number[], years: number) {
  const out: Array<{ year: number; value: number; yoy: number }> = [];
  const now = new Date().getFullYear();
  for (let i = years - 1; i >= 0; i -= 1) {
    const y = now - i;
    const base = seedSeries[(years - 1 - i) % seedSeries.length] ?? seedSeries[0] ?? 100;
    const trend = 1 + ((years - 1 - i) * 0.03);
    const val = base * trend;
    const prev = out[out.length - 1]?.value ?? val / 1.04;
    const yoy = prev !== 0 ? ((val - prev) / prev) * 100 : 0;
    out.push({ year: y, value: val, yoy });
  }
  return out;
}

export function DescriptionModule() {
  const { state, dispatch } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Overview';
  const [supplyChain, setSupplyChain] = useState<SupplyChainData | null>(null);
  const [entityNews, setEntityNews] = useState<string[]>([]);
  const [envelope, setEnvelope] = useState<IntelligenceEnvelope>(emptyIntelligenceEnvelope());

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || '';
    if (!sym) return;
    fetchSupplyChain(sym).then(setSupplyChain);
  }, [state.activeSymbol]);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || '';
    if (!sym) return;
    fetchEntityIntel(sym).then((res) => {
      setEntityNews(res.news ?? []);
      setEnvelope(res.envelope ?? emptyIntelligenceEnvelope());
    });
  }, [state.activeSymbol]);

  const activeQuote = state.quotes.find((q) => q.symbol === state.activeSymbol) ?? state.quotes[0];

  const peerSet = useMemo(() => {
    const sameSector = state.quotes.filter((q) => {
      const p = state.referenceBySymbol[q.symbol];
      return p?.sector === ref?.sector && q.symbol !== state.activeSymbol;
    });
    return sameSector.length > 0 ? sameSector : state.quotes.filter((q) => q.symbol !== state.activeSymbol);
  }, [state.quotes, state.referenceBySymbol, ref?.sector, state.activeSymbol]);

  const bars = ref?.dailyBars ?? [];
  const closes = bars.map((b) => b.close);
  const longMktCap = buildLongHistory(closes.length ? closes : [ref?.marketCapBn ?? 100], 10);
  const longFloat = buildLongHistory(closes.length ? closes.map((v) => v * 0.28) : [ref?.floatBn ?? 20], 10);
  const longShares = buildLongHistory(closes.length ? closes.map((v) => v * 0.12) : [12], 10);
  const revGeo = [
    { region: 'US', pct: ref?.country === 'US' ? 54 : 22 },
    { region: 'EU', pct: 18 },
    { region: 'APAC', pct: 21 },
    { region: 'LATAM', pct: 4 },
    { region: 'MEA', pct: 3 },
  ];
  const countryExposure = [
    { country: 'US', exposure: ref?.country === 'US' ? 62 : 28 },
    { country: 'UK', exposure: supplyChain?.customers.some((c) => c.name.includes('NHS')) ? 14 : 6 },
    { country: 'Germany', exposure: 8 },
    { country: 'Japan', exposure: 7 },
    { country: 'China', exposure: 5 },
    { country: 'Russia', exposure: state.intelFilters?.country?.toUpperCase() === 'RUSSIA' ? 3 : 1 },
  ];
  const ownership = [
    ['Institutional', `${(72 + (state.tick % 8)).toFixed(1)}%`],
    ['Retail', `${(19 + (state.tick % 5)).toFixed(1)}%`],
    ['Insider', `${(4 + ((state.tick % 20) / 10)).toFixed(1)}%`],
    ['Sovereign', `${(2 + ((state.tick % 7) / 10)).toFixed(1)}%`],
    ['Passive Index', `${(39 + (state.tick % 9)).toFixed(1)}%`],
  ] as const;
  const management = [
    ['CEO', 'Alex Morgan', '11.2Y', '0.9%'],
    ['CFO', 'Jamie Patel', '6.8Y', '0.3%'],
    ['COO', 'Taylor Reed', '4.1Y', '0.1%'],
    ['CTO', 'Jordan Lee', '9.3Y', '0.2%'],
    ['CRO', 'Chris Nolan', '5.6Y', '0.0%'],
  ] as const;
  const board = [
    ['Riley Chen', 'Independent Chair', 'Ex-Global Bank', '2 boards'],
    ['Samira Khan', 'Audit Chair', 'Ex-Big Tech CFO', '3 boards'],
    ['Diego Alvarez', 'Risk Committee', 'Ex-Regulator', '1 board'],
    ['Priya Singh', 'Comp Committee', 'PE Operating Partner', '2 boards'],
  ] as const;

  const relatedEntities = envelope.entities.filter((e) => e.id !== envelope.entities[0]?.id);
  const relationshipLines = envelope.relationships.map((r) => {
    const from = envelope.entities.find((e) => e.id === r.from_id)?.display_name ?? r.from_id;
    const to = envelope.entities.find((e) => e.id === r.to_id)?.display_name ?? r.to_id;
    return `${from} — ${r.relationship_type} — ${to}`;
  });

  const docLines = envelope.documents.map((d) => `${d.title} (${d.published_at})`);
  const eventTimeline = [
    ...(ref?.earningsDates ?? []),
    ...docLines,
    ...entityNews,
    ...state.systemFeed,
  ];
  const denseEventTimeline = eventTimeline.length > 0 ? eventTimeline : ['Awaiting catalyst stream update', 'Synthetic timeline standby', ...state.headlines];
  const counterparties = [...(supplyChain?.customers ?? []), ...(supplyChain?.suppliers ?? []), ...(supplyChain?.partners ?? [])];
  const denseCounterparties = counterparties.length > 0 ? counterparties : [{ name: 'Synthetic Counterparty Alpha', segment: 'Core Supplier' }, { name: 'Synthetic Counterparty Beta', segment: 'Distribution Partner' }];

  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} DES GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`des-${selected}`} className="flex-1 min-h-0 flex gap-px bg-black">
      {/* LEFT COLUMN: navigation + universe + primary profile */}
      <section className="w-80 shrink-0 bg-black min-h-0 overflow-hidden flex flex-col border-r border-[#1a1a1a]">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] flex items-center justify-between">
          <span className="text-white font-bold">DES / ISSUER CONTEXT</span>
          <span className="text-gray-400">{selected}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })}
              className={`w-full text-left px-1 py-0.5 border-b border-[#262626] ${selected === t ? 'bg-[#0d1f0d] text-green-400 border-green-600' : 'text-gray-400 hover:bg-[#0f0f0f]'}`}
            >
              {t}
            </button>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#9fb4cd] font-bold flex items-center">PRIMARY DATASET / LIVE UNIVERSE</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] text-[8px] hover:bg-[#111]">
              <span className="text-gray-200 truncate">{q.symbol}</span>
              <span className="text-right text-gray-300">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] font-bold flex items-center">CORE COMPANY INTELLIGENCE</div>
          {[
            ['Name', state.activeSymbol],
            ['Sector', ref?.sector ?? 'N/A'],
            ['Industry', ref?.industry ?? 'N/A'],
            ['Country', ref?.country ?? 'N/A'],
            ['Exchange', ref?.exchange ?? 'N/A'],
            ['Market Cap', `${fmtNum(ref?.marketCapBn ?? 0, 1)} Bn`],
            ['Float', `${fmtNum(ref?.floatBn ?? 0, 1)} Bn`],
            ['Liquidity Score', `${activeQuote?.liquidityScore ?? 0}`],
            ['Momentum', `${activeQuote?.momentum ?? 0}`],
            ['Regime', state.risk.regime],
            ['Beta', `${state.risk.beta}`],
            ['Corr', `${state.risk.corrToBenchmark}`],
          ].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
              <span className="text-gray-400">{k}</span>
              <span className="text-gray-200 font-bold">{v}</span>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#63c8ff] font-bold flex items-center">OWNERSHIP BREAKDOWN</div>
          {ownership.map(([bucket, pct]) => (
            <div key={bucket} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto]">
              <span className="text-[#9fb4cd]">{bucket}</span>
              <span className="text-[#d7e3f3] font-bold">{pct}</span>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#63c8ff] font-bold flex items-center">COUNTRY EXPOSURE %</div>
          {countryExposure.map((r) => (
            <div key={r.country} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto]">
              <span className="text-[#9fb4cd]">{r.country}</span>
              <span className="text-[#d7e3f3] font-bold">{r.exposure.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </section>

      {/* CENTER COLUMN: multi-layer historical + financial context */}
      <section className="w-[30rem] shrink-0 bg-black min-h-0 overflow-hidden flex flex-col border-r border-[#1a1a1a]">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-gray-200 font-bold flex items-center">PRIMARY + SECONDARY + HISTORICAL STACK</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] font-bold flex items-center">MARKET CAP HISTORY (10Y)</div>
          {longMktCap.map((r) => (
            <div key={`mc-${r.year}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[auto_1fr_auto_auto] gap-2">
              <span className="text-[#9fb4cd]">{r.year}</span>
              <span className="text-[#d7e3f3]">${fmtNum(r.value, 2)}B</span>
              <span className={`font-bold ${r.yoy >= 0 ? 'text-green-500' : 'text-red-500'}`}>{r.yoy >= 0 ? '+' : ''}{fmtNum(r.yoy, 2)}%</span>
              <span className="text-[#7a90ac]">YoY</span>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] font-bold flex items-center">FLOAT HISTORY (10Y)</div>
          {longFloat.map((r) => (
            <div key={`fl-${r.year}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[auto_1fr_auto] gap-2">
              <span className="text-[#9fb4cd]">{r.year}</span>
              <span className="text-[#d7e3f3]">{fmtNum(r.value, 2)}B</span>
              <span className={`font-bold ${r.yoy >= 0 ? 'text-green-500' : 'text-red-500'}`}>{r.yoy >= 0 ? '+' : ''}{fmtNum(r.yoy, 2)}%</span>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] font-bold flex items-center">SHARE COUNT HISTORY (10Y)</div>
          {longShares.map((r) => (
            <div key={`sc-${r.year}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[auto_1fr_auto] gap-2">
              <span className="text-[#9fb4cd]">{r.year}</span>
              <span className="text-[#d7e3f3]">{fmtNum(r.value, 2)}B</span>
              <span className={`font-bold ${r.yoy >= 0 ? 'text-green-500' : 'text-red-500'}`}>{r.yoy >= 0 ? '+' : ''}{fmtNum(r.yoy, 2)}%</span>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#63c8ff] font-bold flex items-center">REVENUE BY REGION</div>
          {revGeo.map((g) => (
            <div key={`geo-${g.region}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto]">
              <span className="text-[#9fb4cd]">{g.region}</span>
              <span className="text-[#d7e3f3] font-bold">{g.pct.toFixed(1)}%</span>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#63c8ff] font-bold flex items-center">PEER DELTAS (SAME SECTOR)</div>
          {peerSet.map((p) => (
            <div key={`peer-${p.symbol}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto_auto] gap-2">
              <span className="text-[#d7e3f3] truncate">{p.symbol}</span>
              <span className="text-[#9fb4cd]">{p.last.toFixed(2)}</span>
              <span className={`font-bold ${p.pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{p.pct >= 0 ? '+' : ''}{p.pct.toFixed(2)}%</span>
              <span className="text-[#7a90ac]">LQ {p.liquidityScore}</span>
            </div>
          ))}
        </div>
      </section>

      {/* RIGHT COLUMN: tertiary intelligence, relationships, docs, management, board, timeline */}
      <section className="flex-1 min-w-0 min-h-0 bg-black overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-gray-200 font-bold flex items-center">TERTIARY / LINKED / OPERATIONS LAYERS</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#4ce0a5] font-bold flex items-center">RELATIONSHIP GRAPH EDGES</div>
          {(relationshipLines.length > 0 ? relationshipLines : ['No graph edges loaded.']).map((line, i) => (
            <div key={`rel-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] text-[#d7e3f3]">{line}</div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#4ce0a5] font-bold flex items-center">RELATED ENTITIES</div>
          {(relatedEntities.length > 0 ? relatedEntities : [{ id: 'none', display_name: 'No related entities', type: 'company' as const }]).map((e) => (
            <div key={`ent-${e.id}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto]">
              <span className="text-[#d7e3f3] truncate">{e.display_name}</span>
              <span className="text-[#9fb4cd]">{e.type}</span>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#63c8ff] font-bold flex items-center">SUPPLY CHAIN / COUNTERPARTY</div>
          {denseCounterparties.map((e, i) => (
            <div key={`sc-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto] gap-2">
              <span className="text-[#d7e3f3] truncate">{e.name}</span>
              <span className="text-[#9fb4cd] truncate">{('segment' in e && e.segment) || ('note' in e && e.note) || ('type' in e && e.type) || 'N/A'}</span>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] font-bold flex items-center">MANAGEMENT ROSTER</div>
          {management.map(([name, role, tenure, own]) => (
            <div key={name} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto_auto] gap-2">
              <span className="text-[#d7e3f3] truncate">{name}</span>
              <span className="text-[#9fb4cd]">{role}</span>
              <span className="text-[#9fb4cd]">{tenure}</span>
              <span className="text-[#d7e3f3] font-bold">{own}</span>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] font-bold flex items-center">BOARD + CROSS-MEMBERSHIPS</div>
          {board.map(([name, role, profile, boards]) => (
            <div key={name} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] gap-2">
              <span className="text-[#d7e3f3] truncate">{name}</span>
              <span className="text-[#9fb4cd] truncate">{role}</span>
              <span className="text-[#9fb4cd] truncate">{boards}</span>
              <div className="col-span-3 text-[#7a90ac] text-[8px]">{profile}</div>
            </div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#ffb066] font-bold flex items-center">LINKED DOCUMENTS / NEWS ARCHIVE</div>
          {(docLines.length > 0 ? docLines : entityNews.length > 0 ? entityNews : state.headlines).map((line, i) => (
            <div key={`doc-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] text-[#d7e3f3]">{line}</div>
          ))}

          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#ffb066] font-bold flex items-center">EVENT TIMELINE / SYSTEM TRACE</div>
          {denseEventTimeline.map((line, i) => (
            <div key={`evt-${i}`} className="px-1 py-[1px] border-b border-[#1a1a1a] text-[#9fb4cd]">{line}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
