'use client';

import React from 'react';
import { useTerminalStore } from '../../store/TerminalStore';

export function AnalyticsMonitor() {
  const { state } = useTerminalStore();
  const analytics = state.workerAnalytics;
  const spreads = analytics?.arbitrageSpreads ?? [];
  const vwapRows = Object.entries(analytics?.vwapBySymbol ?? {}).slice(0, 10);
  const macdRows = Object.entries(analytics?.macdBySymbol ?? {}).slice(0, 10);

  return (
    <div className="h-full bg-[#000] text-[11px] font-mono p-2 overflow-auto terminal-scrollbar">
      <div className="text-[#FFB000] border-b border-[#333] pb-1 mb-2">ANR • Analytics Runtime</div>
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-[#333] p-2">
          <div className="text-[#999] mb-1">VWAP STREAM</div>
          {vwapRows.map(([symbol, v]) => (
            <div key={symbol} className="flex justify-between text-[#d8dde7]">
              <span>{symbol}</span><span>{v.toFixed(4)}</span>
            </div>
          ))}
        </div>
        <div className="border border-[#333] p-2">
          <div className="text-[#999] mb-1">MACD STREAM</div>
          {macdRows.map(([symbol, v]) => (
            <div key={symbol} className="flex justify-between text-[#d8dde7]">
              <span>{symbol}</span><span className={v >= 0 ? 'text-[#00c853]' : 'text-[#d32f2f]'}>{v.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="border border-[#333] p-2 mt-3">
        <div className="text-[#999] mb-1">ARBITRAGE SPREADS</div>
        {spreads.map((s) => (
          <div key={`${s.left}-${s.right}`} className="flex justify-between text-[#d8dde7]">
            <span>{s.left} vs {s.right}</span>
            <span className={s.spread >= 0 ? 'text-[#00c853]' : 'text-[#d32f2f]'}>{s.spread.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

