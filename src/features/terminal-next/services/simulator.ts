import {
  SimulationClock, RegimeState, RegimeType, Quote, Bar, DepthSnapshot,
  DepthLevel, TapePrint, TapeSide, TapeCondition, Alert, FeedItem,
  Order, TickBatch, Instrument, INSTRUMENTS,
} from '../types';

// ── Seeded PRNG (Mulberry32) ─────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianPair(rng: () => number): [number, number] {
  const u1 = rng();
  const u2 = rng();
  const r = Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10)));
  return [r * Math.cos(2 * Math.PI * u2), r * Math.sin(2 * Math.PI * u2)];
}

// ── Regime Transitions ───────────────────────────────────────────────
const REGIME_CONFIG: Record<RegimeType, { driftBps: number; volBps: number; transitionProb: number }> = {
  'trend-up':       { driftBps: 3.0,  volBps: 8.0,  transitionProb: 0.03 },
  'trend-down':     { driftBps: -3.0, volBps: 9.0,  transitionProb: 0.03 },
  'mean-revert':    { driftBps: 0.0,  volBps: 5.0,  transitionProb: 0.05 },
  'vol-expansion':  { driftBps: 0.0,  volBps: 18.0, transitionProb: 0.08 },
};

const REGIME_TYPES: RegimeType[] = ['trend-up', 'trend-down', 'mean-revert', 'vol-expansion'];

function evolveRegime(state: RegimeState, rng: () => number): RegimeState {
  const roll = rng();
  if (roll < state.transitionProb && state.ticksInRegime > 10) {
    const others = REGIME_TYPES.filter(r => r !== state.current);
    const next = others[Math.floor(rng() * others.length)];
    const cfg = REGIME_CONFIG[next];
    return { current: next, ...cfg, ticksInRegime: 0 };
  }
  return { ...state, ticksInRegime: state.ticksInRegime + 1 };
}

// ── Headlines Pool ───────────────────────────────────────────────────
const HEADLINE_POOL = [
  'Fed officials signal patience on rate decisions amid mixed data',
  'Treasury yields climb as inflation expectations edge higher',
  'Tech earnings beat expectations; guidance cautious on spending',
  'Oil surges on supply disruption concerns in Middle East',
  'Dollar strengthens against major currencies on safe-haven flows',
  'Semiconductor sector rallies on AI infrastructure buildout',
  'Consumer confidence falls to six-month low; retail stocks dip',
  'Institutional flows rotate from growth to value positioning',
  'Bitcoin ETF sees record daily inflows; crypto sentiment shifts',
  'Central bank minutes reveal divided committee on forward guidance',
  'Manufacturing PMI contracts for third consecutive month',
  'Corporate buyback activity accelerates in current quarter',
];

// ── Simulation Engine ────────────────────────────────────────────────
export class SimulationEngine {
  private rng: () => number;
  private clock: SimulationClock;
  private regime: RegimeState;
  private prices: Record<string, number> = {};
  private highs: Record<string, number> = {};
  private lows: Record<string, number> = {};
  private volumes: Record<string, number> = {};
  private prevCloses: Record<string, number> = {};
  private barAccum: Record<string, Bar> = {};
  private barIntervalMs = 60_000;
  private lastBarTime = 0;
  private instruments: Instrument[];
  private pendingOrders: Order[] = [];
  private idCounter = 0;

  constructor(seed: number = 42, cadenceMs: number = 800) {
    this.rng = mulberry32(seed);
    this.instruments = INSTRUMENTS;
    this.clock = { tickId: 0, epochMs: Date.now(), cadenceMs };
    this.regime = { current: 'mean-revert', ...REGIME_CONFIG['mean-revert'], ticksInRegime: 0 };

    for (const inst of this.instruments) {
      this.prices[inst.symbol] = inst.basePrice;
      this.highs[inst.symbol] = inst.basePrice;
      this.lows[inst.symbol] = inst.basePrice;
      this.volumes[inst.symbol] = 0;
      this.prevCloses[inst.symbol] = inst.basePrice;
    }
  }

  private nextId(prefix: string): string {
    return `${prefix}-${++this.idCounter}`;
  }

  submitOrder(order: Omit<Order, 'id' | 'filledQty' | 'avgFillPx' | 'status' | 'createdAt' | 'updatedAt' | 'tickId'>): Order {
    const o: Order = {
      ...order,
      id: this.nextId('ORD'),
      filledQty: 0,
      avgFillPx: 0,
      status: 'WORKING',
      createdAt: this.clock.epochMs,
      updatedAt: this.clock.epochMs,
      tickId: this.clock.tickId,
    };
    this.pendingOrders.push(o);
    return o;
  }

