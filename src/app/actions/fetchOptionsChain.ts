'use server';

export interface OptionContract {
  symbol: string;
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVol: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  change: number;
  changePercent: number;
}

export interface OptionsChain {
  underlying: string;
  underlyingPrice: number;
  expirations: string[];
  chain: OptionContract[];
  fetchedAt: number;
}

const CACHE = new Map<string, { data: OptionsChain; ts: number }>();
const CACHE_TTL = 900_000;

export async function fetchOptionsExpirations(symbol: string): Promise<string[]> {
  const apiKey = process.env.TRADIER_API_KEY;
  if (!apiKey) return generateMockExpirations();

  try {
    const res = await fetch(
      `https://sandbox.tradier.com/v1/markets/options/expirations?symbol=${symbol}`,
      {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return generateMockExpirations();
    const json = await res.json();
    return json.expirations?.date || generateMockExpirations();
  } catch {
    return generateMockExpirations();
  }
}

export async function fetchOptionsChain(symbol: string, expiration?: string): Promise<OptionsChain | null> {
  const cacheKey = `${symbol}:${expiration || 'nearest'}`;
  const cached = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const apiKey = process.env.TRADIER_API_KEY;
  if (!apiKey) return generateMockChain(symbol);

  try {
    let exp = expiration;
    if (!exp) {
      const expirations = await fetchOptionsExpirations(symbol);
      exp = expirations[0];
    }
    if (!exp) return null;

    const [chainRes, quoteRes] = await Promise.all([
      fetch(
        `https://sandbox.tradier.com/v1/markets/options/chains?symbol=${symbol}&expiration=${exp}&greeks=true`,
        {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
          next: { revalidate: 900 },
        }
      ),
      fetch(
        `https://sandbox.tradier.com/v1/markets/quotes?symbols=${symbol}`,
        {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
          next: { revalidate: 60 },
        }
      ),
    ]);

    if (!chainRes.ok) return generateMockChain(symbol);

    const chainJson = await chainRes.json();
    const quoteJson = await quoteRes.json();
    const underlyingPrice = quoteJson.quotes?.quote?.last || 0;

    const options = chainJson.options?.option || [];
    const chain: OptionContract[] = options.map((opt: any) => ({
      symbol: opt.symbol,
      strike: opt.strike,
      expiration: opt.expiration_date,
      type: opt.option_type === 'call' ? 'call' : 'put',
      bid: opt.bid || 0,
      ask: opt.ask || 0,
      last: opt.last || 0,
      volume: opt.volume || 0,
      openInterest: opt.open_interest || 0,
      impliedVol: opt.greeks?.mid_iv || null,
      delta: opt.greeks?.delta || null,
      gamma: opt.greeks?.gamma || null,
      theta: opt.greeks?.theta || null,
      vega: opt.greeks?.vega || null,
      change: opt.change || 0,
      changePercent: opt.change_percentage || 0,
    }));

    const expirations = await fetchOptionsExpirations(symbol);
    const data: OptionsChain = { underlying: symbol, underlyingPrice, expirations, chain, fetchedAt: Date.now() };

    CACHE.set(cacheKey, { data, ts: Date.now() });
    return data;
  } catch (e) {
    console.warn('[Options] Error:', (e as Error).message);
    return generateMockChain(symbol);
  }
}

function generateMockExpirations(): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + (7 * (i + 1)) - d.getDay() + 5);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function generateMockChain(symbol: string): OptionsChain {
  const basePrice = symbol === 'AAPL' ? 195 : symbol === 'NVDA' ? 140 : symbol === 'TSLA' ? 250 : 100;
  const chain: OptionContract[] = [];
  const strikes = Array.from({ length: 11 }, (_, i) => Math.round(basePrice * (0.9 + i * 0.02)));
  const exp = generateMockExpirations()[0];

  for (const strike of strikes) {
    for (const type of ['call', 'put'] as const) {
      const itm = type === 'call' ? basePrice > strike : basePrice < strike;
      const intrinsic = type === 'call' ? Math.max(basePrice - strike, 0) : Math.max(strike - basePrice, 0);
      const timeValue = basePrice * 0.02 * Math.random();
      const premium = intrinsic + timeValue;

      chain.push({
        symbol: `${symbol}${exp.replace(/-/g, '')}${type === 'call' ? 'C' : 'P'}${strike}`,
        strike, expiration: exp, type,
        bid: Math.max(premium - 0.05, 0.01),
        ask: premium + 0.05,
        last: premium,
        volume: Math.floor(Math.random() * 5000),
        openInterest: Math.floor(Math.random() * 20000),
        impliedVol: 0.2 + Math.random() * 0.3,
        delta: type === 'call' ? (itm ? 0.5 + Math.random() * 0.4 : Math.random() * 0.5) : -(itm ? 0.5 + Math.random() * 0.4 : Math.random() * 0.5),
        gamma: 0.01 + Math.random() * 0.05,
        theta: -(0.01 + Math.random() * 0.05),
        vega: 0.05 + Math.random() * 0.15,
        change: (Math.random() - 0.5) * 2,
        changePercent: (Math.random() - 0.5) * 10,
      });
    }
  }

  return {
    underlying: symbol,
    underlyingPrice: basePrice,
    expirations: generateMockExpirations(),
    chain,
    fetchedAt: Date.now(),
  };
}
