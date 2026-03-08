'use client';

import React, { memo } from 'react';
import { clsx } from 'clsx';

export type FlashDirection = 'up' | 'down' | null;

export interface SuperTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render?: (row: T) => React.ReactNode;
  /** Column key for price-flash detection (e.g. 'last', 'pct', 'price') */
  flashKey?: string;
  /** Key for conditional coloring: positive=green, negative=red (e.g. 'pct', 'change') */
  toneKey?: string;
}

export interface SuperTableProps<T> {
  columns: SuperTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Map of rowId -> { columnKey -> 'up'|'down' } for flash coloring */
  flashMap?: Record<string, Record<string, FlashDirection>>;
  className?: string;
}

function alignClass(align?: 'left' | 'right' | 'center') {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

const SuperTableInner = <T,>({
  columns,
  rows,
  getRowId,
  flashMap = {},
  className = '',
}: SuperTableProps<T>) => {
  return (
    <div className={clsx('overflow-auto min-h-0 bg-[#000000]', className)}>
      <table
        className="w-full border-collapse font-mono text-[10px]"
        style={{ fontFamily: '"JetBrains Mono", "Roboto Mono", monospace' }}
      >
        <thead className="sticky top-0 bg-[#0a0a0a] z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  'px-[2px] py-[2px] font-bold uppercase tracking-wider border-b border-[#1a1a1a] text-[#5a6b7a] tabular-nums',
                  alignClass(col.align)
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowId = getRowId(row);
            const rowFlash = flashMap[rowId];

            return (
              <tr key={rowId} className="border-b border-[#0d0d0d] hover:bg-[#0a0a0a]">
                {columns.map((col) => {
                  const flash = col.flashKey && rowFlash?.[col.flashKey];
                  const value = col.render ? col.render(row) : (row as Record<string, unknown>)[col.key];
                  const isUp = flash === 'up';
                  const isDown = flash === 'down';
                  const raw = col.toneKey ? (row as Record<string, unknown>)[col.toneKey] : null;
                  const num = typeof raw === 'number' ? raw : null;
                  const toneClass =
                    isUp || isDown
                      ? ''
                      : num != null
                        ? num > 0
                          ? 'text-[#00FF00]'
                          : num < 0
                            ? 'text-[#FF0000]'
                            : 'text-[#5a6b7a]'
                        : 'text-[#b0b8c4]';

                  return (
                    <td
                      key={col.key}
                      className={clsx(
                        'px-[2px] py-[2px] tabular-nums border-b border-[#0d0d0d]',
                        alignClass(col.align),
                        isUp && 'bg-[#00FF0012] text-[#00FF00] super-table-flash-up',
                        isDown && 'bg-[#FF000012] text-[#FF0000] super-table-flash-down',
                        !isUp && !isDown && toneClass
                      )}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export const SuperTable = memo(SuperTableInner) as <T>(props: SuperTableProps<T>) => React.ReactElement;