  tick(): TickBatch {
    this.clock = {
      tickId: this.clock.tickId + 1,
      epochMs: this.clock.epochMs + this.clock.cadenceMs,
      cadenceMs: this.clock.cadenceMs,
    };

    this.regime = evolveRegime(this.regime, this.rng);

    const quotes: Quote[] = [];
    const allPrints: TapePrint[] = [];
    const fills: Order[] = [];
    const alerts: Alert[] = [];
    const headlines: FeedItem[] = [];

    const activeSymbol = this.instruments[0].symbol;

    for (const inst of this.instruments) {
      const [g1] = gaussianPair(this.rng);
      const drift = this.regime.driftBps / 10000;
      const vol = this.regime.volBps / 10000;
      const scaledVol = vol * (inst.assetClass === 'crypto' ? 2.5 : inst.assetClass === 'forex' ? 0.3 : 1.0);
      const ret = drift + scaledVol * g1;

      const prev = this.prices[inst.symbol];
      const newPrice = Math.max(prev * (1 + ret), inst.tickSize);
      const rounded = Math.round(newPrice / inst.tickSize) * inst.tickSize;
      this.prices[inst.symbol] = rounded;

      this.highs[inst.symbol] = Math.max(this.highs[inst.symbol], rounded);
      this.lows[inst.symbol] = Math.min(this.lows[inst.symbol], rounded);

      const tickVol = Math.floor(50 + this.rng() * 500 * (this.regime.current === 'vol-expansion' ? 3 : 1));
      this.volumes[inst.symbol] += tickVol;

      const spreadMul = inst.assetClass === 'forex' ? 0.5 : inst.assetClass === 'crypto' ? 1.5 : 1.0;
      const halfSpread = inst.tickSize * (1 + this.rng() * 2) * spreadMul;
      const bid = rounded - halfSpread;
      const ask = rounded + halfSpread;

      const change = rounded - this.prevCloses[inst.symbol];
      const changePct = this.prevCloses[inst.symbol] !== 0 ? (change / this.prevCloses[inst.symbol]) * 100 : 0;

      quotes.push({
        symbol: inst.symbol,
        bid: Math.round(bid / inst.tickSize) * inst.tickSize,
        ask: Math.round(ask / inst.tickSize) * inst.tickSize,
        last: rounded,
        prevClose: this.prevCloses[inst.symbol],
        change,
        changePct,
        high: this.highs[inst.symbol],
        low: this.lows[inst.symbol],
        volume: this.volumes[inst.symbol],
        tickId: this.clock.tickId,
      });

      const numPrints = 1 + Math.floor(this.rng() * 4);
      for (let i = 0; i < numPrints; i++) {
        const side: TapeSide = this.rng() > 0.5 ? 'buy' : 'sell';
        const px = side === 'buy' ? ask - this.rng() * halfSpread * 0.3 : bid + this.rng() * halfSpread * 0.3;
        const sz = Math.floor(10 + this.rng() * 200);
        let condition: TapeCondition = 'normal';
        if (sz > 150) condition = 'block';
        else if (this.rng() > 0.95) condition = 'sweep';
        else if (sz < 20) condition = 'odd-lot';

        allPrints.push({
          id: this.nextId('PRT'),
          symbol: inst.symbol,
          price: Math.round(px / inst.tickSize) * inst.tickSize,
          size: sz,
          side,
          condition,
          epochMs: this.clock.epochMs,
          tickId: this.clock.tickId,
          aboveBid: px > (bid + ask) / 2,
        });
      }
    }

    // Match pending orders against current prices
    for (let i = this.pendingOrders.length - 1; i >= 0; i--) {
      const order = this.pendingOrders[i];
      const px = this.prices[order.symbol];
      if (!px) continue;

      let shouldFill = false;
      if (order.type === 'MKT') shouldFill = true;
      else if (order.type === 'LMT') {
        if (order.side === 'BUY' && px <= order.price) shouldFill = true;
        if (order.side === 'SELL' && px >= order.price) shouldFill = true;
      } else if (order.type === 'STP') {
        if (order.side === 'BUY' && px >= order.price) shouldFill = true;
        if (order.side === 'SELL' && px <= order.price) shouldFill = true;
      }

      if (shouldFill) {
        const partial = this.rng() > 0.7 && order.filledQty === 0;
        const fillQty = partial ? Math.floor(order.qty * (0.3 + this.rng() * 0.4)) : order.qty - order.filledQty;
        order.filledQty += fillQty;
        order.avgFillPx = px;
        order.status = order.filledQty >= order.qty ? 'FILLED' : 'PARTIAL';
        order.updatedAt = this.clock.epochMs;
        order.tickId = this.clock.tickId;
        fills.push({ ...order });
        if (order.status === 'FILLED') this.pendingOrders.splice(i, 1);
      }
    }

    // Alerts on large moves
    for (const q of quotes) {
      if (Math.abs(q.changePct) > 1.5) {
        alerts.push({
          id: this.nextId('ALT'),
          level: Math.abs(q.changePct) > 3 ? 'critical' : 'warning',
          message: `${q.symbol} ${q.changePct > 0 ? '▲' : '▼'}${Math.abs(q.changePct).toFixed(2)}%`,
          symbol: q.symbol,
          epochMs: this.clock.epochMs,
          tickId: this.clock.tickId,
        });
      }
    }

    // Occasional headlines
    if (this.rng() > 0.92) {
      const idx = Math.floor(this.rng() * HEADLINE_POOL.length);
      headlines.push({
        id: this.nextId('HDL'),
        type: 'headline',
        message: HEADLINE_POOL[idx],
        epochMs: this.clock.epochMs,
        tickId: this.clock.tickId,
      });
    }

    // Build depth for active symbol
    const depth = this.buildDepth(activeSymbol);

    // Build bars
    const bars = this.accumulateBars();

    return {
      clock: { ...this.clock },
      quotes,
      bars,
      depth,
      prints: allPrints.filter(p => p.symbol === activeSymbol).slice(-20),
      fills,
      alerts,
      headlines,
      regime: { ...this.regime },
    };
  }

