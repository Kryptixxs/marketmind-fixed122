'use client';

import { useMemo } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function SystemPulsePanel() {
  const { state } = useTerminalStore();
  const movers = useMemo(() => [...state.quotes].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)), [state.quotes]);

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col font-mono tracking-tight uppercase tabular-nums">
      <div className="h-[14px] px-[2px] border-b border-[#111] bg-[#0a0a0a] flex items-center justify-between text-[8px]">
        <span className="text-[#f4cf76] font-bold">SYSTEM PULSE / FLOW / EXPOSURE</span>
        <span className="text-[#8a9db4]">tick {state.tick}</span>
      </div>
      <div className="flex gap-px bg-[#1a2433] flex-1 min-h-0">
        <div style={{ flexBasis: 0, flexGrow: 2 }} className="bg-[#0a0a0a] min-w-0 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="h-[12px] px-[2px] border-b border-[#111] text-[7px] text-[#9bc3e8] flex items-center">TOP MOVERS</div>
          {movers.map((q) => (
            <div key={q.symbol} className="text-[8px] px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px] tabular-nums">
              <span className="text-[#cdd9ea] truncate">{q.symbol}</span>
              <span className={`text-right ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{fmt(q.last, q.last < 10 ? 4 : 2)} | {q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}% | LQ {q.liquidityScore}</span>
            </div>
          ))}
        </div>
        <div style={{ flexBasis: 0, flexGrow: 2 }} className="bg-[#0a0a0a] min-w-0 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="h-[12px] px-[2px] border-b border-[#111] text-[7px] text-[#9bc3e8] flex items-center">SECTOR EXPOSURE</div>
          {state.risk.exposureBySector.map((x) => (
            <div key={x.sector} className="text-[8px] px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px] tabular-nums">
              <span className="text-[#a8bad0]">{x.sector}</span>
              <span className={`font-bold text-right ${x.value >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{x.value >= 0 ? '+' : ''}{fmt(x.value, 0)} | β {state.risk.beta.toFixed(2)}</span>
            </div>
          ))}
          <div className="text-[8px] px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px]">
            <span className="text-[#a8bad0]">VaR</span>
            <span className="text-[#ffd98f] font-bold text-right">{fmt(state.risk.intradayVar, 0)} | Net {state.risk.netExposure.toFixed(1)}</span>
          </div>
          <div className="text-[8px] px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px]">
            <span className="text-[#a8bad0]">Regime</span>
            <span className="text-[#ffd98f] font-bold text-right">{state.risk.regime} | Corr {state.risk.corrToBenchmark.toFixed(2)}</span>
          </div>
        </div>
        <div style={{ flexBasis: 0, flexGrow: 2 }} className="bg-[#0a0a0a] min-w-0 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="h-[12px] px-[2px] border-b border-[#111] text-[7px] text-[#9bc3e8] flex items-center">EXECUTION EVENTS</div>
          {state.executionEvents.map((e) => (
            <div key={e.id} className="text-[8px] px-[2px] py-[1px] border-b border-[#111] grid grid-cols-[auto_1fr] gap-[2px] tabular-nums">
              <span className="text-[#cdd9ea] truncate">{e.symbol}</span>
              <span className="text-right text-[#d8e4f4]">{e.status} | {e.fillQty}@{fmt(e.fillPrice, 2)} | <span className={e.source === 'DEPTH' ? 'text-[#ffd98f]' : 'text-[#8ec9f0]'}>{e.source}</span></span>
            </div>
          ))}
          {state.alerts.map((a) => (
            <div key={a} className="text-[7px] px-[2px] py-[1px] border-b border-[#111] text-[#d8b4ff]">
              {a}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
