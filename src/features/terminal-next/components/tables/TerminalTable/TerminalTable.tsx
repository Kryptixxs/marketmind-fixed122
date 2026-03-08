'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { FlashMap, SortDir, SortKey, TerminalTableColumn, TerminalTableRow } from './types';

export interface TerminalTableProps {
  columns: TerminalTableColumn[];
  rows: TerminalTableRow[];
  flashMap?: FlashMap;
  onRowSelect?: (ticker: string) => void;
  compact?: boolean;
  className?: string;
}

const ROW_HEIGHT_STANDARD = 22;
const ROW_HEIGHT_COMPACT = 16;

const FONT = "11px 'JetBrains Mono', 'Roboto Mono', monospace";
const FONT_COMPACT = "10px 'JetBrains Mono', 'Roboto Mono', monospace";

function formatCellValue(row: TerminalTableRow, col: TerminalTableColumn): string {
  if (col.key === 'ticker') return row.ticker;
  if (col.key === 'price') return row.price.toFixed(2);
  if (col.key === 'change') return row.change >= 0 ? `+${row.change.toFixed(2)}` : row.change.toFixed(2);
  if (col.key === 'pctChange') {
    const pct = row.pctChange;
    return pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`;
  }
  if (col.key === 'volume') {
    return row.volume >= 1e6
      ? `${(row.volume / 1e6).toFixed(2)}M`
      : row.volume >= 1e3
        ? `${(row.volume / 1e3).toFixed(1)}K`
        : String(row.volume);
  }
  if (col.key === 'sparkline') return '';
  return String((row as unknown as Record<string, unknown>)[col.key] ?? '');
}

function getCellColor(
  row: TerminalTableRow,
  col: TerminalTableColumn,
  flashMap: FlashMap
): string {
  const rowFlash = flashMap[row.id] ?? {};
  const flash = col.flashKey ? rowFlash[col.flashKey] : null;
  if (flash === 'up') return '#00FF00';
  if (flash === 'down') return '#FF0000';
  const toneVal = col.toneKey ? row[col.toneKey] : null;
  const num = typeof toneVal === 'number' ? toneVal : null;
  if (num != null) {
    if (num > 0) return '#00FF00';
    if (num < 0) return '#FF0000';
    return '#FFFFFF';
  }
  return '#b0b8c4';
}

function drawSparkline(
  ctx: CanvasRenderingContext2D,
  data: number[],
  x: number,
  y: number,
  w: number,
  h: number,
  trend: 'up' | 'down' | 'flat'
) {
  if (!data.length) return;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const gw = w - pad * 2;
  const gh = h - pad * 2;
  const step = data.length > 1 ? gw / (data.length - 1) : 0;
  ctx.strokeStyle = trend === 'up' ? '#00FF00' : trend === 'down' ? '#FF0000' : '#666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const px = x + pad + i * step;
    const py = y + pad + gh - ((data[i]! - min) / range) * gh;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
}

export function TerminalTable({
  columns,
  rows,
  flashMap = {},
  onRowSelect,
  compact = false,
  className = '',
}: TerminalTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'ticker',
    dir: 'asc',
  });
  const [hoverRowIndex, setHoverRowIndex] = useState<number | null>(null);
  const lastPaintMetaRef = useRef<{ key: string; rowSignatures: string[] }>({ key: '', rowSignatures: [] });

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const vA = a[sort.key];
      const vB = b[sort.key];
      const cmp =
        typeof vA === 'string'
          ? (vA as string).localeCompare(vB as string)
          : (vA as number) - (vB as number);
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  const rowHeight = compact ? ROW_HEIGHT_COMPACT : ROW_HEIGHT_STANDARD;
  const headerHeight = compact ? 18 : 24;
  const totalHeight = sortedRows.length * rowHeight;
  const sparklineWidth = 48;

  const computeColumnWidths = useCallback(
    (containerWidth: number): number[] => {
      const flexCols = columns.map((c) => {
        if (c.key === 'sparkline') return sparklineWidth;
        const w = c.width;
        if (w && w.endsWith('px')) return parseInt(w, 10) || 80;
        return 0;
      });
      const fixedTotal = flexCols.reduce((s, c) => s + (c > 0 ? c : 0), 0);
      const flexCount = flexCols.filter((c) => c === 0).length || 1;
      const flexWidth = Math.max(0, (containerWidth - fixedTotal) / flexCount);
      return flexCols.map((c) => (c > 0 ? c : flexWidth));
    },
    [columns]
  );

  const handleSort = useCallback(
    (key: SortKey | string) => {
      if (key === 'sparkline') return;
      setSort((s) => ({
        key: key as SortKey,
        dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc',
      }));
    },
    []
  );

  const handleRowClick = useCallback(
    (ticker: string) => {
      onRowSelect?.(ticker);
    },
    [onRowSelect]
  );

  const pageDown = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: rowHeight * 20, behavior: 'instant' });
  }, [rowHeight]);

  const pageUp = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: -rowHeight * 20, behavior: 'instant' });
  }, [rowHeight]);

  const paint = useCallback(() => {
    const scrollEl = scrollRef.current;
    const canvas = canvasRef.current;
    if (!scrollEl || !canvas) return;

    const rect = scrollEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const scrollTop = scrollEl.scrollTop;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const columnWidths = computeColumnWidths(w);
    const xOffsets: number[] = [];
    let x = 0;
    for (const cw of columnWidths) {
      xOffsets.push(x);
      x += cw;
    }
    xOffsets.push(w);

    ctx.font = compact ? FONT_COMPACT : FONT;
    ctx.textBaseline = 'middle';

    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight));
    const endRow = Math.min(sortedRows.length, Math.ceil((scrollTop + h) / rowHeight) + 1);
    const paintKey = `${w}|${h}|${startRow}|${endRow}|${hoverRowIndex ?? -1}|${sort.key}|${sort.dir}`;
    const nextRowSignatures = sortedRows
      .slice(startRow, endRow)
      .map((r) => `${r.id}|${r.price}|${r.change}|${r.pctChange}|${(flashMap[r.id]?.change ?? '')}`);
    const prevMeta = lastPaintMetaRef.current;
    const unchangedRows = prevMeta.rowSignatures.length === nextRowSignatures.length
      && prevMeta.rowSignatures.every((s, i) => s === nextRowSignatures[i]);
    if (prevMeta.key === paintKey && unchangedRows) {
      return;
    }
    lastPaintMetaRef.current = { key: paintKey, rowSignatures: nextRowSignatures };

    ctx.clearRect(0, 0, w, h);

    for (let r = startRow; r < endRow; r++) {
      const row = sortedRows[r];
      if (!row) continue;
      const rowY = r * rowHeight - scrollTop;
      const isHover = hoverRowIndex === r;

      if (isHover) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, rowY, w, rowHeight);
      }

      ctx.fillStyle = '#111';
      ctx.fillRect(0, rowY + rowHeight - 1, w, 1);

      for (let c = 0; c < columns.length; c++) {
        const col = columns[c]!;
        const x0 = xOffsets[c]!;
        const cellW = xOffsets[c + 1]! - x0;
        const pad = 4;
        const textX = col.align === 'right' ? x0 + cellW - pad : x0 + pad;

        if (col.key === 'sparkline') {
          drawSparkline(
            ctx,
            row.sparkline,
            x0,
            rowY,
            cellW,
            rowHeight,
            row.pctChange > 0 ? 'up' : row.pctChange < 0 ? 'down' : 'flat'
          );
          continue;
        }

        const text = formatCellValue(row, col);
        ctx.fillStyle = getCellColor(row, col, flashMap);
        ctx.textAlign = col.align === 'right' ? 'right' : 'left';
        ctx.fillText(text, textX, rowY + rowHeight / 2);
      }
    }
  }, [sortedRows, columns, computeColumnWidths, rowHeight, compact, flashMap, hoverRowIndex, sort]);

  useLayoutEffect(() => {
    paint();
  }, [paint]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => paint();
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [paint]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => paint());
    ro.observe(el);
    return () => ro.disconnect();
  }, [paint]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clickY = e.clientY - rect.top + scrollEl.scrollTop;
      const rowIndex = Math.floor(clickY / rowHeight);
      const row = sortedRows[rowIndex];
      if (row) handleRowClick(row.ticker);
    },
    [rowHeight, sortedRows, handleRowClick]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseY = e.clientY - rect.top + scrollEl.scrollTop;
      const rowIndex = Math.floor(mouseY / rowHeight);
      const clamped = rowIndex >= 0 && rowIndex < sortedRows.length ? rowIndex : null;
      setHoverRowIndex(clamped);
    },
    [rowHeight, sortedRows.length]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    setHoverRowIndex(null);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const pageHeight = el.clientHeight;
      if (e.deltaY > 0) {
        el.scrollBy({ top: Math.min(pageHeight, e.deltaY), behavior: 'instant' });
      } else {
        el.scrollBy({ top: Math.max(-pageHeight, e.deltaY), behavior: 'instant' });
      }
    };
    el.addEventListener('wheel', wheelHandler, { passive: false });
    return () => el.removeEventListener('wheel', wheelHandler);
  }, []);

  useEffect(() => {
    const tableEl = scrollRef.current?.closest('.terminal-table');
    if (!tableEl || !scrollRef.current) return;
    const el = scrollRef.current;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as Node;
      if (!tableEl.contains(target)) return;
      if (e.key === 'PageDown') {
        e.preventDefault();
        pageDown();
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        pageUp();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pageDown, pageUp]);

  const gridCols = columns.map((c) => c.width ?? '1fr').join(' ');

  return (
    <div
      className={clsx(
        'terminal-table flex flex-col min-h-0 bg-[#000000] border border-[#222]',
        className
      )}
      style={{ fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace", fontSize: compact ? 10 : 11 }}
    >
      <div className="flex-none flex items-center gap-1 px-1 py-0.5 border-b border-[#222] shrink-0 bg-[#0a0a0a]">
        <button
          type="button"
          onClick={pageUp}
          className="h-[18px] px-1.5 text-[9px] font-bold text-[#666] hover:text-[#FFB000] border border-[#333] hover:border-[#555]"
          title="Page Back"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={pageDown}
          className="h-[18px] px-1.5 text-[9px] font-bold text-[#666] hover:text-[#FFB000] border border-[#333] hover:border-[#555]"
          title="Page Fwd"
        >
          ▶
        </button>
      </div>
      <div
        className="flex-none flex bg-[#0a0a0a] border-b border-[#222] shrink-0"
        style={{ height: headerHeight, display: 'grid', gridTemplateColumns: gridCols }}
      >
        {columns.map((col) => (
          <button
            key={col.key}
            type="button"
            onClick={() => handleSort(col.key)}
            className={clsx(
              'px-[4px] text-left font-bold uppercase tracking-wider hover:text-[#888] transition-colors flex items-center',
              sort.key === col.key ? 'text-[#FFB000]' : 'text-[#5a6b7a]',
              col.align === 'right' && 'justify-end text-right'
            )}
          >
            {col.header}
            {sort.key === col.key && (
              <span className="ml-0.5 text-[#888]">{sort.dir === 'asc' ? '▲' : '▼'}</span>
            )}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-auto custom-scrollbar terminal-scrollbar relative"
        style={{ overscrollBehavior: 'none' }}
      >
        <div style={{ height: totalHeight, width: '100%' }} />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-pointer"
          style={{ left: 0, top: 0, width: '100%', height: '100%', display: 'block' }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />
      </div>
    </div>
  );
}
