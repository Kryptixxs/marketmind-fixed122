export type AssetType = 'INDEX' | 'FX' | 'CRYPTO' | 'FUTURE' | 'EQUITY' | 'RATE';

export interface Instrument {
  id: string;
  label: string;
  assetType: AssetType;
  yahooSymbol: string;
  tradingViewSymbol?: string;
  decimals: number;
  priceTransform?: { multiply?: number; divide?: number };
  currency?: string;
}

export const INSTRUMENTS: Record<string, Instrument> = {
  'NDX': {
    id: 'NDX',
    label: 'Nasdaq 100',
    assetType: 'INDEX',
    yahooSymbol: '^NDX',
    tradingViewSymbol: 'NASDAQ:NDX',
    decimals: 0,
    currency: 'USD'
  },
  'SPX': {
    id: 'SPX',
    label: 'S&P 500',
    assetType: 'INDEX',
    yahooSymbol: '^GSPC',
    tradingViewSymbol: 'SP:SPX',
    decimals: 0,
    currency: 'USD'
  },
  'DJI': {
    id: 'DJI',
    label: 'Dow Jones',
    assetType: 'INDEX',
    yahooSymbol: '^DJI',
    tradingViewSymbol: 'DJ:DJI',
    decimals: 0,
    currency: 'USD'
  },
  'RUT': {
    id: 'RUT',
    label: 'Russell 2000',
    assetType: 'INDEX',
    yahooSymbol: '^RUT',
    tradingViewSymbol: 'RUSSELL:RUT',
    decimals: 0,
    currency: 'USD'
  },
  'CL': {
    id: 'CL',
    label: 'Crude Oil',
    assetType: 'FUTURE',
    yahooSymbol: 'CL=F',
    tradingViewSymbol: 'NYMEX:CL1!',
    decimals: 2,
    currency: 'USD'
  },
  'GC': {
    id: 'GC',
    label: 'Gold',
    assetType: 'FUTURE',
    yahooSymbol: 'GC=F',
    tradingViewSymbol: 'COMEX:GC1!',
    decimals: 2,
    currency: 'USD'
  },
  'EURUSD': {
    id: 'EURUSD',
    label: 'EUR/USD',
    assetType: 'FX',
    yahooSymbol: 'EURUSD=X',
    tradingViewSymbol: 'FX:EURUSD',
    decimals: 5,
    currency: 'USD'
  },
  'BTCUSD': {
    id: 'BTCUSD',
    label: 'Bitcoin',
    assetType: 'CRYPTO',
    yahooSymbol: 'BTC-USD',
    tradingViewSymbol: 'COINBASE:BTCUSD',
    decimals: 2,
    currency: 'USD'
  }
};

export function getInstrument(id: string): Instrument | undefined {
  return INSTRUMENTS[id.toUpperCase()];
}

export function listInstruments(): Instrument[] {
  return Object.values(INSTRUMENTS);
}

export function searchInstruments(query: string): Instrument[] {
  const q = query.toUpperCase();
  return listInstruments().filter(i => 
    i.id.includes(q) || i.label.toUpperCase().includes(q)
  );
}

export function resolveYahooSymbol(id: string): string {
  const inst = getInstrument(id);
  return inst ? inst.yahooSymbol : id;
}

export function resolveTradingViewSymbol(id: string): string | undefined {
  const inst = getInstrument(id);
  return inst?.tradingViewSymbol;
}