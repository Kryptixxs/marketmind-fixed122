/**
 * Global Equities – 1000+ rows for virtualization
 */

import type { TerminalTableRow } from '../TerminalTable/types';

const TICKERS = [
  'AAPL', 'MSFT', 'NVDA', 'META', 'AMZN', 'TSLA', 'GOOGL', 'GOOG', 'BRK.B', 'JPM',
  'V', 'JNJ', 'WMT', 'XOM', 'PG', 'UNH', 'MA', 'HD', 'LLY', 'BAC', 'ABBV', 'AVGO',
  'KO', 'PEP', 'COST', 'MRK', 'ORCL', 'CSCO', 'ADBE', 'CRM', 'NFLX', 'AMD', 'INTC',
  'QCOM', 'TXN', 'AMAT', 'MU', 'SHOP', 'UBER', 'SNOW', 'PANW', 'CRWD', 'NOW', 'PLTR',
  'SQ', 'PYPL', 'DIS', 'NKE', 'SBUX', 'MCD', 'T', 'VZ', 'CMCSA', 'TMUS', 'CVX', 'COP',
  'SLB', 'CAT', 'DE', 'GE', 'HON', 'MMM', 'BA', 'LMT', 'RTX', 'NOC', 'GD', 'F', 'GM',
  'RIVN', 'LCID', 'PFE', 'BMY', 'TMO', 'DHR', 'ABT', 'GILD', 'BIIB', 'ISRG', 'REGN',
  'VRTX', 'AMGN', 'MDT', 'SYK', 'ELV', 'CI', 'HUM', 'GS', 'MS', 'BLK', 'SPGI', 'ICE',
  'CME', 'SCHW', 'CB', 'AIG', 'PGR', 'TRV', 'AON', 'BK', 'USB', 'WFC', 'C', 'SPY',
  'QQQ', 'IWM', 'DIA', 'XLF', 'XLK', 'XLE', 'XLI', 'XLV', 'XLP', 'XLY', 'XLU', 'XLB',
  'BABA', 'PDD', 'JD', 'TCEHY', 'BIDU', 'SE', 'MELI', 'ASML', 'TSM', 'SONY', 'IBM',
  'SAP', 'RIO', 'BHP', 'SHEL', 'NEM', 'FCX', 'LIN', 'APD', 'UPS', 'FDX', 'UNP', 'CSX',
];

const hash = (s: string) => Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0);

function genSparkline(seed: number, len: number): number[] {
  const out: number[] = [];
  let v = 100;
  for (let i = 0; i < len; i++) {
    v = v + (hash(String(seed + i)) % 11) - 5;
    out.push(Math.max(80, Math.min(120, v)));
  }
  return out;
}

export function buildEquitiesRows(count = 1200): TerminalTableRow[] {
  const rows: TerminalTableRow[] = [];
  for (let i = 0; i < count; i++) {
    const ticker = TICKERS[i % TICKERS.length] + (i >= TICKERS.length ? `-${Math.floor(i / TICKERS.length)}` : '');
    const base = 12 + (hash(ticker) % 780) + (hash(ticker + 'x') % 100) / 100;
    const change = ((hash(ticker + 'c') % 41) - 20) / 10;
    const pct = (change / base) * 100;
    const vol = Math.floor((hash(ticker + 'v') % 500) + 1) * 1e6;
    rows.push({
      id: `eq-${ticker}-${i}`,
      ticker: `${ticker} US`,
      price: base,
      change,
      pctChange: pct,
      volume: vol,
      sparkline: genSparkline(hash(ticker) + i, 20),
    });
  }
  return rows;
}
