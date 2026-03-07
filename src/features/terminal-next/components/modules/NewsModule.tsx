'use client';

import { useState, useEffect } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { fetchEntityIntel } from '@/app/actions/fetchEntityIntel';
import { searchDocuments } from '@/app/actions/searchDocuments';

const TABS = ['Wire', 'Symbol', 'Sector', 'Macro', 'Earnings', 'M&A', 'Analyst', 'Regulatory'];

export function NewsModule() {
  const { state, dispatch } = useTerminalStore();
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Wire';
  const [backendNews, setBackendNews] = useState<string[]>([]);
  const [wireDocs, setWireDocs] = useState<{ title: string; published_at: string; source: string }[]>([]);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || '';
    if (!sym) {
      setBackendNews([]);
      return;
    }
    fetchEntityIntel(sym).then((res) => setBackendNews(res.news ?? []));
  }, [state.activeSymbol]);

  useEffect(() => {
    if (selected !== 'Wire') return;
    searchDocuments('').then((docs) => setWireDocs(docs.map((d) => ({ title: d.title, published_at: d.published_at, source: d.source }))));
  }, [selected]);

  const applySymbol = (s: string) => {
    dispatch({ type: 'SET_SYMBOL', payload: s });
    dispatch({ type: 'SET_COMMAND', payload: `${s} NEWS GO` });
    dispatch({ type: 'EXECUTE_COMMAND' });
  };

  const symbolNews = backendNews.length > 0 ? backendNews : state.headlines;
  const wireItems = selected === 'Symbol'
    ? symbolNews
    : wireDocs.length > 0
      ? wireDocs.map((d) => `${d.title} (${d.published_at})`)
      : [...state.headlines, ...state.systemFeed, ...state.headlines];
  const sectorNews = [['Tech', 'AI capex +12%'], ['Energy', 'Crude bid'], ['Healthcare', 'FDA watch'], ['Fin', 'Rates vol'], ['Consumer', 'Retail soft'], ['Industrials', 'PMI beat']];
  const macroItems = ['CPI Tue 08:30', 'FOMC Wed 14:00', 'NFP Fri 08:30', 'ECB Thu 13:15', 'Retail Sales', 'PMI', 'Jobless Claims', 'Housing Starts'];

  return (
    <div className={`flex-1 min-h-0 grid grid-cols-[18%_28%_54%] grid-rows-[50%_50%] gap-px bg-black`}>
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
        <div className="flex-1 overflow-y-auto text-[8px] grid grid-cols-4 gap-px">
          {state.quotes.map((q) => (
            <div key={q.symbol} className="px-1 py-0.5 border-b border-[#262626] grid grid-cols-[1fr_auto]">
              <span className="text-gray-200">{q.symbol}</span>
              <span className={`font-bold ${q.pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(1)}%</span>
            </div>
          ))}
          {['10-K', '10-Q', '8-K', 'Proxy', 'S-1', '424B'].map((f, i) => (
            <div key={`f-${i}`} className="px-1 py-0.5 border-b border-[#262626] text-gray-400">{state.activeSymbol} {f}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
