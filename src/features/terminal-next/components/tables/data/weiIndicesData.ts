/**
 * World Equity Indices – high-density table data
 */

export interface WEIRow {
  index: string;
  ticker: string;
  last: number;
  netChg: number;
  pctChg: number;
}

const hash = (s: string) => Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0);

const INDICES = [
  { index: 'S&P 500', ticker: 'SPX INDEX' },
  { index: 'Nasdaq 100', ticker: 'NDX INDEX' },
  { index: 'Dow Jones', ticker: 'INDU INDEX' },
  { index: 'Russell 2000', ticker: 'RTY INDEX' },
  { index: 'DAX', ticker: 'DAX INDEX' },
  { index: 'FTSE 100', ticker: 'UKX INDEX' },
  { index: 'CAC 40', ticker: 'CAC INDEX' },
  { index: 'Nikkei 225', ticker: 'NKY INDEX' },
  { index: 'Shanghai Comp', ticker: 'SHCOMP INDEX' },
  { index: 'Hang Seng', ticker: 'HSI INDEX' },
  { index: 'STOXX 600', ticker: 'SXXP INDEX' },
  { index: 'Euro Stoxx 50', ticker: 'SX5E INDEX' },
  { index: 'MSCI World', ticker: 'MXWO INDEX' },
  { index: 'MSCI EM', ticker: 'MXEF INDEX' },
  { index: 'VIX', ticker: 'VIX INDEX' },
  { index: 'Crude Oil', ticker: 'CL1 COMDTY' },
  { index: 'Gold', ticker: 'GOLD1 COMDTY' },
  { index: 'US 10Y', ticker: 'USGG10YR GOVT' },
  { index: 'DXY', ticker: 'DXY CURNCY' },
  { index: 'Bitcoin', ticker: 'BTCUSD CURNCY' },
];

export function buildWEIRows(seedMs = 0): WEIRow[] {
  return INDICES.map((row, i) => {
    const h = hash(row.ticker + String(seedMs));
    const base = 1800 + (h % 6000) + (h % 100) / 100;
    const netChg = ((h % 81) - 40) / 10;
    const pctChg = (netChg / base) * 100;
    return {
      ...row,
      last: base,
      netChg,
      pctChg,
    };
  });
}
