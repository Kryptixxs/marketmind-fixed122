/**
 * TerminalTable – high-density financial table types
 */

export type FlashDirection = 'up' | 'down' | null;

/** Base row shape – all variants extend this */
export interface TerminalTableRow {
  id: string;
  ticker: string;
  price: number;
  change: number;
  pctChange: number;
  volume: number;
  sparkline: number[];
}

export type SortKey = 'ticker' | 'price' | 'change' | 'pctChange' | 'volume';
export type SortDir = 'asc' | 'desc';

export interface TerminalTableColumn {
  key: SortKey | 'sparkline';
  header: string;
  align: 'left' | 'right';
  width?: string;
  /** Key for flash detection (price updates) */
  flashKey?: 'price' | 'change' | 'pctChange';
  /** Key for value-based coloring */
  toneKey?: 'change' | 'pctChange';
}

/** Map: rowId -> columnKey -> flash direction */
export type FlashMap = Record<string, Record<string, FlashDirection>>;
