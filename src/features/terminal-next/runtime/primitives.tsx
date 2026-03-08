'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { DENSITY } from '../constants/layoutDensity';
import type { EntityRef } from './entities/types';
import { useDrill } from './entities/DrillContext';
import { openContextMenu, openContextMenuAt } from './ui/ContextMenu';
import { makeFunction } from './entities/types';
import type { DrillIntent } from './entities/linkResolver';
import { intentFromMouseEvent, INTERACTION_HINT } from './interaction';
import { getDockLayout } from './dockLayoutStore';
import { fieldBadgeLabel } from '../services/fieldRuntime';

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
  invokeRowClickWithEntity?: boolean;
  onRowDoubleClick?: (row: Record<string, unknown>) => void;
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
  onRowClick, invokeRowClickWithEntity = false, onRowDoubleClick, selectedRow: externalSelected, compact, className = '',
  stickyHeader = true, boldEveryNth, panelIdx = 0, keyboardNav = true,
}: DenseTableProps) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: '', dir: 'asc' });
  const [internalSelected, setInternalSelected] = useState(externalSelected ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const drill = useDrill()?.drill;
  const layout = getDockLayout();
  const highDensity = layout.highDensityMode || layout.highDensityLiveMode;
  const rh = compact || highDensity ? DENSITY.rowHeightCompactPx : DENSITY.rowHeightPx;
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(360);
  const [cellFlash, setCellFlash] = useState<Record<string, 'up' | 'down'>>({});
  const flashTimersRef = useRef<Record<string, number>>({});
  const prevNumericRef = useRef<Record<string, number>>({});

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
      if (invokeRowClickWithEntity) onRowClick?.(row);
    } else {
      onRowClick?.(row);
    }
  }, [rowEntity, drill, onRowClick, panelIdx, invokeRowClickWithEntity]);

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
        if (row) handleRowAction(row, 'OPEN_IN_NEW_PANE');
      } else if (e.key === 'Enter' || e.key === 'Return') {
        e.preventDefault();
        const row = sorted[internalSelected];
        if (row) handleRowAction(row, 'OPEN_IN_PLACE');
      } else if (e.key === 'F2') {
        const row = sorted[internalSelected];
        if (!row) return;
        e.preventDefault();
        const entity = rowEntity?.(row) ?? columns.map((c) => c.entity?.(row)).find(Boolean);
        if (!entity) return;
        const rect = el.getBoundingClientRect();
        openContextMenuAt(Math.round(rect.left + rect.width * 0.6), Math.round(rect.top + Math.min(rect.height - 18, 80)), entity, panelIdx);
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
  const virtualize = sorted.length > 120;
  const overscan = highDensity ? 18 : 12;
  const visibleCount = Math.max(1, Math.ceil(viewportH / rh) + overscan);
  const startIdx = virtualize ? Math.max(0, Math.floor(scrollTop / rh) - Math.floor(overscan / 2)) : 0;
  const endIdx = virtualize ? Math.min(sorted.length, startIdx + visibleCount) : sorted.length;
  const visibleRows = virtualize ? sorted.slice(startIdx, endIdx) : sorted;

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const update = () => setViewportH(el.clientHeight || 360);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const nextFlash: Record<string, 'up' | 'down'> = {};
    const nextNumeric: Record<string, number> = {};
    for (let ri = 0; ri < sorted.length; ri += 1) {
      const row = sorted[ri]!;
      const rk = String(row[rowKey] ?? ri);
      for (const col of columns) {
        const val = row[col.key];
        if (typeof val !== 'number') continue;
        const k = `${rk}:${col.key}`;
        nextNumeric[k] = val;
        const prev = prevNumericRef.current[k];
        if (prev == null || prev === val) continue;
        nextFlash[k] = val > prev ? 'up' : 'down';
      }
    }
    prevNumericRef.current = nextNumeric;
    if (Object.keys(nextFlash).length === 0) return;
    setCellFlash((prev) => ({ ...prev, ...nextFlash }));
    Object.entries(nextFlash).forEach(([k]) => {
      const prior = flashTimersRef.current[k];
      if (prior) window.clearTimeout(prior);
      flashTimersRef.current[k] = window.setTimeout(() => {
        setCellFlash((prev) => {
          if (!(k in prev)) return prev;
          const { [k]: _, ...rest } = prev;
          return rest;
        });
      }, 150);
    });
    return () => {
      Object.values(flashTimersRef.current).forEach((id) => window.clearTimeout(id));
    };
  }, [sorted, columns, rowKey]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className={`flex flex-col min-h-0 outline-none ${className}`}
      style={{ fontFamily: DENSITY.fontFamily, fontSize: compact || highDensity ? DENSITY.fontSizeTiny : DENSITY.fontSizeDefault, contentVisibility: highDensity ? 'auto' : undefined, containIntrinsicSize: highDensity ? '400px' : undefined }}
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
      <div
        ref={bodyRef}
        className="flex-1 min-h-0 overflow-auto terminal-scrollbar"
        onScroll={(e) => setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)}
      >
        {virtualize ? <div style={{ height: sorted.length * rh, position: 'relative' }}><div style={{ position: 'absolute', left: 0, right: 0, top: startIdx * rh }}>
        {visibleRows.map((row, vi) => {
          const ri = startIdx + vi;
          const rk = String(row[rowKey] ?? ri);
          const flash = flashMap[rk];
          const isBold = boldEveryNth ? (ri + 1) % boldEveryNth === 0 : false;
          const isSelected = ri === selected;
          const groupEvery = boldEveryNth ?? 5;
          const hasGroupBreak = ri > 0 && ri % groupEvery === 0;
          return (
            <div
              key={rk}
              className={`grid items-center cursor-pointer
                ${isSelected ? '' : ri % 2 === 1 ? '' : ''}
                ${flash === 'up' ? 'cell-flash-up' : flash === 'down' ? 'cell-flash-down' : ''}
                `}
              style={{
                gridTemplateColumns: gridCols,
                height: rh,
                borderBottom: `1px solid ${DENSITY.gridlineColor}`,
                borderTop: hasGroupBreak ? `1px solid ${DENSITY.groupSeparator}` : undefined,
                fontWeight: isBold ? 700 : 400,
                background: isSelected ? DENSITY.rowSelectedBg : ri % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg,
                boxShadow: isSelected ? `inset 2px 0 0 ${DENSITY.rowSelectedMarker}` : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = DENSITY.rowHover;
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = ri % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg;
              }}
              onClick={(e) => {
                setInternalSelected(ri);
                containerRef.current?.focus();
                handleRowAction(row, intentFromMouseEvent(e), e);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRowDoubleClick?.(row);
              }}
              onAuxClick={(e) => { if (e.button === 1) { setInternalSelected(ri); handleRowAction(row, 'INSPECT_OVERLAY', e); } }}
              onContextMenu={(e) => {
                const entity = rowEntity?.(row);
                if (entity) openContextMenu(e, entity, panelIdx);
                else e.preventDefault();
              }}
              title={INTERACTION_HINT}
            >
              {columns.map((col) => {
                const val = row[col.key];
                const num = typeof val === 'number' ? val : null;
                const isNumericLike = typeof val === 'number';
                const effectiveAlign = col.align ?? (isNumericLike ? 'right' : 'left');
                let color: string = DENSITY.textPrimary;
                if (col.tone && num != null) color = num > 0 ? DENSITY.accentGreen : num < 0 ? DENSITY.accentRed : DENSITY.textPrimary;
                const formatted = col.format ? col.format(val) : val == null ? '—' : typeof val === 'number' ? val.toFixed(2) : String(val);
                const cellEntity = col.entity?.(row);
                const cellFlashKey = `${rk}:${col.key}`;
                const tone = cellFlash[cellFlashKey];
                const flashBg = tone ? (tone === 'up' ? 'rgba(57,255,114,0.18)' : 'rgba(255,68,68,0.18)') : 'transparent';
                return cellEntity ? (
                  <span
                    key={col.key}
                    className="px-[2px] truncate tabular-nums cursor-pointer hover:underline inline-flex items-center gap-1"
                    style={{ color: DENSITY.accentCyan, textAlign: effectiveAlign, background: flashBg, transition: 'background 120ms linear' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const intent: DrillIntent = intentFromMouseEvent(e);
                      drill?.(cellEntity, intent, panelIdx);
                    }}
                    title={`${cellEntity.display} — ${INTERACTION_HINT}`}
                  >
                    <span>{formatted}</span>
                    {cellEntity.kind === 'FIELD' && (
                      <span
                        style={{
                          color: fieldBadgeLabel(cellEntity) === 'STALE' ? DENSITY.accentRed : DENSITY.textDim,
                          border: `1px solid ${fieldBadgeLabel(cellEntity) === 'STALE' ? DENSITY.accentRed : DENSITY.borderColor}`,
                          padding: '0 2px',
                          fontSize: DENSITY.fontSizeMicro,
                          lineHeight: 1.1,
                        }}
                      >
                        {fieldBadgeLabel(cellEntity)}
                      </span>
                    )}
                  </span>
                ) : (
                  <span
                    key={col.key}
                    className="px-[2px] truncate tabular-nums"
                    style={{ color, textAlign: effectiveAlign, background: flashBg, transition: 'background 120ms linear' }}
                  >{formatted}</span>
                );
              })}
            </div>
          );
        })}
        </div></div> : sorted.map((row, ri) => {
          const rk = String(row[rowKey] ?? ri);
          const flash = flashMap[rk];
          const isBold = boldEveryNth ? (ri + 1) % boldEveryNth === 0 : false;
          const isSelected = ri === selected;
          const groupEvery = boldEveryNth ?? 5;
          const hasGroupBreak = ri > 0 && ri % groupEvery === 0;
          return (
            <div
              key={rk}
              className={`grid items-center cursor-pointer
                ${isSelected ? '' : ri % 2 === 1 ? '' : ''}
                ${flash === 'up' ? 'cell-flash-up' : flash === 'down' ? 'cell-flash-down' : ''}
                `}
              style={{
                gridTemplateColumns: gridCols,
                height: rh,
                borderBottom: `1px solid ${DENSITY.gridlineColor}`,
                borderTop: hasGroupBreak ? `1px solid ${DENSITY.groupSeparator}` : undefined,
                fontWeight: isBold ? 700 : 400,
                background: isSelected ? DENSITY.rowSelectedBg : ri % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg,
                boxShadow: isSelected ? `inset 2px 0 0 ${DENSITY.rowSelectedMarker}` : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = DENSITY.rowHover;
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = ri % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg;
              }}
              onClick={(e) => {
                setInternalSelected(ri);
                containerRef.current?.focus();
                handleRowAction(row, intentFromMouseEvent(e), e);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onRowDoubleClick?.(row);
              }}
              onAuxClick={(e) => { if (e.button === 1) { setInternalSelected(ri); handleRowAction(row, 'INSPECT_OVERLAY', e); } }}
              onContextMenu={(e) => {
                const entity = rowEntity?.(row);
                if (entity) openContextMenu(e, entity, panelIdx);
                else e.preventDefault();
              }}
              title={INTERACTION_HINT}
            >
              {columns.map((col) => {
                const val = row[col.key];
                const num = typeof val === 'number' ? val : null;
                const isNumericLike = typeof val === 'number';
                const effectiveAlign = col.align ?? (isNumericLike ? 'right' : 'left');
                let color: string = DENSITY.textPrimary;
                if (col.tone && num != null) color = num > 0 ? DENSITY.accentGreen : num < 0 ? DENSITY.accentRed : DENSITY.textPrimary;
                const formatted = col.format ? col.format(val) : val == null ? '—' : typeof val === 'number' ? val.toFixed(2) : String(val);
                const cellEntity = col.entity?.(row);
                const cellFlashKey = `${rk}:${col.key}`;
                const tone = cellFlash[cellFlashKey];
                const flashBg = tone ? (tone === 'up' ? 'rgba(57,255,114,0.18)' : 'rgba(255,68,68,0.18)') : 'transparent';
                return cellEntity ? (
                  <span
                    key={col.key}
                    className="px-[2px] truncate tabular-nums cursor-pointer hover:underline inline-flex items-center gap-1"
                    style={{ color: DENSITY.accentCyan, textAlign: effectiveAlign, background: flashBg, transition: 'background 120ms linear' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const intent: DrillIntent = intentFromMouseEvent(e);
                      drill?.(cellEntity, intent, panelIdx);
                    }}
                    title={`${cellEntity.display} — ${INTERACTION_HINT}`}
                  >
                    <span>{formatted}</span>
                    {cellEntity.kind === 'FIELD' && (
                      <span
                        style={{
                          color: fieldBadgeLabel(cellEntity) === 'STALE' ? DENSITY.accentRed : DENSITY.textDim,
                          border: `1px solid ${fieldBadgeLabel(cellEntity) === 'STALE' ? DENSITY.accentRed : DENSITY.borderColor}`,
                          padding: '0 2px',
                          fontSize: DENSITY.fontSizeMicro,
                          lineHeight: 1.1,
                        }}
                      >
                        {fieldBadgeLabel(cellEntity)}
                      </span>
                    )}
                  </span>
                ) : (
                  <span
                    key={col.key}
                    className="px-[2px] truncate tabular-nums"
                    style={{ color, textAlign: effectiveAlign, background: flashBg, transition: 'background 120ms linear' }}
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
          <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.label}</span>
          {p.entity ? (
            <span
              className="tabular-nums cursor-pointer hover:underline inline-flex items-center gap-1"
              style={{ color: DENSITY.accentCyan }}
              onClick={(e) => {
                const intent: DrillIntent = intentFromMouseEvent(e);
                drill?.(p.entity!, intent, panelIdx);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (p.entity) openContextMenu(e, p.entity, panelIdx);
              }}
              title={INTERACTION_HINT}
            >
              <span>{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
              {p.entity.kind === 'FIELD' && (
                <span
                  style={{
                    color: fieldBadgeLabel(p.entity) === 'STALE' ? DENSITY.accentRed : DENSITY.textDim,
                    border: `1px solid ${fieldBadgeLabel(p.entity) === 'STALE' ? DENSITY.accentRed : DENSITY.borderColor}`,
                    padding: '0 2px',
                    fontSize: DENSITY.fontSizeMicro,
                    lineHeight: 1.1,
                  }}
                >
                  {fieldBadgeLabel(p.entity)}
                </span>
              )}
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
  const isGroupBreak = idx > 0 && idx % 5 === 0;
  return (
    <div
      className="flex items-start gap-1 cursor-pointer"
      style={{
        padding: `${DENSITY.pad2}px ${DENSITY.pad4}px`,
        borderBottom: `1px solid ${DENSITY.gridlineColor}`,
        borderTop: isGroupBreak ? `1px solid ${DENSITY.groupSeparator}` : undefined,
        background: idx % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg,
        minHeight: DENSITY.rowHeightPx,
        boxShadow: `inset 0 0 0 0 transparent`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = DENSITY.rowHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 1 ? DENSITY.rowZebra : DENSITY.panelBg; }}
      onClick={(e) => {
        if (!item.entity && !drill) return;
        const intent: DrillIntent = intentFromMouseEvent(e);
        if (item.entity && drill) drill(item.entity, intent, panelIdx);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (item.entity) openContextMenu(e, item.entity, panelIdx);
      }}
      title={INTERACTION_HINT}
    >
      <span className="shrink-0 tabular-nums" style={{ color: DENSITY.accentAmber, width: 75, fontSize: DENSITY.fontSizeTiny }}>{item.time}</span>
      <span className="shrink-0" style={{ color: DENSITY.accentCyan, width: 28, fontSize: DENSITY.fontSizeTiny }}>{item.src}</span>
      {item.tag && (
        <span
          className="shrink-0 cursor-pointer hover:underline"
          style={{ color: DENSITY.textDim, width: 44, fontSize: '8px' }}
          onClick={(e) => {
            e.stopPropagation();
            drill?.(makeFunction('NREL', item.tag), intentFromMouseEvent(e), panelIdx);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            openContextMenu(e, makeFunction('NREL', item.tag), panelIdx);
          }}
          title={INTERACTION_HINT}
        >
          {item.tag}
        </span>
      )}
      {item.urgency === 'flash' && <span style={{ color: '#fff', background: DENSITY.accentRed, fontSize: '8px', fontWeight: 700, padding: '0 2px', flexShrink: 0 }}>FLASH</span>}
      {item.urgency === 'top' && <span style={{ color: DENSITY.accentRed, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, flexShrink: 0 }}>TOP</span>}
      <span className="flex-1" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, lineHeight: 1.1 }}>{item.headline}</span>
    </div>
  );
}
