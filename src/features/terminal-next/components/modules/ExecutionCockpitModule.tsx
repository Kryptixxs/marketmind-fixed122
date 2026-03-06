'use client';

import { AnalyticsPanel } from '../AnalyticsPanel';
import { BlotterPanel } from '../BlotterPanel';
import { CrossAssetMatrixPanel } from '../CrossAssetMatrixPanel';
import { FeedPanel } from '../FeedPanel';
import { MonitorPanel } from '../MonitorPanel';
import { RightRailPanel } from '../RightRailPanel';

export function ExecutionCockpitModule() {
  return (
    <div className="flex-1 min-h-0 grid grid-cols-[24%_48%_28%] grid-rows-[58%_42%] gap-px bg-[#1a2433]">
      <MonitorPanel />
      <AnalyticsPanel />
      <RightRailPanel />
      <CrossAssetMatrixPanel />
      <FeedPanel />
      <BlotterPanel />
    </div>
  );
}
