'use client';

import React, { memo, useState } from 'react';
import { getField, parseOverrides } from '../../services/fieldEngine';

type RowKind = 'section' | 'line' | 'subtotal';

interface FARow {
  id: string;
  label: string;
  value?: number;
  kind: RowKind;
  children?: FARow[];
}

function formatM(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) return (n / 1000).toFixed(1) + 'B';
  return n.toFixed(0) + 'M';
}

const INCOME_STATEMENT: FARow[] = [
  {
    id: 'rev',
    label: 'Revenue',
    value: 394328,
    kind: 'line',
  },
  {
    id: 'cogs',
    label: 'Cost of Revenue',
    value: -214981,
    kind: 'line',
  },
  {
    id: 'gross',
    label: 'Gross Profit',
    value: 179347,
    kind: 'subtotal',
  },
  {
    id: 'opex',
    label: 'Operating Expenses',
    kind: 'section',
    children: [
      { id: 'rd', label: 'R&D', value: -29915, kind: 'line' },
      { id: 'sga', label: 'SG&A', value: -24932, kind: 'line' },
    ],
  },
  {
    id: 'opinc',
    label: 'Operating Income',
    value: 124500,
    kind: 'subtotal',
  },
  {
    id: 'other',
    label: 'Other Income (Expense)',
    kind: 'section',
    children: [
      { id: 'int', label: 'Interest Expense', value: -2931, kind: 'line' },
      { id: 'oth', label: 'Other, net', value: 1234, kind: 'line' },
    ],
  },
  {
    id: 'pretax',
    label: 'Income Before Tax',
    value: 122803,
    kind: 'subtotal',
  },
  {
    id: 'tax',
    label: 'Income Tax Expense',
    value: -19372,
    kind: 'line',
  },
  {
    id: 'net',
    label: 'Net Income',
    value: 103431,
    kind: 'subtotal',
  },
];

export interface FinancialAnalysisTableProps {
  className?: string;
  symbol?: string;
}

function FARowInner({
  row,
  depth,
  expanded,
  onToggle,
}: {
  row: FARow;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = row.children && row.children.length > 0;
  const isExpanded = expanded.has(row.id);
  const showChildren = hasChildren && isExpanded;

  return (
    <>
      <tr
        className="border-b border-[#222] hover:bg-[#0a0a0a]"
        style={{ fontSize: '10px' }}
      >
        <td className="px-2 py-1 align-top" style={{ paddingLeft: `${8 + depth * 12}px` }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(row.id)}
              className="w-4 h-4 inline-flex items-center justify-center mr-1 text-[#FFB000] hover:bg-[#222] border border-transparent"
              aria-expanded={isExpanded}
            >
              {isExpanded ? '−' : '+'}
            </button>
          ) : (
            <span className="w-4 inline-block" />
          )}
          <span className={row.kind === 'subtotal' ? 'font-semibold text-[#b0b8c4]' : 'text-[#888]'}>
            {row.label}
          </span>
        </td>
        <td className="px-2 py-1 text-right tabular-nums text-[#b0b8c4]">
          {row.value != null ? formatM(row.value) : '—'}
        </td>
      </tr>
      {showChildren &&
        row.children!.map((c) => (
          <FARowInner key={c.id} row={c} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
        ))}
    </>
  );
}

export const FinancialAnalysisTable = memo(function FinancialAnalysisTable({
  className = '',
  symbol = 'AAPL US Equity',
}: FinancialAnalysisTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['opex', 'other']));
  const [overrideInput, setOverrideInput] = useState('');
  const overrides = parseOverrides(overrideInput);
  const pe = getField(symbol, 'PE_RATIO', overrides);
  const mcap = getField(symbol, 'MARKET_CAP', overrides);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className={`flex flex-col min-w-0 min-h-0 overflow-auto bg-[#000000] border border-[#333] font-mono terminal-scrollbar ${className}`}
    >
      <div className="flex-none px-2 py-1 border-b border-[#333] text-[#FFB000] font-bold uppercase tracking-wider">
        FA • Income Statement
        <span className="ml-2 text-[9px] text-[#666] font-normal">
          PE {typeof pe === 'number' ? pe.toFixed(2) : 'n/a'} | MCAP {typeof mcap === 'number' ? (mcap / 1e12).toFixed(2) : 'n/a'}T
        </span>
      </div>
      <table className="w-full" style={{ borderCollapse: 'collapse', fontSize: '10px' }}>
        <thead>
          <tr className="border-b border-[#333] text-[#5a6b7a] text-[9px]">
            <th className="text-left px-2 py-1 w-[70%]">Line Item</th>
            <th className="text-right px-2 py-1">($M)</th>
          </tr>
        </thead>
        <tbody>
          {INCOME_STATEMENT.map((row) => (
            <FARowInner key={row.id} row={row} depth={0} expanded={expanded} onToggle={toggle} />
          ))}
        </tbody>
      </table>
      <div className="flex-none h-6 border-t border-[#333] px-2 flex items-center gap-2">
        <span className="text-[#FFB000] text-[9px] uppercase">Override</span>
        <input
          value={overrideInput}
          onChange={(e) => setOverrideInput(e.target.value.toUpperCase())}
          placeholder="PX=200"
          className="h-4 flex-1 bg-[#111] border border-[#333] px-1 text-[10px] text-[#FFB000] outline-none"
        />
      </div>
    </div>
  );
});