  private buildDepth(symbol: string): DepthSnapshot {
    const inst = this.instruments.find(i => i.symbol === symbol);
    const price = this.prices[symbol] || 100;
    const tick = inst?.tickSize || 0.01;

    const bids: DepthLevel[] = [];
    const asks: DepthLevel[] = [];
    let bidCum = 0;
    let askCum = 0;

    for (let i = 0; i < 10; i++) {
      const bidSz = Math.floor(50 + this.rng() * 400);
      const askSz = Math.floor(50 + this.rng() * 400);
      bidCum += bidSz;
      askCum += askSz;

      bids.push({
        price: Math.round((price - tick * (i + 1)) / tick) * tick,
        size: bidSz,
        orders: 1 + Math.floor(this.rng() * 8),
        cumulative: bidCum,
      });
      asks.push({
        price: Math.round((price + tick * (i + 1)) / tick) * tick,
        size: askSz,
        orders: 1 + Math.floor(this.rng() * 8),
        cumulative: askCum,
      });
    }

    const totalBid = bids.reduce((s, l) => s + l.size, 0);
    const totalAsk = asks.reduce((s, l) => s + l.size, 0);
    const spread = asks[0].price - bids[0].price;

    return {
      symbol,
      bids,
      asks,
      spread,
      spreadBps: price > 0 ? (spread / price) * 10000 : 0,
      imbalance: (totalBid - totalAsk) / (totalBid + totalAsk),
      tickId: this.clock.tickId,
    };
  }

  private accumulateBars(): Bar[] {
    const now = this.clock.epochMs;
    const barTime = Math.floor(now / this.barIntervalMs) * this.barIntervalMs;

    const newBars: Bar[] = [];

    for (const inst of this.instruments) {
      const px = this.prices[inst.symbol];
      const existing = this.barAccum[inst.symbol];

      if (!existing || barTime > existing.time) {
        if (existing) newBars.push({ ...existing });
        this.barAccum[inst.symbol] = {
          time: barTime / 1000,
          open: px,
          high: px,
          low: px,
          close: px,
          volume: 0,
        };
      } else {
        existing.high = Math.max(existing.high, px);
        existing.low = Math.min(existing.low, px);
        existing.close = px;
        existing.volume += Math.floor(50 + this.rng() * 200);
      }
    }

    return newBars;
  }

  getClock(): SimulationClock { return { ...this.clock }; }
  getRegime(): RegimeState { return { ...this.regime }; }
  getPrice(symbol: string): number { return this.prices[symbol] || 0; }
  getInstruments(): Instrument[] { return [...this.instruments]; }
}
