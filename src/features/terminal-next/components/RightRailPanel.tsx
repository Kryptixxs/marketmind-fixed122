'use client';

import { useTerminalStore } from '../store/TerminalStore';

const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

export function RightRailPanel({ execMode = 'PRIMARY' }: { execMode?: 'PRIMARY' | 'MICROSTRUCTURE' | 'FACTORS' | 'EVENTS' }) {
  const { state, dispatch } = useTerminalStore();
  const sweepPulse = state.microstructure.sweep.active ? 'animate-pulse' : '';
  const rowsClass =
    execMode === 'MICROSTRUCTURE'
      ? 'grid-rows-[62%_24%_14%]'
      : execMode === 'FACTORS'
        ? 'grid-rows-[30%_20%_50%]'
        : execMode === 'EVENTS'
          ? 'grid-rows-[26%_36%_38%]'
          : 'grid-rows-[53%_22%_25%]';
  const ladderRows = execMode === 'MICROSTRUCTURE' ? state.orderBook : state.orderBook.slice(0, execMode === 'FACTORS' ? 12 : 18);
  const tapeRows = state.tape.slice(0, execMode === 'MICROSTRUCTURE' ? 28 : execMode === 'EVENTS' ? 24 : 16);
  const railLabel = execMode === 'FACTORS' ? 'FACTOR MICROSTRUCTURE' : execMode === 'EVENTS' ? 'EVENT RAIL' : 'MICROSTRUCTURE';
  const modeHeaderClass =
    execMode === 'MICROSTRUCTURE'
      ? 'border-[#274b66] text-[#63c8ff]'
      : execMode === 'FACTORS'
        ? 'border-[#174432] text-[#7dffcc]'
        : execMode === 'EVENTS'
          ? 'border-[#5a1f35] text-[#e3b4ff]'
          : 'border-[#2b3f5f] text-[#9bc3e8]';
  const pulseClass = execMode === 'MICROSTRUCTURE' ? 'animate-pulse' : '';

  return (
    <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
      <div className={`h-5 px-1 border-b bg-[#0b1320] flex items-center justify-between text-[10px] ${modeHeaderClass}`}>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${pulseClass}`}>{railLabel}</span>
          <span className="text-[#b2c0d7]">Spr {fmt(state.microstructure.insideSpreadBps, 2)}bp</span>
          <span className={state.microstructure.imbalance >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>Imb {(state.microstructure.imbalance * 100).toFixed(1)}%</span>
        </div>
        <div className={`text-[9px] ${state.microstructure.sweep.active ? 'text-[#ffaf66]' : 'text-[#7f99ba]'} ${sweepPulse}`}>
          {state.microstructure.sweep.active ? `SWEEP ${state.microstructure.sweep.side}` : 'NO SWEEP'}
        </div>
      </div>

      <div className={`grid ${rowsClass} gap-px bg-[#1a2433] flex-1 min-h-0`}>
        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          <table className="w-full text-[9px] tabular-nums">
            <thead className="sticky top-0 bg-[#0a121f] text-[#7db0db]">
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
                <tr key={`bk-${r.level}`} className="border-t border-[#142034]">
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

        <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
          <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center justify-between">
            <span>TIME &amp; SALES</span>
            <button
              onClick={() => dispatch({ type: 'SET_RIGHT_TAB', payload: state.rightRailTab === 'TAPE' ? 'DEPTH' : 'TAPE' })}
              className="text-[9px] text-[#9fb4cd]"
            >
              {state.rightRailTab}
            </button>
          </div>
          {tapeRows.map((r) => {
            const pulse = state.delta.tapePulseIds.includes(r.id);
            return (
              <div
                key={r.id}
                className={`text-[9px] px-1 py-0.5 border-b border-[#142034] grid grid-cols-[1fr_1fr_auto_auto] tabular-nums ${
                  pulse ? 'bg-[#1a2c40]' : ''
                }`}
              >
                <span className="text-[#8aa2bf]">{r.time}</span>
                <span className={r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{fmt(r.price, 2)}</span>
                <span className={r.isSweep ? 'text-[#ffaf66] font-bold' : 'text-[#d8e4f4]'}>{r.size}</span>
                <span className={r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{r.side}</span>
              </div>
            );
          })}
        </div>

        {execMode === 'FACTORS' ? (
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">FACTOR GRID</div>
            {[['Corr SPX', `${state.risk.corrToBenchmark}`], ['Realized Vol', `${state.risk.realizedVol}%`], ['Implied Proxy', `${state.risk.impliedVolProxy}%`], ['Beta', `${state.risk.beta}`], ['OFI', `${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}%`], ['Regime', state.risk.regime]].map(([k, v]) => (
              <div key={k} className="text-[9px] px-1 py-[1px] border-b border-[#142034] flex justify-between">
                <span className="text-[#9fb4cd]">{k}</span>
                <span className="text-[#dbe7f7] font-bold">{v}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
            <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">ALERTS</div>
            {state.alerts.map((a) => (
              <button
                key={a}
                onClick={() => dispatch({ type: 'SET_COMMAND', payload: `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ${state.activeFunction} GO` })}
                className={`w-full text-left text-[9px] px-1 py-0.5 border-b border-[#142034] text-[#dbe7f7] ${
                  a.includes('[ACTIVE]') || a.includes('[SWEEP]') ? 'bg-[#2f1830] text-[#ffd5ff]' : ''
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
