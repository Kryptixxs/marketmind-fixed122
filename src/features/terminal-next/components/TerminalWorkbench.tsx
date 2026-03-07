'use client';

import { useTerminalStore } from '../store/TerminalStore';
import { TerminalProvider } from '../store/TerminalStore';
import { CommandInputBar } from './CommandInputBar';
import { CommandKeyBar } from './CommandKeyBar';
import { DeskStatusStrip } from './DeskStatusStrip';
import { FooterSystemStrip } from './FooterSystemStrip';
import { FunctionRouter } from './FunctionRouter';
import { FunctionHierarchyStrip } from './FunctionHierarchyStrip';
import { TopTickerBar } from './TopTickerBar';

function TerminalWorkbenchBody() {
  const { state } = useTerminalStore();
  const telemetry = [
    `CLK ${state.tickMs}`,
    `Q${state.streamClock.quotes} D${state.streamClock.depth} E${state.streamClock.execution} F${state.streamClock.feed}`,
    `IMB ${(state.microstructure.imbalance * 100).toFixed(1)} OFI ${(state.microstructure.orderFlowImbalance * 100).toFixed(1)}`,
    `GROSS ${state.risk.grossExposure.toFixed(1)} NET ${state.risk.netExposure.toFixed(1)} VAR ${state.risk.intradayVar.toFixed(1)}`,
  ];

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#000205] text-[#d7deea] font-mono bbg-hard-frame">
      <TopTickerBar />
      <CommandKeyBar />
      <CommandInputBar />
      <DeskStatusStrip />
      <FunctionHierarchyStrip />
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20 text-[8px] text-[#39506e] tabular-nums p-1">
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: 80 }, (_, i) => (
              <div key={`bg-${i}`} className="truncate border-b border-[#0f1a2a] py-[1px]">
                {telemetry[i % telemetry.length]} | {state.quotes[i % Math.max(1, state.quotes.length)]?.symbol ?? '---'} | {(state.quotes[i % Math.max(1, state.quotes.length)]?.last ?? 0).toFixed(2)}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 h-full min-h-0">
          <FunctionRouter activeFunction={state.activeFunction} />
        </div>
      </div>
      <FooterSystemStrip />
    </div>
  );
}

export function TerminalWorkbench() {
  return (
    <TerminalProvider>
      <TerminalWorkbenchBody />
    </TerminalProvider>
  );
}
