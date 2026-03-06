'use client';

import { useMemo } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function SystemPulsePanel() {
  const { state } = useTerminalStore();
  const movers = useMemo(() => [...state.quotes].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 14), [state.quotes]);

  return (
    <section className="bg-[#05090f] min-h-0 overflow-hidden flex flex-col">
      <div className="h-5 px-1 border-b border-[#2a2416] bg-[#080b10] flex items-center justify-between text-[9px]">
        <span className="text-[#f4cf76] font-bold">SYSTEM PULSE / FLOW / EXPOSURE</span>
        <span className="text-[#8a9db4]">tick {state.tick}</span>
      </div>
      <div className="grid grid-cols-[34%_33%_33%] gap-px bg-[#1a2433] flex-1 min-h-0">
        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          <div className="h-4 px-1 border-b border-[#142034] text-[9px] text-[#9bc3e8] flex items-center">TOP MOVERS</div>
          {movers.map((q) => (
            <div key={q.symbol} className="text-[9px] px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1.2fr_1fr_1fr] tabular-nums">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className="text-right text-[#d8e4f4]">{fmt(q.last, q.last < 10 ? 4 : 2)}</span>
              <span className={`text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}%</span>
            </div>
          ))}
        </div>
        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          <div className="h-4 px-1 border-b border-[#142034] text-[9px] text-[#9bc3e8] flex items-center">SECTOR EXPOSURE</div>
          {state.risk.exposureBySector.map((x) => (
            <div key={x.sector} className="text-[9px] px-1 py-[1px] border-b border-[#142034] flex items-center justify-between tabular-nums">
              <span className="text-[#a8bad0]">{x.sector}</span>
              <span className={`font-bold ${x.value >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{x.value >= 0 ? '+' : ''}{fmt(x.value, 0)}</span>
            </div>
          ))}
          <div className="text-[9px] px-1 py-[2px] border-b border-[#142034] flex items-center justify-between">
            <span className="text-[#a8bad0]">VaR</span>
            <span className="text-[#ffd98f] font-bold">{fmt(state.risk.intradayVar, 0)}</span>
          </div>
          <div className="text-[9px] px-1 py-[2px] border-b border-[#142034] flex items-center justify-between">
            <span className="text-[#a8bad0]">Regime</span>
            <span className="text-[#ffd98f] font-bold">{state.risk.regime}</span>
          </div>
        </div>
        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          <div className="h-4 px-1 border-b border-[#142034] text-[9px] text-[#9bc3e8] flex items-center">EXECUTION EVENTS</div>
          {state.executionEvents.map((e) => (
            <div key={e.id} className="text-[9px] px-1 py-[1px] border-b border-[#142034] grid grid-cols-[1.1fr_.9fr_.9fr_.8fr] tabular-nums">
              <span className="text-[#cdd9ea] truncate">{e.symbol}</span>
              <span className="text-[#a8bad0]">{e.status}</span>
              <span className="text-right text-[#d8e4f4]">{e.fillQty}@{fmt(e.fillPrice, 2)}</span>
              <span className={e.source === 'DEPTH' ? 'text-[#ffd98f] text-right' : 'text-[#8ec9f0] text-right'}>{e.source}</span>
            </div>
          ))}
          {state.alerts.slice(0, 6).map((a) => (
            <div key={a} className="text-[8px] px-1 py-[1px] border-b border-[#142034] text-[#d8b4ff]">
              {a}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
