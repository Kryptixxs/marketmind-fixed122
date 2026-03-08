'use client';

import React, { useEffect, useMemo, useState } from 'react';

const MENUS = {
  EQUITY: ['Top Stories', 'World Indices', 'Security Analysis'],
  CURNCY: ['FX Spot Board', 'Cross Matrix', 'Macro Drivers'],
  CORP: ['Credit Movers', 'Spread Monitor', 'Issuer Fundamentals'],
  INDEX: ['Index Breadth', 'Constituent Leaders', 'Volatility Surface'],
} as const;

export function SectorMenu({
  sector,
  onSelect,
}: {
  sector: 'EQUITY' | 'CORP' | 'CURNCY' | 'INDEX';
  onSelect: (idx: number) => void;
}) {
  const rows = useMemo(() => MENUS[sector], [sector]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '9') {
        const idx = Number(e.key) - 1;
        if (idx < rows.length) setSelected(idx);
      }
      if (e.key === 'Enter') {
        onSelect(selected);
      }
      if (e.key === 'ArrowDown') setSelected((s) => (s + 1) % rows.length);
      if (e.key === 'ArrowUp') setSelected((s) => (s - 1 + rows.length) % rows.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rows.length, selected, onSelect]);

  return (
    <div className="h-full bg-[#000] border border-[#333] font-mono text-[11px]">
      <div className="h-6 px-2 flex items-center border-b border-[#333] text-[#FFB000] font-bold uppercase">
        {sector} Menu
      </div>
      <div className="p-1">
        {rows.map((item, i) => (
          <div
            key={item}
            className={`h-6 px-2 flex items-center border-b border-[#111] ${selected === i ? 'bg-[#111] text-[#FFB000]' : 'text-[#CCC]'}`}
          >
            <span className="w-5 text-[#666]">{i + 1}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

