'use client';

import React from 'react';
import { GlobalEquitiesTable } from './tables/GlobalEquitiesTable';
import { SectorAllocation, NewsWire, TechnicalChart, EconomicCalendar } from './visualizations';

/**
 * 2x2 Visualization Dashboard:
 * - Top-Left: Equities Table
 * - Top-Right: Sector Heatmap + News Wire
 * - Bottom-Left: Advanced Technical Chart
 * - Bottom-Right: Economic Calendar
 */
export function VisualizationDashboard() {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-px h-full min-h-0 bg-[#222]">
      {/* Top-Left: Equities Table */}
      <div className="min-h-0 overflow-hidden bg-[#000000] border border-[#222]">
        <GlobalEquitiesTable />
      </div>

      {/* Top-Right: Sector Heatmap + News */}
      <div className="min-h-0 overflow-hidden bg-[#000000] border border-[#222] flex">
        <div className="flex-none w-[140px] flex items-center justify-center p-2 border-r border-[#222] shrink-0">
          <SectorAllocation size={120} />
        </div>
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          <NewsWire maxHeight="100%" />
        </div>
      </div>

      {/* Bottom-Left: Advanced Chart */}
      <div className="min-h-0 overflow-hidden bg-[#000000] border border-[#222] col-span-1">
        <TechnicalChart height={260} />
      </div>

      {/* Bottom-Right: Economic Calendar */}
      <div className="min-h-0 overflow-hidden bg-[#000000] border border-[#222]">
        <EconomicCalendar maxHeight="260px" />
      </div>
    </div>
  );
}
