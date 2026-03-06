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

  return (
    <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#000205] text-[#d7deea] font-mono bbg-hard-frame">
      <TopTickerBar />
      <CommandKeyBar />
      <CommandInputBar />
      <DeskStatusStrip />
      <FunctionHierarchyStrip />
      <FunctionRouter activeFunction={state.activeFunction} />
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
