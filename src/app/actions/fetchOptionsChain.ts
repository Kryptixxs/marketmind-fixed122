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

function basePrice(symbol: string): number {
  const map: Record<string, number> = { AAPL: 205, NVDA: 920, TSLA: 210, SPX500: 5230, NAS100: 18350 };
  return map[symbol] || 100;
}

function noise(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function fetchOptionsExpirations(symbol: string): Promise<string[]> {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + (7 * (i + 1)) - d.getDay() + 5);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export async function fetchOptionsChain(symbol: string, expiration?: string): Promise<OptionsChain | null> {
  const underlying = symbol.toUpperCase();
  const spot = basePrice(underlying);
  const expirations = await fetchOptionsExpirations(underlying);
  const exp = expiration || expirations[0];
  if (!exp) return null;

  const strikes = Array.from({ length: 13 }, (_, i) => Number((spot * (0.88 + i * 0.02)).toFixed(2)));
  const chain: OptionContract[] = [];

  for (const strike of strikes) {
    for (const type of ['call', 'put'] as const) {
      const seed = strike + (type === 'call' ? 1 : 2);
      const intrinsic = type === 'call' ? Math.max(spot - strike, 0) : Math.max(strike - spot, 0);
      const tv = Math.max(spot * 0.015 * (0.6 + noise(seed) * 0.8), 0.05);
      const premium = intrinsic + tv;
      const spread = Math.max(premium * 0.02, 0.05);
      const deltaBase = Math.max(0.05, Math.min(0.95, 0.5 + (spot - strike) / (spot * 0.3)));
      const delta = type === 'call' ? deltaBase : -deltaBase;

      chain.push({
        symbol: `${underlying}${exp.replace(/-/g, '')}${type === 'call' ? 'C' : 'P'}${Math.round(strike * 1000)}`,
        strike,
        expiration: exp,
        type,
        bid: Number(Math.max(premium - spread / 2, 0.01).toFixed(2)),
        ask: Number((premium + spread / 2).toFixed(2)),
        last: Number(premium.toFixed(2)),
        volume: Math.floor(100 + noise(seed * 3) * 4800),
        openInterest: Math.floor(300 + noise(seed * 7) * 18000),
        impliedVol: Number((0.18 + noise(seed * 11) * 0.34).toFixed(3)),
        delta: Number(delta.toFixed(3)),
        gamma: Number((0.01 + noise(seed * 13) * 0.04).toFixed(3)),
        theta: Number((-0.01 - noise(seed * 17) * 0.04).toFixed(3)),
        vega: Number((0.04 + noise(seed * 19) * 0.14).toFixed(3)),
        change: Number(((noise(seed * 23) - 0.5) * 1.5).toFixed(2)),
        changePercent: Number(((noise(seed * 29) - 0.5) * 8).toFixed(2)),
      });
    }
  }

  return {
    underlying,
    underlyingPrice: spot,
    expirations,
    chain,
    fetchedAt: Date.now(),
  };
}
