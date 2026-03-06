'use client';

import { TerminalProvider } from '../store/TerminalStore';
import { AnalyticsPanel } from './AnalyticsPanel';
import { BlotterPanel } from './BlotterPanel';
import { CommandInputBar } from './CommandInputBar';
import { CommandKeyBar } from './CommandKeyBar';
import { CrossAssetMatrixPanel } from './CrossAssetMatrixPanel';
import { DeskStatusStrip } from './DeskStatusStrip';
import { FeedPanel } from './FeedPanel';
import { FooterSystemStrip } from './FooterSystemStrip';
import { MonitorPanel } from './MonitorPanel';
import { RightRailPanel } from './RightRailPanel';
import { TopTickerBar } from './TopTickerBar';

export function TerminalWorkbench() {
  return (
    <TerminalProvider>
      <div className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-[#05080d] text-[#d7deea] font-mono">
        <TopTickerBar />
        <CommandKeyBar />
        <CommandInputBar />
        <DeskStatusStrip />

        <div className="flex-1 min-h-0 grid grid-cols-[24%_48%_28%] grid-rows-[58%_42%] gap-px bg-[#1a2433]">
          <MonitorPanel />
          <AnalyticsPanel />
          <RightRailPanel />
          <CrossAssetMatrixPanel />
          <FeedPanel />
          <BlotterPanel />
        </div>

        <FooterSystemStrip />
      </div>
    </TerminalProvider>
  );
}
