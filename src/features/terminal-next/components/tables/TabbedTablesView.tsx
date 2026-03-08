'use client';

import React, { useState } from 'react';
import { GlobalEquitiesTable, FXPairsTable, CommoditiesTable, BondYieldsTable } from './index';

const TABS = [
  { id: 'equities', label: 'Equities', Component: GlobalEquitiesTable },
  { id: 'fx', label: 'FX', Component: FXPairsTable },
  { id: 'commodities', label: 'Commodities', Component: CommoditiesTable },
  { id: 'bonds', label: 'Bonds', Component: BondYieldsTable },
] as const;

export function TabbedTablesView() {
  const [active, setActive] = useState<(typeof TABS)[number]['id']>('equities');
  const ActiveComponent = TABS.find((t) => t.id === active)!.Component;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#000000] border border-[#222]">
      <div className="flex-none flex border-b border-[#222]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`px-3 py-2 text-[11px] font-mono font-bold uppercase tracking-wider border-r border-[#222] last:border-r-0 ${
              active === tab.id
                ? 'bg-[#111] text-[#00FF00]'
                : 'bg-[#0a0a0a] text-[#5a6b7a] hover:text-[#888]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <ActiveComponent />
      </div>
    </div>
  );
}
