export interface SecurityMasterNode {
  id: string;
  symbol: string;
  securityName: string;
  assetClass: 'EQUITY' | 'CORP' | 'CURNCY' | 'INDEX';
  market: string;
  fields: Record<string, number | string>;
  relatedBonds: string[];
  relatedOptions: string[];
}

const MASTER: SecurityMasterNode[] = [
  {
    id: 'AAPL_US_EQ',
    symbol: 'AAPL US Equity',
    securityName: 'Apple Inc',
    assetClass: 'EQUITY',
    market: 'US',
    fields: {
      PX_LAST: 175.22,
      PX_BID: 175.18,
      PX_ASK: 175.25,
      MARKET_CAP: 2_800_000_000_000,
      PE_RATIO: 28.5,
      SHARES_OUTSTANDING: 15_970_000_000,
      PRIMARY_EXCHANGE: 'NASDAQ',
      BUSINESS_SUMMARY: 'Consumer hardware and platform ecosystem with recurring services growth.',
      CONSENSUS_RATING: 'BUY',
      RECOMMENDATION_LIST: 'BUY,BUY,HOLD,BUY',
    },
    relatedBonds: ['AAPL 2.5 05/25', 'AAPL 3.1 08/27'],
    relatedOptions: ['AAPL US 180 C 06/21', 'AAPL US 170 P 06/21'],
  },
  {
    id: 'MSFT_US_EQ',
    symbol: 'MSFT US Equity',
    securityName: 'Microsoft Corp',
    assetClass: 'EQUITY',
    market: 'US',
    fields: {
      PX_LAST: 430.4,
      PX_BID: 430.31,
      PX_ASK: 430.52,
      MARKET_CAP: 3_200_000_000_000,
      PE_RATIO: 36.1,
      SHARES_OUTSTANDING: 7_450_000_000,
      PRIMARY_EXCHANGE: 'NASDAQ',
      BUSINESS_SUMMARY: 'Enterprise software and cloud platform leader.',
      CONSENSUS_RATING: 'BUY',
      RECOMMENDATION_LIST: 'BUY,BUY,BUY,HOLD',
    },
    relatedBonds: ['MSFT 2.4 02/26'],
    relatedOptions: ['MSFT US 430 C 06/21'],
  },
  {
    id: 'EURUSD_CURNCY',
    symbol: 'EURUSD Curncy',
    securityName: 'Euro / US Dollar',
    assetClass: 'CURNCY',
    market: 'Curncy',
    fields: {
      PX_LAST: 1.0872,
      PX_BID: 1.0871,
      PX_ASK: 1.0873,
      PRIMARY_EXCHANGE: 'FXSPOT',
    },
    relatedBonds: [],
    relatedOptions: [],
  },
  {
    id: 'AAPL_25_0525_CORP',
    symbol: 'AAPL 2.5 05/25',
    securityName: 'Apple 2.5% 05/2025',
    assetClass: 'CORP',
    market: 'Corp',
    fields: {
      PX_LAST: 99.84,
      YLD_YTM_MID: 4.12,
      PRIMARY_EXCHANGE: 'TRACE',
    },
    relatedBonds: [],
    relatedOptions: [],
  },
  {
    id: 'AAPL_US_180C_0621',
    symbol: 'AAPL US 180 C 06/21',
    securityName: 'Apple Jun21 180 Call',
    assetClass: 'CORP',
    market: 'Option',
    fields: {
      PX_LAST: 3.21,
      DELTA: 0.41,
      VEGA: 0.18,
      PRIMARY_EXCHANGE: 'OPRA',
    },
    relatedBonds: [],
    relatedOptions: [],
  },
];

const bySymbol = new Map(MASTER.map((m) => [m.symbol.toUpperCase(), m]));
const byAssetClass = new Map<SecurityMasterNode['assetClass'], SecurityMasterNode[]>(
  ['EQUITY', 'CORP', 'CURNCY', 'INDEX'].map((k) => [k as SecurityMasterNode['assetClass'], MASTER.filter((m) => m.assetClass === k as SecurityMasterNode['assetClass'])])
);

export function lookupSecurity(symbol: string): SecurityMasterNode | null {
  const normalized = symbol.toUpperCase().replace(/\s+/g, ' ').trim();
  return bySymbol.get(normalized) ?? null;
}

export function getSecurityTree() {
  return byAssetClass;
}

export function getRelatedSecurities(symbol: string): SecurityMasterNode[] {
  const node = lookupSecurity(symbol);
  if (!node) return [];
  const related = [...node.relatedBonds, ...node.relatedOptions];
  return related.map((s) => lookupSecurity(s)).filter((v): v is SecurityMasterNode => Boolean(v));
}

export function getAvailableFieldSet(symbol: string): Set<string> {
  const node = lookupSecurity(symbol);
  if (!node) {
    return new Set([
      'PX_LAST',
      'PX_BID',
      'PX_ASK',
      'MARKET_CAP',
      'PE_RATIO',
      'SHARES_OUTSTANDING',
      'PRIMARY_EXCHANGE',
      'BUSINESS_SUMMARY',
    ]);
  }
  return new Set(Object.keys(node.fields));
}

export function searchSecurityMaster(prefix: string): Array<{ symbol: string; assetClass: SecurityMasterNode['assetClass']; securityName: string }> {
  const p = prefix.toUpperCase().trim();
  if (!p) return [];
  return MASTER.filter((m) =>
    m.symbol.toUpperCase().includes(p) || m.securityName.toUpperCase().includes(p)
  ).slice(0, 12).map((m) => ({
    symbol: m.symbol,
    assetClass: m.assetClass,
    securityName: m.securityName,
  }));
}

