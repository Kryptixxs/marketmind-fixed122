export interface FunctionDispatchEntry {
  mnemonic: string;
  componentKey: 'DES' | 'WEI' | 'GP' | 'FA' | 'NEWS' | 'IMAP' | 'ECO' | 'GC' | 'MKT' | 'MENU' | 'ANR';
  requiredFields: string[];
}

export const FUNCTION_DISPATCHER: Record<string, FunctionDispatchEntry> = {
  DES: { mnemonic: 'DES', componentKey: 'DES', requiredFields: ['BUSINESS_SUMMARY', 'MARKET_CAP', 'PE_RATIO', 'SHARES_OUTSTANDING', 'PRIMARY_EXCHANGE'] },
  TOP: { mnemonic: 'TOP', componentKey: 'NEWS', requiredFields: [] },
  CN: { mnemonic: 'CN', componentKey: 'NEWS', requiredFields: [] },
  WEI: { mnemonic: 'WEI', componentKey: 'WEI', requiredFields: ['PX_LAST', 'PX_BID', 'PX_ASK'] },
  GP: { mnemonic: 'GP', componentKey: 'GP', requiredFields: ['PX_LAST'] },
  FA: { mnemonic: 'FA', componentKey: 'FA', requiredFields: ['PE_RATIO', 'MARKET_CAP'] },
  HP: { mnemonic: 'HP', componentKey: 'FA', requiredFields: ['PX_LAST'] },
  DVD: { mnemonic: 'DVD', componentKey: 'FA', requiredFields: ['PX_LAST'] },
  MGMT: { mnemonic: 'MGMT', componentKey: 'DES', requiredFields: ['BUSINESS_SUMMARY'] },
  OWN: { mnemonic: 'OWN', componentKey: 'DES', requiredFields: ['MARKET_CAP'] },
  RELS: { mnemonic: 'RELS', componentKey: 'DES', requiredFields: [] },
  NEWS: { mnemonic: 'NEWS', componentKey: 'NEWS', requiredFields: [] },
  N: { mnemonic: 'N', componentKey: 'NEWS', requiredFields: [] },
  IMAP: { mnemonic: 'IMAP', componentKey: 'IMAP', requiredFields: [] },
  ECO: { mnemonic: 'ECO', componentKey: 'ECO', requiredFields: [] },
  GC: { mnemonic: 'GC', componentKey: 'GC', requiredFields: [] },
  MKT: { mnemonic: 'MKT', componentKey: 'MKT', requiredFields: [] },
  ANR: { mnemonic: 'ANR', componentKey: 'ANR', requiredFields: ['CONSENSUS_RATING', 'RECOMMENDATION_LIST'] },
  MENU: { mnemonic: 'MENU', componentKey: 'MENU', requiredFields: [] },
};

export function resolveDispatch(mnemonic: string): FunctionDispatchEntry {
  return FUNCTION_DISPATCHER[mnemonic.toUpperCase()] ?? FUNCTION_DISPATCHER.MKT;
}

