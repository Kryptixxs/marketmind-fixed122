'use client';

import { useRef } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

export function FeedPanel({ execMode = 'PRIMARY' }: { execMode?: 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' | 'ESC' }) {
  const { state, dispatch } = useTerminalStore();
  const newsRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const laneWeights =
    execMode === 'EVENTS'
      ? { news: 2.8, system: 1.7, alerts: 1 }
      : execMode === 'MICROSTRUCTURE'
        ? { news: 1.6, system: 2, alerts: 1.6 }
        : execMode === 'FACTORS'
          ? { news: 1.8, system: 2.5, alerts: 1.1 }
          : execMode === 'ESC'
            ? { news: 1.5, system: 2.7, alerts: 1.4 }
          : { news: 2.2, system: 1.9, alerts: 1.3 };
  const laneStyle = (key: keyof typeof laneWeights) => ({ flexBasis: 0, flexGrow: laneWeights[key] });
  const title = execMode === 'EVENTS' ? 'EVENT FEED / SYSTEM / ALERT LOG' : 'NEWS / SYSTEM / ALERT LOG';
  const overrideLines = state.overrideAuditTrail.slice(0, 18).map((event) => {
    const ttlSec = Math.max(0, Math.round(event.ttlMs / 1000));
    return `OVR ${event.action} ${event.symbol} ${event.reasonCode} TTL=${ttlSec}s REGIME=${event.regimeState}`;
  });
  const centerLines = state.feedTab === 'SYSTEM' ? [...overrideLines, ...state.systemFeed] : state.headlines;
  const modeHeaderClass =
    execMode === 'MICROSTRUCTURE'
      ? 'border-[#274b66] text-[#63c8ff]'
      : execMode === 'FACTORS'
        ? 'border-[#174432] text-[#7dffcc]'
        : execMode === 'EVENTS'
          ? 'border-[#5a1f35] text-[#e3b4ff]'
          : execMode === 'ESC'
            ? 'border-[#1a5f4b] text-[#99f1d6]'
          : 'border-[#2b3f5f] text-[#f4cf76]';

  return (
    <section className="bg-black min-h-0 overflow-hidden flex flex-col font-mono tracking-tight uppercase tabular-nums">
      <div className={`h-[14px] px-[2px] border-b border-[#111] bg-[#0a0a0a] flex items-center justify-between text-[8px] ${modeHeaderClass}`}>
        <span className="font-bold">{title}</span>
        <div className="flex items-center gap-[2px]">
          <button
            onClick={() => dispatch({ type: 'SET_FEED_TAB', payload: 'NEWS' })}
            className={`px-[2px] border text-[7px] leading-none ${state.feedTab === 'NEWS' ? 'border-[#2a7b60] text-[#99f1d6] bg-[#113328]' : 'border-[#263247] text-[#9fb4cd] bg-[#09111c]'}`}
          >
            NEWS
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_FEED_TAB', payload: 'SYSTEM' })}
            className={`px-[2px] border text-[7px] leading-none ${state.feedTab === 'SYSTEM' ? 'border-[#2a7b60] text-[#99f1d6] bg-[#113328]' : 'border-[#263247] text-[#9fb4cd] bg-[#09111c]'}`}
          >
            SYSTEM
          </button>
        </div>
      </div>
      <div className="flex gap-px bg-[#1a1a1a] flex-1 min-h-0">
        <div ref={newsRef} style={laneStyle('news')} className="bg-[#0a0a0a] min-w-0 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-px bg-[#090f18]">
            {state.headlines.map((n, i) => (
              <button
                key={`${n}-${i}`}
                onClick={() => dispatch({ type: 'SET_COMMAND', payload: `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ${state.security.assetClass} TOP GO` })}
                className="w-full text-left text-[8px] px-[2px] py-[1px] border-b border-[#111]"
              >
                <span className="text-[#f4cf76] mr-[2px]">BN{680 + i}</span>
                <span className="text-[#dbe7f7]">{n}</span>
              </button>
            ))}
          </div>
        </div>
        <div ref={centerRef} style={laneStyle('system')} className="bg-[#0a0a0a] min-w-0 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-[#090f18]">
            {centerLines.map((line, i) => (
              <div key={`${line}-${i}`} className="text-[8px] px-[2px] py-[1px] border-b border-[#111] text-[#aebed2]">{line}</div>
            ))}
          </div>
        </div>
        <div ref={alertRef} style={laneStyle('alerts')} className="bg-[#0a0a0a] min-w-0 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-[#090f18]">
            {state.alerts.map((line, i) => (
              <div key={`${line}-${i}`} className="text-[7px] px-[2px] py-[1px] border-b border-[#111] text-[#e3b4ff]">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
