'use client';

import { useState, useEffect } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { fetchEntityIntel } from '@/app/actions/fetchEntityIntel';
import { fetchInstitutionalDepth, type InstitutionalDepth } from '@/app/actions/fetchInstitutionalDepth';

const TABS = ['Wire', 'Symbol', 'Sector', 'Macro', 'Earnings', 'M&A', 'Analyst', 'Regulatory'];

export function NewsModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Wire';
  const [backendNews, setBackendNews] = useState<string[]>([]);
  const [depth, setDepth] = useState<InstitutionalDepth | null>(null);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || '';
    if (!sym) return;
    fetchEntityIntel(sym).then((res) => setBackendNews(res.news ?? []));
  }, [state.activeSymbol]);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || 'AAPL';
    fetchInstitutionalDepth(sym).then(setDepth).catch(() => {});
  }, [state.activeSymbol]);

  const applySymbol = (s: string) => {
    dispatch({ type: 'SET_SYMBOL', payload: s });
    dispatch({ type: 'SET_COMMAND', payload: `${s} NEWS GO` });
    dispatch({ type: 'EXECUTE_COMMAND' });
  };

  const symbolNews = backendNews.length > 0 ? backendNews : state.headlines;
  const wireItems = selected === 'Symbol'
    ? symbolNews
    : (depth?.news.archive?.length ?? 0) > 0
      ? (depth?.news.archive ?? []).map((d) => `${d.title} (${d.published_at})`)
      : [...state.headlines, ...state.systemFeed, ...state.headlines];
  const sectorNews = (depth?.market.sectors ?? []).map((s) => [s.sector, `${s.movePct >= 0 ? '+' : ''}${s.movePct.toFixed(2)}%`] as const);
  const macroItems = (depth?.calendar.macro ?? []).map((m) => `${m.date} ${m.title} ${m.impact}`);
  const revisions = depth?.earnings.revisionsTimeline ?? [];
  const secFilings = depth?.sec.filings ?? [];
  const insiderTape = depth?.sec.insider ?? [];
  const impactTape = depth?.news.impacts ?? [];

  return (
    <div className={`flex-1 min-h-0 grid grid-cols-[18%_28%_54%] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-px bg-black`}>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col row-span-2 border-r border-[#1a1a1a]">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-between text-[9px] font-bold text-white">
          <span>NEWS / FEEDS</span><span className="text-gray-400">{selected}</span>
        </div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          {TABS.map((t) => (
            <button key={t} onClick={() => dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: t })} className={`w-full text-left px-1 py-0.5 border-b border-[#262626] ${selected === t ? 'bg-[#0d1f0d] text-green-400 border-green-600' : 'text-gray-400 hover:bg-[#0f0f0f]'}`}>{t}</button>
          ))}
          <div className="h-3 px-1 border-y border-[#1a1a1a] text-[7px] text-gray-400 font-bold mt-1">SYMBOLS</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-0.5 border-b border-[#262626] grid grid-cols-[1fr_auto] text-[8px] hover:bg-[#0f0f0f]">
              <span className="text-gray-200 truncate">{q.symbol}</span>
              <span className={`font-bold ${q.pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col border-b border-[#1a1a1a]">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">HEADLINES</div>
        <div className="flex-1 overflow-y-auto text-[8px]">
          {wireItems.map((line, i) => (
            <div key={`w-${i}`} className="px-1 py-0.5 border-b border-[#262626] text-gray-300">{line}</div>
          ))}
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col border-b border-[#1a1a1a]">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">SECTOR / MACRO</div>
        <div className="flex-1 overflow-y-auto text-[8px] grid grid-cols-2 gap-px">
          {sectorNews.map(([s, v], i) => (
            <div key={`s-${i}`} className="px-1 py-0.5 border-b border-[#262626] flex justify-between"><span className="text-gray-400">{s}</span><span className="font-bold text-gray-200">{v}</span></div>
          ))}
          {macroItems.map((m, i) => (
            <div key={`m-${i}`} className="px-1 py-0.5 border-b border-[#262626] text-gray-300">{m}</div>
          ))}
        </div>
      </section>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col col-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[9px] font-bold text-white">EARNINGS + ANALYST + REG</div>
        <div className="flex-1 min-h-0 grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-px bg-[#1a1a1a]">
          <div className="bg-black min-h-0 overflow-y-auto text-[8px]">
            <div className="h-4 px-1 border-b border-[#262626] text-[8px] text-[#f4cf76] flex items-center">EARNINGS + REVISION TRACE</div>
            {state.quotes.map((q) => (
              <div key={q.symbol} className="px-1 py-[1px] border-b border-[#262626] grid grid-cols-[1fr_auto_auto] gap-2">
                <span className="text-gray-200 truncate">{q.symbol}</span>
                <span className={`font-bold text-right ${q.pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(1)}%</span>
                <span className="text-gray-400 text-right">IVx {state.risk.impliedVolProxy.toFixed(1)}</span>
              </div>
            ))}
            {revisions.map((r, i) => (
              <div key={`rev-${r.date}-${i}`} className="px-1 py-[1px] border-b border-[#262626] text-gray-400">
                {`${r.date} EPS ${r.epsDeltaPct >= 0 ? '+' : ''}${r.epsDeltaPct.toFixed(2)}% REV ${r.revDeltaPct >= 0 ? '+' : ''}${r.revDeltaPct.toFixed(2)}%`}
              </div>
            ))}
          </div>
          <div className="bg-black min-h-0 overflow-y-auto text-[8px]">
            <div className="h-4 px-1 border-b border-[#262626] text-[8px] text-[#f4cf76] flex items-center">REGULATORY + FILING STACK</div>
            {secFilings.map((f, i) => (
              <div key={`fil-${f.form}-${f.filed}-${i}`} className="px-1 py-[1px] border-b border-[#262626] grid grid-cols-[auto_auto_1fr] gap-2">
                <span className="text-gray-200">{f.form}</span>
                <span className="text-gray-400">{f.filed}</span>
                <span className="text-gray-400 truncate">{f.description}</span>
              </div>
            ))}
            {insiderTape.map((x, i) => (
              <div key={`ins-${x.insider}-${x.date}-${i}`} className="px-1 py-[1px] border-b border-[#262626] grid grid-cols-[1fr_auto_auto_auto] gap-2">
                <span className="text-gray-300 truncate">{x.insider}</span>
                <span className={x.side === 'Buy' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>{x.side}</span>
                <span className="text-gray-400">{x.shares}</span>
                <span className="text-gray-300">{x.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="bg-black min-h-0 overflow-y-auto text-[8px]">
            <div className="h-4 px-1 border-b border-[#262626] text-[8px] text-[#f4cf76] flex items-center">TERTIARY IMPACT / TOPIC / SYSTEM</div>
            {(depth?.news.topics ?? []).map((t) => (
              <div key={`topic-${t.topic}`} className="px-1 py-[1px] border-b border-[#262626] text-gray-400">
                {`${t.topic} count ${t.count} sentiment ${t.sentiment >= 0 ? '+' : ''}${t.sentiment.toFixed(2)}`}
              </div>
            ))}
            {impactTape.map((imp, i) => (
              <div key={`${imp.date}-${i}`} className="px-1 py-[1px] border-b border-[#262626] text-gray-400">
                {`${imp.date} ${imp.priceImpactPct >= 0 ? '+' : ''}${imp.priceImpactPct.toFixed(2)}% vol ${imp.volShiftPct >= 0 ? '+' : ''}${imp.volShiftPct.toFixed(2)}% ${imp.event}`}
              </div>
            ))}
            {state.systemFeed.map((line, i) => (
              <div key={`sys-${line}-${i}`} className="px-1 py-[1px] border-b border-[#262626] text-gray-400">{line}</div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
