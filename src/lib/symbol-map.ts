export type AssetClass = 'equity' | 'index' | 'commodity' | 'crypto' | 'forex' | 'macro';

interface SymbolMapping {
  yahoo: string;
  finnhub?: string;
  binance?: string;
  coinbase?: string;
  assetClass: AssetClass;
  label: string;
}

const SYMBOL_DB: Record<string, SymbolMapping> = {
  // US Equities
  AAPL: { yahoo: 'AAPL', finnhub: 'AAPL', assetClass: 'equity', label: 'Apple Inc.' },
  NVDA: { yahoo: 'NVDA', finnhub: 'NVDA', assetClass: 'equity', label: 'NVIDIA Corp.' },
  MSFT: { yahoo: 'MSFT', finnhub: 'MSFT', assetClass: 'equity', label: 'Microsoft' },
  TSLA: { yahoo: 'TSLA', finnhub: 'TSLA', assetClass: 'equity', label: 'Tesla Inc.' },
  GOOGL: { yahoo: 'GOOGL', finnhub: 'GOOGL', assetClass: 'equity', label: 'Alphabet' },
  AMZN: { yahoo: 'AMZN', finnhub: 'AMZN', assetClass: 'equity', label: 'Amazon' },
  META: { yahoo: 'META', finnhub: 'META', assetClass: 'equity', label: 'Meta Platforms' },
  AMD: { yahoo: 'AMD', finnhub: 'AMD', assetClass: 'equity', label: 'AMD' },
  NFLX: { yahoo: 'NFLX', finnhub: 'NFLX', assetClass: 'equity', label: 'Netflix' },
  DIS: { yahoo: 'DIS', finnhub: 'DIS', assetClass: 'equity', label: 'Walt Disney' },
  PYPL: { yahoo: 'PYPL', finnhub: 'PYPL', assetClass: 'equity', label: 'PayPal' },
  INTC: { yahoo: 'INTC', finnhub: 'INTC', assetClass: 'equity', label: 'Intel' },
  UBER: { yahoo: 'UBER', finnhub: 'UBER', assetClass: 'equity', label: 'Uber' },
  CRM: { yahoo: 'CRM', finnhub: 'CRM', assetClass: 'equity', label: 'Salesforce' },
  ORCL: { yahoo: 'ORCL', finnhub: 'ORCL', assetClass: 'equity', label: 'Oracle' },
  ADBE: { yahoo: 'ADBE', finnhub: 'ADBE', assetClass: 'equity', label: 'Adobe' },
  CSCO: { yahoo: 'CSCO', finnhub: 'CSCO', assetClass: 'equity', label: 'Cisco' },
  QCOM: { yahoo: 'QCOM', finnhub: 'QCOM', assetClass: 'equity', label: 'Qualcomm' },
  AVGO: { yahoo: 'AVGO', finnhub: 'AVGO', assetClass: 'equity', label: 'Broadcom' },
  TXN: { yahoo: 'TXN', finnhub: 'TXN', assetClass: 'equity', label: 'Texas Instruments' },
  PLTR: { yahoo: 'PLTR', finnhub: 'PLTR', assetClass: 'equity', label: 'Palantir Technologies' },
  SNOW: { yahoo: 'SNOW', finnhub: 'SNOW', assetClass: 'equity', label: 'Snowflake' },
  CRM: { yahoo: 'CRM', finnhub: 'CRM', assetClass: 'equity', label: 'Salesforce' },

  // Indices
  NAS100: { yahoo: '^NDX', assetClass: 'index', label: 'Nasdaq 100' },
  SPX500: { yahoo: '^GSPC', assetClass: 'index', label: 'S&P 500' },
  US30: { yahoo: '^DJI', assetClass: 'index', label: 'Dow Jones' },
  RUSSELL: { yahoo: '^RUT', assetClass: 'index', label: 'Russell 2000' },
  DAX40: { yahoo: '^GDAXI', assetClass: 'index', label: 'DAX' },
  FTSE100: { yahoo: '^FTSE', assetClass: 'index', label: 'FTSE 100' },
  NIKKEI: { yahoo: '^N225', assetClass: 'index', label: 'Nikkei 225' },
  HSI: { yahoo: '^HSI', assetClass: 'index', label: 'Hang Seng' },
  AS51: { yahoo: '^AXJO', assetClass: 'index', label: 'ASX 200' },

  // Commodities
  GOLD: { yahoo: 'GC=F', assetClass: 'commodity', label: 'Gold' },
  SILVER: { yahoo: 'SI=F', assetClass: 'commodity', label: 'Silver' },
  CRUDE: { yahoo: 'CL=F', assetClass: 'commodity', label: 'Crude Oil' },
  NATGAS: { yahoo: 'NG=F', assetClass: 'commodity', label: 'Natural Gas' },
  COPPER: { yahoo: 'HG=F', assetClass: 'commodity', label: 'Copper' },
  PLATINUM: { yahoo: 'PL=F', assetClass: 'commodity', label: 'Platinum' },

  // Crypto
  BTCUSD: { yahoo: 'BTC-USD', binance: 'btcusdt', coinbase: 'BTC-USD', assetClass: 'crypto', label: 'Bitcoin' },
  ETHUSD: { yahoo: 'ETH-USD', binance: 'ethusdt', coinbase: 'ETH-USD', assetClass: 'crypto', label: 'Ethereum' },
  SOLUSD: { yahoo: 'SOL-USD', binance: 'solusdt', coinbase: 'SOL-USD', assetClass: 'crypto', label: 'Solana' },
  BNBUSD: { yahoo: 'BNB-USD', binance: 'bnbusdt', assetClass: 'crypto', label: 'BNB' },
  XRPUSD: { yahoo: 'XRP-USD', binance: 'xrpusdt', coinbase: 'XRP-USD', assetClass: 'crypto', label: 'XRP' },
  ADAUSD: { yahoo: 'ADA-USD', binance: 'adausdt', coinbase: 'ADA-USD', assetClass: 'crypto', label: 'Cardano' },

  // Forex
  EURUSD: { yahoo: 'EURUSD=X', finnhub: 'OANDA:EUR_USD', assetClass: 'forex', label: 'EUR/USD' },
  GBPUSD: { yahoo: 'GBPUSD=X', finnhub: 'OANDA:GBP_USD', assetClass: 'forex', label: 'GBP/USD' },
  USDJPY: { yahoo: 'JPY=X', finnhub: 'OANDA:USD_JPY', assetClass: 'forex', label: 'USD/JPY' },
  AUDUSD: { yahoo: 'AUDUSD=X', finnhub: 'OANDA:AUD_USD', assetClass: 'forex', label: 'AUD/USD' },
  USDCAD: { yahoo: 'USDCAD=X', finnhub: 'OANDA:USD_CAD', assetClass: 'forex', label: 'USD/CAD' },
  USDCHF: { yahoo: 'USDCHF=X', finnhub: 'OANDA:USD_CHF', assetClass: 'forex', label: 'USD/CHF' },
  NZDUSD: { yahoo: 'NZDUSD=X', finnhub: 'OANDA:NZD_USD', assetClass: 'forex', label: 'NZD/USD' },

  // Macro
  DXY: { yahoo: 'DX-Y.NYB', assetClass: 'macro', label: 'Dollar Index' },
  VIX: { yahoo: '^VIX', assetClass: 'macro', label: 'VIX' },
  US10Y: { yahoo: '^TNX', assetClass: 'macro', label: '10Y Yield' },
  US2Y: { yahoo: '^IRX', assetClass: 'macro', label: '2Y Yield' },
  MOVE: { yahoo: '^MOVE', assetClass: 'macro', label: 'MOVE Index' },
};

