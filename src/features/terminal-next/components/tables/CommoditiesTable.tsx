'use client';

import React, { useMemo, useState } from 'react';
import { TerminalTable } from './TerminalTable/TerminalTable';
import { useTerminalStore } from '../../store/TerminalStore';
import { buildCommoditiesRows } from './data/commoditiesData';
import { BASE_COLUMNS } from './columns';

export function CommoditiesTable() {
  const { dispatch } = useTerminalStore();
  const [compact, setCompact] = useState(false);

  const rows = useMemo(() => buildCommoditiesRows(1000), []);

  const onRowSelect = (ticker: string) => {
    dispatch({ type: 'TICKER_SELECTED', payload: ticker });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-none flex items-center justify-between px-[4px] py-[2px] border-b border-[#222] bg-[#0a0a0a]">
        <span className="text-[11px] font-mono font-bold uppercase text-[#5a6b7a]">
          Commodities
        </span>
        <button
          type="button"
          onClick={() => setCompact((c) => !c)}
          className="text-[10px] font-mono px-2 py-0.5 border border-[#333] hover:border-[#555] text-[#666]"
        >
          {compact ? 'Standard' : 'Compact'}
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <TerminalTable
          columns={BASE_COLUMNS}
          rows={rows}
          onRowSelect={onRowSelect}
          compact={compact}
        />
      </div>
    </div>
  );
}
