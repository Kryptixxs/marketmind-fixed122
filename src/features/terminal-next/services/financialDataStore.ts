export interface DesFinancialObject {
  businessSummary: string;
  marketCap: number;
  peRatio: number;
  sharesOutstanding: number;
  primaryExchange: string;
}

export interface WeiIndexObject {
  symbol: 'SPX' | 'CCMP' | 'INDU';
  lastPrice: number;
  netChange: number;
  percentChange: number;
}

const hash = (s: string) => Array.from(s).reduce((acc, c) => acc + c.charCodeAt(0), 0);

const DES_SUMMARIES = [
  'Large-cap platform business with durable pricing power and global distribution.',
  'Strong free-cash-flow conversion and disciplined capital return policy.',
  'Ecosystem lock-in drives recurring revenue through software and services.',
  'Supply-chain diversification supports resilience across cyclical demand regimes.',
];

export function getDesFinancialObject(symbol: string): DesFinancialObject {
  const h = hash(symbol);
  return {
    businessSummary: DES_SUMMARIES[h % DES_SUMMARIES.length]!,
    marketCap: (900 + (h % 2200)) * 1_000_000_000,
    peRatio: Number((12 + (h % 28) + ((h % 7) / 10)).toFixed(1)),
    sharesOutstanding: (5 + (h % 180)) * 100_000_000,
    primaryExchange: symbol.includes(' US') ? 'NASDAQ' : symbol.includes(' LN') ? 'LSE' : 'NYSE',
  };
}

export function getWeiSeedData(): WeiIndexObject[] {
  return [
    { symbol: 'SPX', lastPrice: 5108.22, netChange: 12.18, percentChange: 0.24 },
    { symbol: 'CCMP', lastPrice: 17912.4, netChange: 84.11, percentChange: 0.47 },
    { symbol: 'INDU', lastPrice: 39055.11, netChange: -75.33, percentChange: -0.19 },
  ];
}
