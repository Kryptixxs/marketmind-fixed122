'use client';

import { useState, useEffect } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';
import { fetchEntityIntel } from '@/app/actions/fetchEntityIntel';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';
import type { SupplyChainData } from '@/lib/supply-chain-data';
import type { IntelligenceEnvelope } from '@/lib/intelligence-contract';
import { emptyIntelligenceEnvelope } from '@/lib/intelligence-contract';

function filterByCountry(entry: { name?: string; segment?: string; note?: string }, country?: string): boolean {
  if (!country) return true;
  const upper = country.toUpperCase();
  const seg = (entry.segment ?? '').toUpperCase();
  const note = (entry.note ?? '').toUpperCase();
  const name = (entry.name ?? '').toUpperCase();
  return seg.includes(upper) || note.includes(upper) || name.includes(upper) ||
    (entry.note?.toUpperCase().includes('UK') && (upper === 'UK' || upper === 'EUROPE')) ||
    (entry.segment === 'Gov' && (upper === 'US' || upper === 'USA'));
}

export function IntelModule() {
  const { state, dispatch } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const [supplyChain, setSupplyChain] = useState<SupplyChainData | null>(null);
  const [backendNews, setBackendNews] = useState<string[]>([]);
  const [envelope, setEnvelope] = useState<IntelligenceEnvelope>(emptyIntelligenceEnvelope());
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);
  const sym = state.activeSymbol?.replace(/\s+.*$/, '') || '';
  const filters = state.intelFilters;

  useEffect(() => {
    if (!sym) return;
    fetchEntityIntel(sym, filters).then((res) => {
      setSupplyChain(res.supplyChain);
      setBackendNews(res.news);
      setEnvelope(res.envelope ?? emptyIntelligenceEnvelope());
    });
  }, [sym, filters?.country, filters?.date]);

  useEffect(() => {
    if (!sym) return;
    fetchInstitutionalDepth(sym).then(setDepth).catch(() => {});
  }, [sym]);

  const filterCountry = (e: { name?: string; segment?: string; note?: string }) => filterByCountry(e, filters?.country);
  const filteredCustomers = supplyChain?.customers.filter(filterCountry) ?? [];
  const filteredSuppliers = supplyChain?.suppliers.filter(filterCountry) ?? [];
  const filteredPartners = supplyChain?.partners.filter(filterCountry) ?? [];
  const filteredCounterparties = supplyChain
    ? [...supplyChain.customers, ...supplyChain.suppliers, ...supplyChain.partners].filter(filterCountry)
    : [];

  const fallbackHeadlines = filters?.date
    ? state.headlines.filter((h) => h.includes(filters.date!) || h.includes(filters.date!.replace(/-/g, '/')))
    : state.headlines;
  const displayNews =
    envelope.documents.length > 0
      ? envelope.documents.map((d) => `${d.title} (${d.published_at})`)
      : backendNews.length > 0
        ? backendNews
        : fallbackHeadlines;

  const entityById = new Map(envelope.entities.map((e) => [e.id, e]));
  const relationshipLines =
    envelope.relationships.length > 0
      ? envelope.relationships.map((r) => {
          const from = entityById.get(r.from_id)?.display_name ?? r.from_id;
          const to = entityById.get(r.to_id)?.display_name ?? r.to_id;
          return `${from} — ${r.relationship_type} — ${to}`;
        })
      : [];

  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} INTEL GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div className="flex-1 min-h-0 grid grid-cols-[1fr_1fr_1fr] grid-rows-[1fr_1fr] gap-px bg-black">
      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">ENTITY OVERVIEW</div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar text-[9px]">
          {[
            ['Name', ref?.industry ? `${state.activeSymbol} (${ref.industry})` : state.activeSymbol],
            ['Sector', ref?.sector ?? 'N/A'],
            ['Country', ref?.country ?? 'N/A'],
            ['Exchange', ref?.exchange ?? 'N/A'],
            ['Market Cap', `${ref?.marketCapBn ?? 0} Bn`],
            ['Float', `${ref?.floatBn ?? 0} Bn`],
            ['Next Earnings', ref?.earningsDates?.[0] ?? 'N/A'],
            ['2nd Earnings', ref?.earningsDates?.[1] ?? 'N/A'],
            ['S&P', ref?.ratings?.sp ?? 'N/A'],
            ['Moody\'s', ref?.ratings?.moodys ?? 'N/A'],
            ['Fitch', ref?.ratings?.fitch ?? 'N/A'],
          ].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
              <span className="text-[#9fb4cd]">{k}</span>
              <span className="text-[#e7f1ff] font-bold">{v}</span>
            </div>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">WATCHLIST</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d7e3f3]">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">RELATIONSHIP GRAPH</div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar text-[9px]">
          {relationshipLines.length > 0 ? (
            relationshipLines.map((line, i) => (
              <div key={`rel-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
                <span className="text-[#d7e3f3]">{line}</span>
              </div>
            ))
          ) : supplyChain ? (
            <>
              <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#4ce0a5] flex items-center">CUSTOMERS</div>
              {filteredCustomers.map((e, i) => (
                <div key={`c-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
                  <span className="text-[#d7e3f3]">{e.name}</span>
                  <span className="text-[#9fb4cd] text-[8px]">{e.segment ?? e.note ?? ''}</span>
                </div>
              ))}
              <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#ff7ca3] flex items-center">SUPPLIERS</div>
              {filteredSuppliers.map((e, i) => (
                <div key={`s-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
                  <span className="text-[#d7e3f3]">{e.name}</span>
                  <span className="text-[#9fb4cd] text-[8px]">{e.note ?? ''}</span>
                </div>
              ))}
              <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#63c8ff] flex items-center">PARTNERS</div>
              {filteredPartners.map((e, i) => (
                <div key={`p-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
                  <span className="text-[#d7e3f3]">{e.name}</span>
                  <span className="text-[#9fb4cd] text-[8px]">{e.note ?? ''}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="px-1 py-2 text-[9px] text-[#9fb4cd]">No supply chain data for {state.activeSymbol}. Try PLTR, AAPL, MSFT, NVDA, AMZN, TSLA, META, GOOGL.</div>
          )}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">NEWS ARCHIVE</div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar text-[9px]">
          {displayNews.map((h, i) => (
            <div key={`h-${i}`} className="px-1 py-[1px] border-b border-[#1a1a1a] text-[#d7e3f3]">{h}</div>
          ))}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">EVENT TIMELINE</div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar text-[9px]">
          {[...(ref?.earningsDates ?? []), ...state.systemFeed].map((line, i) => (
            <div key={`evt-${i}`} className="px-1 py-[1px] border-b border-[#1a1a1a] text-[#9fb4cd]">{line}</div>
          ))}
          {(depth?.news.impacts ?? []).map((ev, i) => (
            <div key={`${ev.date}-${i}`} className="px-1 py-[1px] border-b border-[#1a1a1a] text-[#9fb4cd]">
              {`${ev.date} ${ev.event} ${ev.priceImpactPct >= 0 ? '+' : ''}${ev.priceImpactPct.toFixed(2)}%`}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">COUNTERPARTY NETWORK</div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar text-[9px]">
          {relationshipLines.length > 0 ? (
            relationshipLines.map((line, i) => (
              <div key={`cp-rel-${i}`} className="px-1 py-[1px] border-b border-[#1a1a1a] text-[#d7e3f3]">{line}</div>
            ))
          ) : supplyChain ? (
            filteredCounterparties.map((e, i) => (
              <div key={`cp-${i}`} className="px-1 py-[1px] border-b border-[#1a1a1a] text-[#d7e3f3]">{e.name} — {e.segment ?? e.note ?? 'linked'}</div>
            ))
          ) : (
            <div className="px-1 py-2 text-[#9fb4cd]">Load supply chain for counterparty view.</div>
          )}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-[#f4cf76] font-bold flex items-center">COUNTRY EXPOSURE</div>
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar text-[9px]">
          {((depth?.financial.geoBreakdown ?? []).map((g) => [g.geography, `${g.revenuePct.toFixed(1)}% rev / ${g.assetsPct.toFixed(1)}% assets`]) as Array<[string, string]>).map(([country, exposure]) => (
            <div key={country} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
              <span className="text-[#9fb4cd]">{country}</span>
              <span className="text-[#e7f1ff] font-bold">{exposure}</span>
            </div>
          ))}
          <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-[#f4cf76] flex items-center">DOMICILE</div>
          <div className="px-1 py-[2px] border-b border-[#1a1a1a] text-[#e7f1ff] font-bold">{ref?.country ?? 'N/A'}</div>
        </div>
      </section>
    </div>
  );
}
