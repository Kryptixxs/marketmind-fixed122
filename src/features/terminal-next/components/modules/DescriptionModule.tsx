'use client';

import { useState, useEffect } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { selectActiveReferenceProfile } from '../../selectors/referenceSelectors';
import { fetchSupplyChain } from '@/app/actions/fetchSupplyChain';
import { fetchEntityIntel } from '@/app/actions/fetchEntityIntel';
import { PANEL_LIMITS } from '@/lib/panel-limits';
import type { SupplyChainData } from '@/lib/supply-chain-data';

const TABS = ['Overview', 'Capital Structure', 'Supply Chain', 'Ratings', 'Corporate Actions'];

export function DescriptionModule() {
  const { state, dispatch } = useTerminalStore();
  const ref = selectActiveReferenceProfile(state);
  const selected = state.activeSubTab && TABS.includes(state.activeSubTab) ? state.activeSubTab : 'Overview';
  const [supplyChain, setSupplyChain] = useState<SupplyChainData | null>(null);
  const [entityNews, setEntityNews] = useState<string[]>([]);

  useEffect(() => {
    if (selected !== 'Supply Chain') return;
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || '';
    fetchSupplyChain(sym).then(setSupplyChain);
  }, [selected, state.activeSymbol]);

  useEffect(() => {
    const sym = state.activeSymbol?.replace(/\s+.*$/, '') || '';
    if (!sym) return;
    fetchEntityIntel(sym).then((res) => setEntityNews(res.news ?? []));
  }, [state.activeSymbol]);

  const issuerRows: Array<[string, string]> = [
    ['Debt Tier', 'Senior Unsecured'],
    ['Leverage', '1.8x'],
    ['Coverage', '12.4x'],
    ['Maturity', '4.2Y'],
    ['Top Holder', 'Passive Index Funds'],
    ['Float Turnover', `${(state.tick % 40) + 8}%`],
    ['Short Interest', `${(state.tick % 18) + 1}.2%`],
    ['Dividend Yield', `${((state.tick % 6) + 1).toFixed(1)}%`],
    ['Buyback Window', state.tick % 2 === 0 ? 'OPEN' : 'PAUSED'],
    ['Primary Venue', ref?.exchange ?? 'N/A'],
    ['Domicile', ref?.country ?? 'US'],
    ['Fiscal Year End', 'Dec'],
    ['Auditor', 'Big Four'],
    ['Legal Counsel', 'Top Tier'],
    ['Transfer Agent', 'EQ Shareowner'],
    ['IR Contact', 'investor@company.com'],
    ['ADR Program', 'Level III'],
    ['Index Membership', 'SPX NDX'],
    ['Share Class', 'Common'],
    ['Voting Rights', '1:1'],
    ['Restricted Lockup', '180d'],
  ];

  const layoutClass =
    selected === 'Overview'
      ? 'grid-cols-[26%_44%_30%] grid-rows-[62%_38%]'
      : selected === 'Capital Structure'
        ? 'grid-cols-[22%_48%_30%] grid-rows-[54%_46%]'
        : selected === 'Ratings'
          ? 'grid-cols-[30%_36%_34%] grid-rows-[50%_50%]'
          : 'grid-cols-[24%_46%_30%] grid-rows-[58%_42%]';
  const applySymbol = (symbol: string) => {
    const cmd = `${symbol} DES GO`;
    dispatch({ type: 'SET_SYMBOL', payload: symbol });
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };

  return (
    <div key={`des-${selected}`} className={`flex-1 min-h-0 grid ${layoutClass} gap-px bg-black`}>
      <section className="bg-black min-h-0 overflow-hidden flex flex-col row-span-2 border-r border-[#1a1a1a]">
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
          <div className="h-3 px-1 border-y border-[#1a1a1a] text-[7px] text-gray-400 font-bold flex items-center">SECURITY LIST</div>
          {state.quotes.map((q) => (
            <button key={q.symbol} onClick={() => applySymbol(q.symbol)} className="w-full text-left px-1 py-[1px] border-b border-[#1a1a1a] grid grid-cols-[1fr_auto_auto] text-[8px]">
              <span className="text-gray-200 truncate">{q.symbol}</span>
              <span className="text-right text-gray-300">{q.last.toFixed(q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>{q.pct >= 0 ? '+' : ''}{q.pct.toFixed(2)}</span>
            </button>
          ))}
          <div className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-gray-400">Sector</span><span className="text-gray-200 font-bold">{ref?.sector ?? 'N/A'}</span></div>
          <div className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-gray-400">Industry</span><span className="text-gray-200 font-bold">{ref?.industry ?? 'N/A'}</span></div>
          <div className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-gray-400">Country</span><span className="text-gray-200 font-bold">{ref?.country ?? 'N/A'}</span></div>
          <div className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-gray-400">Exchange</span><span className="text-gray-200 font-bold">{ref?.exchange ?? 'N/A'}</span></div>
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-gray-200 font-bold flex items-center">DESCRIPTION GRID</div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {[['Market Cap', `${ref?.marketCapBn ?? 0} Bn`], ['Float', `${ref?.floatBn ?? 0} Bn`], ['S&P', ref?.ratings.sp ?? 'N/A'], ['Moody`s', ref?.ratings.moodys ?? 'N/A'], ['Fitch', ref?.ratings.fitch ?? 'N/A'], ['Next Earnings', ref?.earningsDates[0] ?? 'N/A'], ['2nd Earnings', ref?.earningsDates[1] ?? 'N/A'], ['Regime', state.risk.regime], ['Corr', `${state.risk.corrToBenchmark}`], ['Beta', `${state.risk.beta}`], ['Liquidity', `${state.quotes.find((q) => q.symbol === state.activeSymbol)?.liquidityScore ?? 0}`], ['Clock', new Date(state.tickMs).toISOString().slice(11, 19)]].map(([k, v]) => (
            <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] grid grid-cols-[1.2fr_1fr]">
              <span className="text-gray-400">{k}</span>
              <span className="text-gray-200 font-bold text-right">{v}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col row-span-2">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-gray-200 font-bold flex items-center">CORPORATE EVENTS + SYSTEM</div>
        <div className="grid grid-rows-[56%_44%] gap-px bg-[#1a1a1a] flex-1 min-h-0">
          <div className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
            {[...(entityNews.length > 0 ? entityNews : state.headlines.slice(0, PANEL_LIMITS.headlines)), ...(ref?.earningsDates ?? [])].map((line, i) => (
              <div key={`${line}-${i}`} className="text-[9px] px-1 py-[1px] border-b border-[#1a1a1a] text-gray-300">{line}</div>
            ))}
          </div>
          <div className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
            {state.systemFeed.map((line, i) => (
              <div key={`${line}-${i}`} className="text-[8px] px-1 py-[1px] border-b border-[#1a1a1a] text-gray-400">{line}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-black min-h-0 overflow-hidden flex flex-col">
        <div className="h-5 px-1 border-b border-[#1a1a1a] bg-[#0a0a0a] text-[10px] text-gray-200 font-bold flex items-center">
          {selected === 'Supply Chain' ? 'KEY CUSTOMERS / SUPPLY CHAIN' : 'CAPITAL STRUCTURE SNAPSHOT'}
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar text-[9px]">
          {selected === 'Supply Chain' && supplyChain ? (
            <>
              <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-green-500 flex items-center">CUSTOMERS</div>
              {supplyChain.customers.map((e, i) => (
                <div key={`c-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
                  <span className="text-gray-300">{e.name}</span>
                  <span className="text-gray-400 text-[8px]">{e.segment ?? e.note ?? ''}</span>
                </div>
              ))}
              <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-green-400 flex items-center">SUPPLIERS</div>
              {supplyChain.suppliers.map((e, i) => (
                <div key={`s-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
                  <span className="text-gray-300">{e.name}</span>
                  <span className="text-gray-400 text-[8px]">{e.note ?? ''}</span>
                </div>
              ))}
              <div className="h-4 px-1 border-y border-[#1a1a1a] text-[8px] text-gray-400 flex items-center">PARTNERS</div>
              {supplyChain.partners.map((e, i) => (
                <div key={`p-${i}`} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between">
                  <span className="text-gray-300">{e.name}</span>
                  <span className="text-gray-400 text-[8px]">{e.note ?? ''}</span>
                </div>
              ))}
            </>
          ) : selected === 'Supply Chain' ? (
            <div className="px-1 py-2 text-[9px] text-gray-400">No supply chain data for {state.activeSymbol}. Try PLTR, AAPL, MSFT, NVDA, AMZN, TSLA, META, GOOGL.</div>
          ) : (
            issuerRows.map(([k, v]) => (
              <div key={k} className="px-1 py-[2px] border-b border-[#1a1a1a] flex justify-between"><span className="text-gray-400">{k}</span><span className="text-gray-200 font-bold">{v}</span></div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
