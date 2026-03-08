'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { DENSITY } from '../constants/layoutDensity';
import type { EntityRef } from './entities/types';
import { useDrill } from './entities/DrillContext';
import { openContextMenu } from './ui/ContextMenu';
import type { DrillIntent } from './entities/linkResolver';

/* ────── DenseTable — with EntityRefs + keyboard nav ────── */

export interface DenseColumn {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'right';
  tone?: boolean;
  flash?: boolean;
  format?: (v: unknown) => string;
  entity?: (row: Record<string, unknown>) => EntityRef | undefined;
}

export interface DenseTableProps {
  columns: DenseColumn[];
  rows: Array<Record<string, unknown>>;
  rowKey?: string;
  rowEntity?: (row: Record<string, unknown>) => EntityRef | undefined;
  flashMap?: Record<string, 'up' | 'down'>;
  onRowClick?: (row: Record<string, unknown>) => void;
  selectedRow?: number;
  compact?: boolean;
  className?: string;
  stickyHeader?: boolean;
  boldEveryNth?: number;
  panelIdx?: number;
  keyboardNav?: boolean;
}

export function DenseTable({
  columns, rows, rowKey = 'id', rowEntity, flashMap = {},
  onRowClick, selectedRow: externalSelected, compact, className = '',
  stickyHeader = true, boldEveryNth, panelIdx = 0, keyboardNav = true,
}: DenseTableProps) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: '', dir: 'asc' });
  const [internalSelected, setInternalSelected] = useState(externalSelected ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const drill = useDrill()?.drill;
  const rh = compact ? DENSITY.rowHeightCompactPx : DENSITY.rowHeightPx;

  const selected = externalSelected !== undefined ? externalSelected : internalSelected;

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    return [...rows].sort((a, b) => {
      const va = a[sort.key]; const vb = b[sort.key];
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  const toggleSort = useCallback((key: string) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  }, []);

  const handleRowAction = useCallback((row: Record<string, unknown>, intent: DrillIntent, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const entity = rowEntity?.(row);
    if (entity && drill) {
      drill(entity, intent, panelIdx);
    } else {
      onRowClick?.(row);
    }
  }, [rowEntity, drill, onRowClick, panelIdx]);

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardNav) return;
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      const focused = document.activeElement;
      if (!el.contains(focused) && focused !== el) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setInternalSelected((s) => Math.min(s + 1, sorted.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setInternalSelected((s) => Math.max(s - 1, 0));
      } else if ((e.key === 'Enter' || e.key === 'Return') && e.altKey) {
        e.preventDefault();
        const row = sorted[internalSelected];
        if (row) handleRowAction(row, 'INSPECT_OVERLAY');
      } else if ((e.key === 'Enter' || e.key === 'Return') && e.shiftKey) {
        e.preventDefault();
        const row = sorted[internalSelected];
        if (row) handleRowAction(row, 'OPEN_IN_NEW_PANEL');
      } else if (e.key === 'Enter' || e.key === 'Return') {
        e.preventDefault();
        const row = sorted[internalSelected];
        if (row) handleRowAction(row, 'OPEN_IN_PLACE');
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        el.scrollBy({ top: el.clientHeight, behavior: 'instant' as ScrollBehavior });
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        el.scrollBy({ top: -el.clientHeight, behavior: 'instant' as ScrollBehavior });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [keyboardNav, sorted, internalSelected, handleRowAction]);

  const gridCols = columns.map((c) => c.width ?? '1fr').join(' ');

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`flex flex-col min-h-0 outline-none ${className}`}
      style={{ fontFamily: DENSITY.fontFamily, fontSize: compact ? DENSITY.fontSizeTiny : DENSITY.fontSizeDefault }}
    >
      <div
        className="flex-none grid select-none"
        style={{ gridTemplateColumns: gridCols, height: rh + 2, background: DENSITY.bgSurfaceAlt, borderBottom: `1px solid ${DENSITY.borderColor}`, position: stickyHeader ? 'sticky' : undefined, top: 0, zIndex: 2 }}
      >
        {columns.map((col) => (
          <button
            key={col.key}
            type="button"
            onClick={() => toggleSort(col.key)}
            className="px-[2px] truncate flex items-center hover:text-white"
            style={{ textAlign: col.align ?? 'left', justifyContent: col.align === 'right' ? 'flex-end' : 'flex-start', color: sort.key === col.key ? DENSITY.accentAmber : DENSITY.textDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: DENSITY.fontSizeTiny }}
          >
            {col.header}{sort.key === col.key && (sort.dir === 'asc' ? ' ▲' : ' ▼')}
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        {sorted.map((row, ri) => {
          const rk = String(row[rowKey] ?? ri);
          const flash = flashMap[rk];
          const isBold = boldEveryNth ? (ri + 1) % boldEveryNth === 0 : false;
          const isSelected = ri === selected;
          return (
            <div
              key={rk}
              className={`grid items-center cursor-pointer
                ${isSelected ? 'bg-[#0068FF]/25 outline outline-1 outline-[#0068FF]/40' : ri % 2 === 1 ? 'bg-[#060606]' : ''}
                ${flash === 'up' ? 'cell-flash-up' : flash === 'down' ? 'cell-flash-down' : ''}
                hover:bg-[#0a1520]`}
              style={{ gridTemplateColumns: gridCols, height: rh, borderBottom: `1px solid ${DENSITY.gridlineColor}`, fontWeight: isBold ? 700 : 400 }}
              onClick={(e) => { setInternalSelected(ri); containerRef.current?.focus(); handleRowAction(row, e.shiftKey ? 'OPEN_IN_NEW_PANEL' : 'OPEN_IN_PLACE', e); }}
              onAuxClick={(e) => { if (e.button === 1) { setInternalSelected(ri); handleRowAction(row, 'INSPECT_OVERLAY', e); } }}
              onContextMenu={(e) => {
                const entity = rowEntity?.(row);
                if (entity) openContextMenu(e, entity, panelIdx);
                else e.preventDefault();
              }}
              title="Click: drill  •  Shift+Click: send to panel  •  Alt+Click: inspect  •  Right-Click: actions"
            >
              {columns.map((col) => {
                const val = row[col.key];
                const num = typeof val === 'number' ? val : null;
                let color = DENSITY.textPrimary;
                if (col.tone && num != null) color = num > 0 ? DENSITY.accentGreen : num < 0 ? DENSITY.accentRed : DENSITY.textPrimary;
                const formatted = col.format ? col.format(val) : val == null ? '—' : typeof val === 'number' ? val.toFixed(2) : String(val);
                const cellEntity = col.entity?.(row);
                return cellEntity ? (
                  <span
                    key={col.key}
                    className="px-[2px] truncate tabular-nums cursor-pointer hover:underline"
                    style={{ color: DENSITY.accentCyan, textAlign: col.align ?? 'left' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const intent: DrillIntent = e.shiftKey ? 'OPEN_IN_NEW_PANEL' : e.altKey ? 'INSPECT_OVERLAY' : 'OPEN_IN_PLACE';
                      drill?.(cellEntity, intent, panelIdx);
                    }}
                    title={`${cellEntity.display} — Click: drill  •  Shift+Click: send  •  Alt+Click: inspect`}
                  >{formatted}</span>
                ) : (
                  <span
                    key={col.key}
                    className="px-[2px] truncate tabular-nums"
                    style={{ color, textAlign: col.align ?? 'left' }}
                  >{formatted}</span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ────── KeyValueGrid — with clickable field entities ────── */

export interface KVPair {
  label: string;
  value: string | number;
  color?: string;
  entity?: EntityRef;
}

export function KeyValueGrid({ pairs, columns = 2, className = '', panelIdx = 0 }: { pairs: KVPair[]; columns?: number; className?: string; panelIdx?: number }) {
  const drill = useDrill()?.drill;
  return (
    <div className={`grid gap-x-4 gap-y-[2px] ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, auto 1fr)`, fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeDefault, padding: DENSITY.pad4 }}>
      {pairs.map((p) => (
        <React.Fragment key={p.label}>
          <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.label}</span>
          {p.entity ? (
            <span
              className="tabular-nums cursor-pointer hover:underline"
              style={{ color: DENSITY.accentCyan }}
              onClick={(e) => {
                const intent: DrillIntent = e.shiftKey ? 'OPEN_IN_NEW_PANEL' : e.altKey ? 'INSPECT_OVERLAY' : 'OPEN_IN_PLACE';
                drill?.(p.entity!, intent, panelIdx);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (p.entity) openContextMenu(e, p.entity, panelIdx);
              }}
              title="Click: drill  •  Shift+Click: send  •  Alt+Click: inspect  •  Right-click: actions"
            >
              {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            </span>
          ) : (
            <span className="tabular-nums" style={{ color: p.color ?? DENSITY.textPrimary }}>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ────── PanelSubHeader ────── */

export function PanelSubHeader({ title, right, className = '' }: { title: string; right?: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center justify-between flex-none select-none ${className}`}
      style={{ height: DENSITY.panelHeaderHeightPx, background: DENSITY.bgSurfaceAlt, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily, color: DENSITY.accentAmber, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
    >
      <span className="truncate">{title}</span>
      {right}
    </div>
  );
}

/* ────── StatusBadge ────── */

export function StatusBadge({ label, variant = 'default' }: { label: string; variant?: 'default' | 'live' | 'stale' | 'sim' }) {
  const colors = { default: DENSITY.textMuted, live: DENSITY.accentGreen, stale: DENSITY.accentRed, sim: DENSITY.accentCyan };
  return (
    <span style={{ fontSize: DENSITY.fontSizeTiny, color: colors[variant], border: `1px solid ${colors[variant]}`, padding: '0 3px', fontFamily: DENSITY.fontFamily }}>{label}</span>
  );
}

/* ────── EmptyFill ────── */

export function EmptyFill({ hint }: { hint: string }) {
  return (
    <div className="flex-1 min-h-0 flex items-center justify-center" style={{ fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeMicro, color: DENSITY.textMuted, padding: DENSITY.pad4 }}>
      {hint}
    </div>
  );
}

/* ────── NewsListItem — with EntityRef emission ────── */

export interface NewsItem {
  id: string;
  headline: string;
  time: string;
  src: string;
  tag?: string;
  urgency?: 'normal' | 'top' | 'flash';
  entity?: EntityRef;
}

export function NewsListItem({ item, panelIdx = 0, idx = 0 }: { item: NewsItem; panelIdx?: number; idx?: number }) {
  const drill = useDrill()?.drill;
  return (
    <div
      className="flex items-start gap-1 cursor-pointer hover:bg-[#0a1520]"
      style={{ padding: `${DENSITY.pad2}px ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: idx % 2 === 1 ? '#060606' : DENSITY.bgBase, minHeight: DENSITY.rowHeightPx }}
      onClick={(e) => {
        if (!item.entity && !drill) return;
        const intent: DrillIntent = e.shiftKey ? 'OPEN_IN_NEW_PANEL' : e.altKey ? 'INSPECT_OVERLAY' : 'OPEN_IN_PLACE';
        if (item.entity && drill) drill(item.entity, intent, panelIdx);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (item.entity) openContextMenu(e, item.entity, panelIdx);
      }}
      title="Click: drill  •  Shift+Click: send  •  Alt+Click: inspect  •  Right-click: actions"
    >
      <span className="shrink-0 tabular-nums" style={{ color: DENSITY.accentAmber, width: 75, fontSize: DENSITY.fontSizeTiny }}>{item.time}</span>
      <span className="shrink-0" style={{ color: DENSITY.accentCyan, width: 28, fontSize: DENSITY.fontSizeTiny }}>{item.src}</span>
      {item.tag && <span className="shrink-0" style={{ color: DENSITY.textMuted, width: 44, fontSize: '8px' }}>{item.tag}</span>}
      {item.urgency === 'flash' && <span style={{ color: '#fff', background: DENSITY.accentRed, fontSize: '8px', fontWeight: 700, padding: '0 2px', flexShrink: 0 }}>FLASH</span>}
      {item.urgency === 'top' && <span style={{ color: DENSITY.accentRed, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, flexShrink: 0 }}>TOP</span>}
      <span className="flex-1" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, lineHeight: 1.1 }}>{item.headline}</span>
    </div>
  );
}
