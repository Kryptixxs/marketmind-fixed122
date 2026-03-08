/**
 * Shared column definitions for TerminalTable variants
 */

import type { TerminalTableColumn } from './TerminalTable/types';

export const BASE_COLUMNS: TerminalTableColumn[] = [
  { key: 'ticker', header: 'Ticker', align: 'left', width: '18%', toneKey: undefined },
  { key: 'price', header: 'Price', align: 'right', width: '14%', flashKey: 'price', toneKey: undefined },
  { key: 'change', header: 'Change', align: 'right', width: '12%', flashKey: 'change', toneKey: 'change' },
  { key: 'pctChange', header: '%Chg', align: 'right', width: '10%', flashKey: 'pctChange', toneKey: 'pctChange' },
  { key: 'volume', header: 'Volume', align: 'right', width: '14%' },
  { key: 'sparkline', header: '', align: 'right', width: '20%' },
];
