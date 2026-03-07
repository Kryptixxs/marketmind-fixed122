'use client';

import { useRef } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function RightRailPanel({ execMode = 'PRIMARY' }: { execMode?: 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' | 'ESC' }) {
  const { state, dispatch } = useTerminalStore();
  const depthRef = useRef<HTMLDivElement>(null);
  const tapeRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const sweepPulse = state.microstructure.sweep.active ? 'animate-pulse' : '';
  const activeRailTab = state.rightRailTab;
  const modeWeights =
    execMode === 'MICROSTRUCTURE'
      ? { depth: 3.5, tape: 1.35, alerts: 1.15 }
      : execMode === 'FACTORS'
        ? { depth: 1.6, tape: 1.1, alerts: 2.6 }
        : execMode === 'EVENTS'
          ? { depth: 1.4, tape: 2.2, alerts: 2.4 }
          : execMode === 'ESC'
            ? { depth: 1.9, tape: 1.75, alerts: 2.1 }
          : { depth: 2.8, tape: 1.3, alerts: 1.6 };
  const sectionStyle = (key: keyof typeof modeWeights) => ({ flexBasis: 0, flexGrow: modeWeights[key] });
  const ladderRows = state.orderBook;
  const tapeRows = state.tape;
  const railLabel = execMode === 'FACTORS' ? 'FACTOR MICROSTRUCTURE' : execMode === 'EVENTS' ? 'EVENT RAIL' : 'MICROSTRUCTURE';
  const modeHeaderClass =
    execMode === 'MICROSTRUCTURE'
      ? 'border-[#274b66] text-[#63c8ff]'
      : execMode === 'FACTORS'
        ? 'border-[#174432] text-[#7dffcc]'
        : execMode === 'EVENTS'
          ? 'border-[#5a1f35] text-[#e3b4ff]'
          : execMode === 'ESC'
            ? 'border-[#1a5f4b] text-[#99f1d6]'
          : 'border-[#2b3f5f] text-[#9bc3e8]';
  const pulseClass = execMode === 'MICROSTRUCTURE' ? 'animate-pulse' : '';
  const nextRailTab = activeRailTab === 'DEPTH' ? 'TAPE' : activeRailTab === 'TAPE' ? 'ALERTS' : 'DEPTH';
  const tabButton = (tab: 'DEPTH' | 'TAPE' | 'ALERTS') => (
    <button
      onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: tab })}
      className={`px-1 border text-[8px] ${activeRailTab === tab ? 'border-green-600 bg-[#0d1f0d] text-green-400' : 'border-[#262626] bg-[#0a0a0a] text-gray-400'}`}
    >
      {tab}
    </button>
  );
  const backgroundLines = Array.from({ length: Math.max(state.alerts.length, state.quotes.length) }, (_, i) => {
    const q = state.quotes[i % Math.max(1, state.quotes.length)];
    return `${q?.symbol ?? '---'} ${q ? fmt(q.last, q.last < 10 ? 4 : 2) : '0.00'} ${(q?.pct ?? 0).toFixed(2)}%`;
  });

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col">
      <div className={`h-5 px-1 border-b bg-[#0a0a0a] flex items-center justify-between text-[10px] ${modeHeaderClass}`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${pulseClass}`}>{railLabel}</span>
          <span className="text-[#b2c0d7]">Spr {fmt(state.microstructure.insideSpreadBps, 2)}bp</span>
          <span className={state.microstructure.imbalance >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>Imb {(state.microstructure.imbalance * 100).toFixed(1)}%</span>
        </div>
        <div className={`text-[9px] ${state.microstructure.sweep.active ? 'text-[#ffaf66]' : 'text-[#7f99ba]'} ${sweepPulse}`}>
          {state.microstructure.sweep.active ? `SWEEP ${state.microstructure.sweep.side}` : 'NO SWEEP'}
        </div>
      </div>

      <div className="flex flex-col gap-px bg-[#1a2433] flex-1 min-h-0">
        {activeRailTab === 'DEPTH' && (
          <>
            <div ref={depthRef} style={sectionStyle('depth')} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a1a1a] text-[10px] text-[#8cc7f3] flex items-center justify-between">
                <span>ORDER BOOK DEPTH</span>
                <div className="flex items-center gap-1">
                  {tabButton('DEPTH')}
                  {tabButton('TAPE')}
                  {tabButton('ALERTS')}
                </div>
              </div>
              <table className="w-full text-[9px] tabular-nums">
                <thead className="sticky top-0 bg-[#0a0a0a] text-[#7db0db]">
                  <tr>
                    <th className="text-right px-1 py-0.5">BidSz</th>
                    <th className="text-right px-1 py-0.5">CumB</th>
                    <th className="text-right px-1 py-0.5">Bid</th>
                    <th className="text-right px-1 py-0.5">Ask</th>
                    <th className="text-right px-1 py-0.5">CumA</th>
                    <th className="text-right px-1 py-0.5">AskSz</th>
                  </tr>
                </thead>
                <tbody>
                  {ladderRows.map((r) => (
                    <tr key={`bk-${r.level}`} className="border-t border-[#1a1a1a]">
                      <td className="relative text-right px-1 py-0.5 text-[#4ce0a5]">
                        <span className="relative z-10">{r.bidSize}</span>
                        <span className="absolute left-0 top-0 h-full bg-[#17443266]" style={{ width: `${r.bidHeat}%` }} />
                      </td>
                      <td className="text-right px-1 py-0.5 text-[#8cc7f3]">{r.cumBidSize}</td>
                      <td className="text-right px-1 py-0.5 text-[#4ce0a5]">{fmt(r.bid, r.bid < 10 ? 4 : 2)}</td>
                      <td className="text-right px-1 py-0.5 text-[#ff7ca3]">{fmt(r.ask, r.ask < 10 ? 4 : 2)}</td>
                      <td className="text-right px-1 py-0.5 text-[#8cc7f3]">{r.cumAskSize}</td>
                      <td className="relative text-right px-1 py-0.5 text-[#ff7ca3]">
                        <span className="relative z-10">{r.askSize}</span>
                        <span className="absolute right-0 top-0 h-full bg-[#5a1f3566]" style={{ width: `${r.askHeat}%` }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div ref={tapeRef} style={sectionStyle('tape')} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a1a1a] text-[10px] text-[#8cc7f3] flex items-center justify-between">
                <span>TIME &amp; SALES</span>
                <button onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: nextRailTab })} className="text-[9px] text-[#9fb4cd]">{nextRailTab}</button>
              </div>
              {tapeRows.map((r) => {
                const pulse = state.delta.tapePulseIds.includes(r.id);
                return (
                  <div key={r.id} className={`text-[9px] px-1 py-0.5 border-b border-[#1a1a1a] grid grid-cols-[1fr_1fr_auto_auto] tabular-nums ${pulse ? 'bg-[#1a2c40]' : ''}`}>
                    <span className="text-[#8aa2bf]">{r.time}</span>
                    <span className={r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{fmt(r.price, 2)}</span>
                    <span className={r.isSweep ? 'text-[#ffaf66] font-bold' : 'text-[#d8e4f4]'}>{r.size}</span>
                    <span className={r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{r.side}</span>
                  </div>
                );
              })}
            </div>
            <div ref={alertRef} style={sectionStyle('alerts')} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a1a1a] text-[10px] text-[#8cc7f3] flex items-center">ALERT PREVIEW</div>
              {state.alerts.map((a) => (
                <div key={a} className={`w-full text-left text-[9px] px-1 py-0.5 border-b border-[#1a1a1a] text-[#dbe7f7] ${a.includes('[ACTIVE]') || a.includes('[SWEEP]') ? 'bg-[#2f1830] text-[#ffd5ff]' : ''}`}>
                  {a}
                </div>
              ))}
              {backgroundLines.map((line, i) => (
                <div key={`bga-${line}-${i}`} className="text-[8px] px-1 py-0.5 border-b border-[#1a1a1a] text-[#6e85a3]">{line}</div>
              ))}
            </div>
          </>
        )}
        {activeRailTab === 'TAPE' && (
          <>
            <div style={{ flexBasis: 0, flexGrow: modeWeights.depth + modeWeights.tape }} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a1a1a] text-[10px] text-[#8cc7f3] flex items-center justify-between">
                <span>TIME &amp; SALES STREAM</span>
                <div className="flex items-center gap-1">
                  {tabButton('DEPTH')}
                  {tabButton('TAPE')}
                  {tabButton('ALERTS')}
                </div>
              </div>
              {tapeRows.map((r) => {
                const pulse = state.delta.tapePulseIds.includes(r.id);
                return (
                  <div key={r.id} className={`text-[9px] px-1 py-0.5 border-b border-[#1a1a1a] grid grid-cols-[1fr_1fr_auto_auto] tabular-nums ${pulse ? 'bg-[#1a2c40]' : ''}`}>
                    <span className="text-[#8aa2bf]">{r.time}</span>
                    <span className={r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{fmt(r.price, 2)}</span>
                    <span className={r.isSweep ? 'text-[#ffaf66] font-bold' : 'text-[#d8e4f4]'}>{r.size}</span>
                    <span className={r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{r.side}</span>
                  </div>
                );
              })}
            </div>
            <div style={sectionStyle('alerts')} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a1a1a] text-[10px] text-[#8cc7f3] flex items-center">ALERTS</div>
              {state.alerts.map((a) => (
                <div key={a} className={`w-full text-left text-[9px] px-1 py-0.5 border-b border-[#1a1a1a] text-[#dbe7f7] ${a.includes('[ACTIVE]') || a.includes('[SWEEP]') ? 'bg-[#2f1830] text-[#ffd5ff]' : ''}`}>
                  {a}
                </div>
              ))}
              {backgroundLines.map((line, i) => (
                <div key={`bgt-${line}-${i}`} className="text-[8px] px-1 py-0.5 border-b border-[#1a1a1a] text-[#6e85a3]">{line}</div>
              ))}
            </div>
          </>
        )}
        {activeRailTab === 'ALERTS' && (
          <>
            <div style={{ flexBasis: 0, flexGrow: modeWeights.tape + modeWeights.alerts }} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a1a1a] text-[10px] text-[#8cc7f3] flex items-center justify-between">
                <span>ALERTS CONSOLE</span>
                <div className="flex items-center gap-1">
                  {tabButton('DEPTH')}
                  {tabButton('TAPE')}
                  {tabButton('ALERTS')}
                </div>
              </div>
              {[...state.alerts, ...state.systemFeed, ...backgroundLines].map((a, i) => (
                <div key={`${a}-${i}`} className={`w-full text-left text-[9px] px-1 py-0.5 border-b border-[#1a1a1a] ${a.includes('REJECTED') ? 'text-[#ff7ca3]' : a.includes('FUNCTION CONTEXT') ? 'text-[#63c8ff]' : 'text-[#dbe7f7]'}`}>
                  {a}
                </div>
              ))}
            </div>
            <div style={sectionStyle('depth')} className="bg-[#0a0a0a] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a1a1a] text-[10px] text-[#8cc7f3] flex items-center">RECENT PRINTS</div>
              {tapeRows.map((r) => (
                <div key={r.id} className="text-[9px] px-1 py-0.5 border-b border-[#1a1a1a] grid grid-cols-[1fr_1fr_auto] tabular-nums">
                  <span className="text-[#8aa2bf]">{r.time}</span>
                  <span className={r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{fmt(r.price, 2)}</span>
                  <span className="text-right text-[#d8e4f4]">{r.size}</span>
                </div>
              ))}
              {backgroundLines.map((line, i) => (
                <div key={`bgp-${line}-${i}`} className="text-[8px] px-1 py-0.5 border-b border-[#1a1a1a] text-[#6e85a3]">{line}</div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