export function getSymbolMapping(sym: string): SymbolMapping | undefined {
  return SYMBOL_DB[sym];
}

export function getAssetClass(sym: string): AssetClass {
  return SYMBOL_DB[sym]?.assetClass || 'equity';
}

export function getFinnhubSymbol(sym: string): string | undefined {
  return SYMBOL_DB[sym]?.finnhub;
}

export function getBinanceStream(sym: string): string | undefined {
  return SYMBOL_DB[sym]?.binance;
}

export function getCoinbaseProduct(sym: string): string | undefined {
  return SYMBOL_DB[sym]?.coinbase;
}

export function getYahooSymbol(sym: string): string {
  return SYMBOL_DB[sym]?.yahoo || sym;
}

export function getLabel(sym: string): string {
  return SYMBOL_DB[sym]?.label || sym;
}

export function classifySymbols(symbols: string[]): {
  finnhub: string[];
  binance: string[];
  yahooFallback: string[];
} {
  const finnhub: string[] = [];
  const binance: string[] = [];
  const yahooFallback: string[] = [];

  for (const sym of symbols) {
    const mapping = SYMBOL_DB[sym];
    if (!mapping) { yahooFallback.push(sym); continue; }

    // Route forex away from Finnhub stream/quote because many keys lack OANDA entitlement.
    if (mapping.assetClass === 'forex') {
      yahooFallback.push(sym);
    } else if (mapping.binance) {
      binance.push(sym);
    } else if (mapping.finnhub) {
      finnhub.push(sym);
    } else {
      yahooFallback.push(sym);
    }
  }

  return { finnhub, binance, yahooFallback };
}
