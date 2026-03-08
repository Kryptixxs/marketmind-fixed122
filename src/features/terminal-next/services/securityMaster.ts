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
    id: 'GBPUSD_CURNCY',
    symbol: 'GBPUSD Curncy',
    securityName: 'British Pound / US Dollar',
    assetClass: 'CURNCY',
    market: 'Curncy',
    fields: {
      PX_LAST: 1.2641,
      PX_BID: 1.2640,
      PX_ASK: 1.2642,
      PRIMARY_EXCHANGE: 'FXSPOT',
    },
    relatedBonds: [],
    relatedOptions: [],
  },
  {
    id: 'NVDA_US_EQ',
    symbol: 'NVDA US Equity',
    securityName: 'NVIDIA Corp',
    assetClass: 'EQUITY',
    market: 'US',
    fields: {
      PX_LAST: 914.1, PX_BID: 913.8, PX_ASK: 914.4,
      MARKET_CAP: 2_250_000_000_000, PE_RATIO: 72.4,
      SHARES_OUTSTANDING: 2_460_000_000, PRIMARY_EXCHANGE: 'NASDAQ',
      BUSINESS_SUMMARY: 'Semiconductor and AI computing platform driving accelerated computing adoption.',
      CONSENSUS_RATING: 'BUY', RECOMMENDATION_LIST: 'BUY,BUY,BUY,BUY',
      EPS: 12.62, DIV_YIELD: 0.04, BETA: 1.72,
    },
    relatedBonds: [],
    relatedOptions: [],
  },
  {
    id: 'GOOGL_US_EQ',
    symbol: 'GOOGL US Equity',
    securityName: 'Alphabet Inc',
    assetClass: 'EQUITY',
    market: 'US',
    fields: {
      PX_LAST: 172.63, PX_BID: 172.58, PX_ASK: 172.69,
      MARKET_CAP: 2_150_000_000_000, PE_RATIO: 27.2,
      SHARES_OUTSTANDING: 12_450_000_000, PRIMARY_EXCHANGE: 'NASDAQ',
      BUSINESS_SUMMARY: 'Search, cloud, advertising, and AI conglomerate.',
      CONSENSUS_RATING: 'BUY', RECOMMENDATION_LIST: 'BUY,BUY,HOLD,BUY',
      EPS: 6.34, DIV_YIELD: 0, BETA: 1.06,
    },
    relatedBonds: [],
    relatedOptions: [],
  },
  {
    id: 'TSLA_US_EQ',
    symbol: 'TSLA US Equity',
    securityName: 'Tesla Inc',
    assetClass: 'EQUITY',
    market: 'US',
    fields: {
      PX_LAST: 174.00, PX_BID: 173.90, PX_ASK: 174.10,
      MARKET_CAP: 554_000_000_000, PE_RATIO: 47.3,
      SHARES_OUTSTANDING: 3_185_000_000, PRIMARY_EXCHANGE: 'NASDAQ',
      BUSINESS_SUMMARY: 'Electric vehicle manufacturer and clean energy company.',
      CONSENSUS_RATING: 'HOLD', RECOMMENDATION_LIST: 'BUY,HOLD,HOLD,SELL',
      EPS: 3.68, DIV_YIELD: 0, BETA: 2.10,
    },
    relatedBonds: [],
    relatedOptions: [],
  },
  {
    id: 'SPX_INDEX',
    symbol: 'SPX Index',
    securityName: 'S&P 500 Index',
    assetClass: 'INDEX',
    market: 'Index',
    fields: {
      PX_LAST: 5280, PX_BID: 5279.5, PX_ASK: 5280.5, PE_RATIO: 24.8,
      PRIMARY_EXCHANGE: 'CBOE',
      BUSINESS_SUMMARY: 'Market-cap weighted index of 500 large US equities.',
    },
    relatedBonds: [],
    relatedOptions: [],
  },
  {
    id: 'CL1_COMDTY',
    symbol: 'CL1 Comdty',
    securityName: 'WTI Crude Oil Front Month',
    assetClass: 'COMDTY' as unknown as 'EQUITY',
    market: 'Comdty',
    fields: { PX_LAST: 82.30, PX_BID: 82.28, PX_ASK: 82.32, PRIMARY_EXCHANGE: 'NYMEX' },
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

