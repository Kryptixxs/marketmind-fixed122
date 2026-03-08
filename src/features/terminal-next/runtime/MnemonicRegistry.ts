import type { MarketSector } from './panelState';

export interface MnemonicDef {
  code: string;
  title: string;
  requiresSecurity: boolean;
  supportedSectors: MarketSector[];
  layoutType: 'table' | 'news' | 'chart' | 'form' | 'kv' | 'composite';
  relatedCodes: string[];
}

const ALL_SECTORS: MarketSector[] = ['EQUITY', 'CORP', 'CURNCY', 'COMDTY', 'INDEX', 'GOVT', 'MUNI', 'MTGE'];

export const MNEMONIC_DEFS: Record<string, MnemonicDef> = {
  WEI:  { code: 'WEI', title: 'World Equity Indices', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'table', relatedCodes: ['IMAP', 'TOP', 'ECO'] },
  TOP:  { code: 'TOP', title: 'Top News', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'news', relatedCodes: ['N', 'CN', 'WEI'] },
  N:    { code: 'N', title: 'News Search', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'news', relatedCodes: ['TOP', 'CN'] },
  CN:   { code: 'CN', title: 'Company News', requiresSecurity: true, supportedSectors: ['EQUITY', 'CORP'], layoutType: 'news', relatedCodes: ['TOP', 'N', 'DES'] },
  DES:  { code: 'DES', title: 'Security Description', requiresSecurity: true, supportedSectors: ALL_SECTORS, layoutType: 'kv', relatedCodes: ['HP', 'OWN', 'FA', 'RELS', 'MGMT'] },
  HP:   { code: 'HP', title: 'Historical Pricing', requiresSecurity: true, supportedSectors: ALL_SECTORS, layoutType: 'table', relatedCodes: ['GP', 'DES', 'DVD'] },
  DVD:  { code: 'DVD', title: 'Dividend History', requiresSecurity: true, supportedSectors: ['EQUITY'], layoutType: 'table', relatedCodes: ['HP', 'DES', 'FA'] },
  MGMT: { code: 'MGMT', title: 'Management', requiresSecurity: true, supportedSectors: ['EQUITY', 'CORP'], layoutType: 'table', relatedCodes: ['DES', 'OWN'] },
  OWN:  { code: 'OWN', title: 'Ownership', requiresSecurity: true, supportedSectors: ['EQUITY'], layoutType: 'table', relatedCodes: ['MGMT', 'DES', 'RELS'] },
  RELS: { code: 'RELS', title: 'Related Securities', requiresSecurity: true, supportedSectors: ['EQUITY', 'CORP'], layoutType: 'table', relatedCodes: ['DES', 'OWN'] },
  FA:   { code: 'FA', title: 'Financial Analysis', requiresSecurity: true, supportedSectors: ['EQUITY', 'CORP'], layoutType: 'table', relatedCodes: ['DES', 'HP'] },
  EVT:  { code: 'EVT', title: 'Corporate Events', requiresSecurity: true, supportedSectors: ['EQUITY'], layoutType: 'table', relatedCodes: ['DES', 'DVD', 'HP'] },
  GP:   { code: 'GP', title: 'Price Chart', requiresSecurity: true, supportedSectors: ALL_SECTORS, layoutType: 'chart', relatedCodes: ['GIP', 'HP', 'RV'] },
  GIP:  { code: 'GIP', title: 'Intraday Chart', requiresSecurity: true, supportedSectors: ALL_SECTORS, layoutType: 'chart', relatedCodes: ['GP', 'HP'] },
  RV:   { code: 'RV', title: 'Relative Value', requiresSecurity: true, supportedSectors: ALL_SECTORS, layoutType: 'chart', relatedCodes: ['GP'] },
  ECO:  { code: 'ECO', title: 'Economic Calendar', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'table', relatedCodes: ['WEI', 'TOP'] },
  FXC:  { code: 'FXC', title: 'FX Cross Matrix', requiresSecurity: false, supportedSectors: ['CURNCY'], layoutType: 'table', relatedCodes: ['WEI'] },
  GC:   { code: 'GC', title: 'Yield Curve', requiresSecurity: false, supportedSectors: ['GOVT', 'CORP'], layoutType: 'chart', relatedCodes: ['DES'] },
  IMAP: { code: 'IMAP', title: 'Sector Heatmap', requiresSecurity: false, supportedSectors: ['EQUITY', 'INDEX'], layoutType: 'chart', relatedCodes: ['WEI'] },
  ALRT: { code: 'ALRT', title: 'Alerts Monitor', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'table', relatedCodes: ['TOP'] },
  BLTR: { code: 'BLTR', title: 'Blotter', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'table', relatedCodes: ['ORD'] },
  ORD:  { code: 'ORD', title: 'Order Ticket', requiresSecurity: true, supportedSectors: ALL_SECTORS, layoutType: 'form', relatedCodes: ['BLTR'] },
  ANR:  { code: 'ANR', title: 'Analytics Runtime', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'table', relatedCodes: ['WEI'] },
  IB:   { code: 'IB', title: 'Instant Bloomberg', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'composite', relatedCodes: [] },
  MKT:  { code: 'MKT', title: 'Market Context', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'composite', relatedCodes: ['WEI', 'ECO'] },
  MON:  { code: 'MON', title: 'Monitor / Watchlist', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'table', relatedCodes: ['WEI', 'ALRT'] },
  WS:   { code: 'WS', title: 'Workspace Manager', requiresSecurity: false, supportedSectors: ALL_SECTORS, layoutType: 'table', relatedCodes: [] },
};

export function getMnemonicDef(code: string): MnemonicDef | undefined {
  return MNEMONIC_DEFS[code.toUpperCase()];
}

export function getRelatedMnemonics(code: string): MnemonicDef[] {
  const def = getMnemonicDef(code);
  if (!def) return [];
  return def.relatedCodes.map((c) => MNEMONIC_DEFS[c]).filter(Boolean) as MnemonicDef[];
}
