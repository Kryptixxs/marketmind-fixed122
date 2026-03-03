import { MarketSnapshot, ConfluenceResult } from './types';

export class ConfluenceEngine {
  private data: MarketSnapshot;

  constructor(snapshot: MarketSnapshot) {
    this.data = snapshot;
  }

  // Technical Analysis Math Helpers
  private SMA(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1] || 0;
    return data.slice(-period).reduce((a, b) => a + b, 0) / period;
  }

  private EMA(data: number[], period: number): number {
    if (data.length < period) return data[data.length - 1] || 0;
    const k = 2 / (period + 1);
    let ema = data[data.length - period];
    for (let i = data.length - period + 1; i < data.length; i++) {
      ema = (data[i] - ema) * k + ema;
    }
    return ema;
  }

  private RSI(data: number[], period: number): number {
    if (data.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = data.length - period; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const rs = (gains / period) / ((losses / period) || 1);
    return 100 - (100 / (1 + rs));
  }

  private ATR(highs: number[], lows: number[], closes: number[], period: number): number {
    if (highs.length <= period) return 0;
    let trSum = 0;
    for(let i = highs.length - period; i < highs.length; i++) {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i-1]);
      const lc = Math.abs(lows[i] - closes[i-1]);
      trSum += Math.max(hl, hc, lc);
    }
    return trSum / period;
  }

  public calculateAll(): ConfluenceResult[] {
    const quotes = this.data.quotes;
    if (!quotes || quotes.length < 50) return []; // Require min data

    const closes = quotes.map(q => q.close);
    const highs = quotes.map(q => q.high);
    const lows = quotes.map(q => q.low);
    const opens = quotes.map(q => q.open);
    const volumes = quotes.map(q => q.volume);
    
    const last = quotes[quotes.length - 1];
    const prev = quotes[quotes.length - 2];
    const prev2 = quotes[quotes.length - 3];

    // Pre-calculate indicators
    const ema9 = this.EMA(closes, 9);
    const ema20 = this.EMA(closes, 20);
    const ema21 = this.EMA(closes, 21);
    const ema50 = this.EMA(closes, 50);
    const ema100 = this.EMA(closes, 100);
    const ema200 = this.EMA(closes, 200);
    const sma200 = this.SMA(closes, 200);
    
    const prevEma50 = this.EMA(closes.slice(0, -1), 50);
    const prevEma200 = this.EMA(closes.slice(0, -1), 200);

    const rsi14 = this.RSI(closes, 14);
    const atr14 = this.ATR(highs, lows, closes, 14);
    const avgVol20 = this.SMA(volumes, 20);

    const recentHigh20 = Math.max(...highs.slice(-21, -1));
    const recentLow20 = Math.min(...lows.slice(-21, -1));
    const rangeMid = (recentHigh20 + recentLow20) / 2;

    const dailyHigh = highs.slice(-2, -1)[0];
    const dailyLow = lows.slice(-2, -1)[0];
    
    // Candlestick math
    const isBullEngulf = last.close > prev.open && last.open < prev.close && last.close > last.open && prev.close < prev.open;
    const isBearEngulf = last.close < prev.open && last.open > prev.close && last.close < last.open && prev.close > prev.open;
    const isDoji = Math.abs(last.open - last.close) <= (last.high - last.low) * 0.1;
    const isHammer = (last.close - last.low) / (last.high - last.low) > 0.6 && Math.abs(last.close - last.open) < (last.high - last.low) * 0.3;

    return [
      // ================= MARKET STRUCTURE =================
      { id: 'MS_HTF', label: 'Higher timeframe trend alignment', category: 'STRUCTURE', isActive: last.close > sma200, score: 85, description: 'Price is above 200 SMA indicating macro uptrend.' },
      { id: 'MS_MTF', label: 'Multi-timeframe structure alignment', category: 'STRUCTURE', isActive: last.close > ema50 && last.close > sma200, score: 90, description: 'Aligned above both medium and long term moving averages.' },
      { id: 'MS_BOS', label: 'Break of structure (BOS)', category: 'STRUCTURE', isActive: last.close > recentHigh20, score: 95, description: 'Price closed above recent 20-period swing high.' },
      { id: 'MS_CHOCH', label: 'Change of character (ChoCH)', category: 'STRUCTURE', isActive: prev.close < recentHigh20 && last.close > recentHigh20, score: 80, description: 'Initial shift in structural delivery.' },
      { id: 'MS_MSS', label: 'Market structure shift (MSS)', category: 'STRUCTURE', isActive: last.close < recentLow20, score: 95, description: 'Price closed below recent 20-period swing low.' },
      { id: 'MS_HH', label: 'Higher high at demand', category: 'STRUCTURE', isActive: last.high > prev.high && last.close > ema50, score: 70, description: 'Forming higher highs near dynamic demand.' },
      { id: 'MS_LL', label: 'Lower low at supply', category: 'STRUCTURE', isActive: last.low < prev.low && last.close < ema50, score: 70, description: 'Forming lower lows near dynamic supply.' },
      { id: 'MS_EQH', label: 'Equal highs liquidity', category: 'STRUCTURE', isActive: Math.abs(last.high - recentHigh20) / last.high < 0.002, score: 75, description: 'Resting buy-stop liquidity pooled above equal highs.' },
      { id: 'MS_EQL', label: 'Equal lows liquidity', category: 'STRUCTURE', isActive: Math.abs(last.low - recentLow20) / last.low < 0.002, score: 75, description: 'Resting sell-stop liquidity pooled below equal lows.' },
      { id: 'MS_ILS', label: 'Internal liquidity sweep', category: 'STRUCTURE', isActive: last.low < prev.low && last.close > prev.low, score: 85, description: 'Swept previous period low and recovered.' },
      { id: 'MS_ELS', label: 'External liquidity sweep', category: 'STRUCTURE', isActive: last.high > recentHigh20 && last.close < recentHigh20, score: 90, description: 'Swept major swing high liquidity and rejected.' },
      { id: 'MS_TL', label: 'Trendline confluence', category: 'STRUCTURE', isActive: false, score: 0, description: 'Requires manual drawn line.' },
      { id: 'MS_CH', label: 'Channel boundary', category: 'STRUCTURE', isActive: Math.abs(last.close - ema50) < atr14, score: 60, description: 'Trading near the median of an active channel.' },
      { id: 'MS_RH', label: 'Range high', category: 'STRUCTURE', isActive: Math.abs(last.close - recentHigh20) < atr14, score: 70, description: 'Approaching the top of the current trading range.' },
      { id: 'MS_RL', label: 'Range low', category: 'STRUCTURE', isActive: Math.abs(last.close - recentLow20) < atr14, score: 70, description: 'Approaching the bottom of the current trading range.' },
      { id: 'MS_RM', label: 'Range midpoint', category: 'STRUCTURE', isActive: Math.abs(last.close - rangeMid) < atr14 * 0.5, score: 50, description: 'Trading in the equilibrium of the range.' },
      { id: 'MS_REXP', label: 'Range expansion', category: 'STRUCTURE', isActive: (last.high - last.low) > atr14 * 1.5, score: 80, description: 'Daily range significantly larger than ATR.' },
      { id: 'MS_RCON', label: 'Range contraction', category: 'STRUCTURE', isActive: (last.high - last.low) < atr14 * 0.5, score: 75, description: 'Volatility squeezing, expect expansion soon.' },
      { id: 'MS_COMP', label: 'Compression before breakout', category: 'STRUCTURE', isActive: (last.high - last.low) < atr14 * 0.5 && rsi14 > 50, score: 80, description: 'Tight consolidation indicating built-up energy.' },
      { id: 'MS_EXP', label: 'Expansion after compression', category: 'STRUCTURE', isActive: prev.high - prev.low < atr14 * 0.5 && last.high - last.low > atr14, score: 85, description: 'Volatility expanding out of a squeeze.' },
      { id: 'MS_FLAG', label: 'Flag structure', category: 'STRUCTURE', isActive: false, score: 0, description: 'Algorithmic shape detection requires pattern overlay.' },
      { id: 'MS_PEN', label: 'Pennant structure', category: 'STRUCTURE', isActive: false, score: 0, description: 'Algorithmic shape detection requires pattern overlay.' },
      { id: 'MS_WEDGE', label: 'Wedge structure', category: 'STRUCTURE', isActive: false, score: 0, description: 'Algorithmic shape detection requires pattern overlay.' },
      { id: 'MS_HS', label: 'Head and shoulders', category: 'STRUCTURE', isActive: false, score: 0, description: 'Complex structural pattern.' },
      { id: 'MS_IHS', label: 'Inverse head and shoulders', category: 'STRUCTURE', isActive: false, score: 0, description: 'Complex structural pattern.' },
      { id: 'MS_DT', label: 'Double top', category: 'STRUCTURE', isActive: Math.abs(last.high - recentHigh20) / last.high < 0.005 && last.close < last.open, score: 80, description: 'Rejected off previous macro high.' },
      { id: 'MS_DB', label: 'Double bottom', category: 'STRUCTURE', isActive: Math.abs(last.low - recentLow20) / last.low < 0.005 && last.close > last.open, score: 80, description: 'Supported at previous macro low.' },
      { id: 'MS_TT', label: 'Triple top', category: 'STRUCTURE', isActive: false, score: 0, description: 'Advanced structural pattern.' },
      { id: 'MS_TB', label: 'Triple bottom', category: 'STRUCTURE', isActive: false, score: 0, description: 'Advanced structural pattern.' },
      { id: 'MS_RB', label: 'Rounded bottom', category: 'STRUCTURE', isActive: false, score: 0, description: 'Advanced structural pattern.' },
      { id: 'MS_PAR', label: 'Parabolic structure', category: 'STRUCTURE', isActive: last.close > ema9 && ema9 > ema20 && ema20 > ema50 && (last.close - ema50) / ema50 > 0.1, score: 90, description: 'Price is aggressively accelerating away from mean.' },
      { id: 'MS_BASE', label: 'Base formation', category: 'STRUCTURE', isActive: (recentHigh20 - recentLow20) / last.close < 0.05, score: 70, description: 'Extended tight range building a base.' },
      { id: 'MS_DIST', label: 'Distribution structure', category: 'STRUCTURE', isActive: last.close < ema20 && rsi14 < 50 && (recentHigh20 - recentLow20) / last.close < 0.05, score: 75, description: 'Heavy supply entering the market.' },
      { id: 'MS_ACC', label: 'Accumulation structure', category: 'STRUCTURE', isActive: last.close > ema20 && rsi14 > 50 && (recentHigh20 - recentLow20) / last.close < 0.05, score: 75, description: 'Institutional buying absorbing supply.' },
      { id: 'MS_WYSPR', label: 'Wyckoff spring', category: 'STRUCTURE', isActive: last.low < recentLow20 && last.close > recentLow20 && volumes[volumes.length-1] > avgVol20, score: 90, description: 'Terminal shakeout below trading range.' },
      { id: 'MS_WYUP', label: 'Wyckoff upthrust', category: 'STRUCTURE', isActive: last.high > recentHigh20 && last.close < recentHigh20 && volumes[volumes.length-1] > avgVol20, score: 90, description: 'Terminal bull trap above trading range.' },
      { id: 'MS_REACC', label: 'Reaccumulation', category: 'STRUCTURE', isActive: last.close > sma200 && rsi14 > 40 && rsi14 < 60, score: 65, description: 'Consolidating in a macro uptrend.' },
      { id: 'MS_REDIST', label: 'Redistribution', category: 'STRUCTURE', isActive: last.close < sma200 && rsi14 > 40 && rsi14 < 60, score: 65, description: 'Consolidating in a macro downtrend.' },

      // ================= SUPPLY / DEMAND / SMC =================
      { id: 'SMC_FDZ', label: 'Fresh demand zone', category: 'SMC', isActive: last.close > ema20 && last.low <= ema20, score: 75, description: 'Tapped dynamic demand level.' },
      { id: 'SMC_FSZ', label: 'Fresh supply zone', category: 'SMC', isActive: last.close < ema20 && last.high >= ema20, score: 75, description: 'Tapped dynamic supply level.' },
      { id: 'SMC_MOB', label: 'Mitigated order block', category: 'SMC', isActive: false, score: 0, description: 'Requires historical block mapping.' },
      { id: 'SMC_UOB', label: 'Unmitigated order block', category: 'SMC', isActive: last.close > prev2.high && last.low < prev2.high, score: 80, description: 'Price tapping into a recent structural origin.' },
      { id: 'SMC_BOB', label: 'Bullish order block', category: 'SMC', isActive: prev.close < prev.open && last.close > prev.high, score: 85, description: 'Last down candle engulfed by momentum.' },
      { id: 'SMC_BEOB', label: 'Bearish order block', category: 'SMC', isActive: prev.close > prev.open && last.close < prev.low, score: 85, description: 'Last up candle engulfed by momentum.' },
      { id: 'SMC_BRB', label: 'Breaker block', category: 'SMC', isActive: false, score: 0, description: 'Failed OB converted to support/resistance.' },
      { id: 'SMC_MB', label: 'Mitigation block', category: 'SMC', isActive: false, score: 0, description: 'Structure mapping required.' },
      { id: 'SMC_FVG', label: 'Fair value gap (FVG)', category: 'SMC', isActive: last.low > prev2.high, score: 85, description: 'Bullish price imbalance (BISI) detected.' },
      { id: 'SMC_IFVG', label: 'Inverse FVG', category: 'SMC', isActive: last.high < prev2.low, score: 85, description: 'Bearish price imbalance (SIBI) detected.' },
      { id: 'SMC_BPR', label: 'Balanced price range', category: 'SMC', isActive: false, score: 0, description: 'Overlapping FVGs filled.' },
      { id: 'SMC_LV', label: 'Liquidity void', category: 'SMC', isActive: last.open - last.close > atr14 * 2, score: 90, description: 'Aggressive displacement leaving a void.' },
      { id: 'SMC_IMB', label: 'Imbalance', category: 'SMC', isActive: last.low > prev2.high || last.high < prev2.low, score: 80, description: 'Inefficient price delivery.' },
      { id: 'SMC_PA', label: 'Premium array', category: 'SMC', isActive: last.close > rangeMid, score: 60, description: 'Price in the upper 50% of the dealing range.' },
      { id: 'SMC_DA', label: 'Discount array', category: 'SMC', isActive: last.close < rangeMid, score: 60, description: 'Price in the lower 50% of the dealing range.' },
      { id: 'SMC_OTE', label: 'Optimal trade entry (OTE 62–79%)', category: 'SMC', isActive: last.close >= recentLow20 + (recentHigh20-recentLow20)*0.62 && last.close <= recentLow20 + (recentHigh20-recentLow20)*0.79, score: 95, description: 'Deep retracement into the algorithmic killzone.' },
      { id: 'SMC_CE', label: 'Consequent encroachment', category: 'SMC', isActive: false, score: 0, description: 'Requires specific FVG mapping.' },
      { id: 'SMC_VI', label: 'Volume imbalance', category: 'SMC', isActive: prev.close !== last.open, score: 70, description: 'Gap between bodies, wicks overlap.' },
      { id: 'SMC_IND', label: 'Inducement level', category: 'SMC', isActive: false, score: 0, description: 'Retail support level built for sweeping.' },
      { id: 'SMC_PDA', label: 'PD array alignment', category: 'SMC', isActive: last.close > ema20 && last.close < rangeMid, score: 80, description: 'Discounted structure aligned with momentum.' },
      { id: 'SMC_DRM', label: 'Dealing range midpoint', category: 'SMC', isActive: Math.abs(last.close - rangeMid) < last.close * 0.001, score: 70, description: 'Equilibrium point of the current swing.' },

      // ================= SUPPORT / RESISTANCE =================
      { id: 'SR_DH', label: 'Daily high', category: 'SR', isActive: Math.abs(last.close - dailyHigh) < atr14 * 0.2, score: 70, description: 'Testing previous session high.' },
      { id: 'SR_DL', label: 'Daily low', category: 'SR', isActive: Math.abs(last.close - dailyLow) < atr14 * 0.2, score: 70, description: 'Testing previous session low.' },
      { id: 'SR_WH', label: 'Weekly high', category: 'SR', isActive: Math.abs(last.close - Math.max(...highs.slice(-5))) < atr14 * 0.2, score: 80, description: 'Testing 5-day rolling high.' },
      { id: 'SR_WL', label: 'Weekly low', category: 'SR', isActive: Math.abs(last.close - Math.min(...lows.slice(-5))) < atr14 * 0.2, score: 80, description: 'Testing 5-day rolling low.' },
      { id: 'SR_MH', label: 'Monthly high', category: 'SR', isActive: Math.abs(last.close - Math.max(...highs.slice(-20))) < atr14 * 0.2, score: 90, description: 'Testing 20-day rolling high.' },
      { id: 'SR_ML', label: 'Monthly low', category: 'SR', isActive: Math.abs(last.close - Math.min(...lows.slice(-20))) < atr14 * 0.2, score: 90, description: 'Testing 20-day rolling low.' },
      { id: 'SR_PSH', label: 'Previous session high', category: 'SR', isActive: last.high >= dailyHigh, score: 65, description: 'Broke above prior day high.' },
      { id: 'SR_PSL', label: 'Previous session low', category: 'SR', isActive: last.low <= dailyLow, score: 65, description: 'Broke below prior day low.' },
      { id: 'SR_PC', label: 'Previous close', category: 'SR', isActive: Math.abs(last.close - prev.close) < atr14 * 0.1, score: 50, description: 'Hovering at unchanged.' },
      { id: 'SR_VWAP', label: 'VWAP', category: 'SR', isActive: false, score: 0, description: 'Requires intraday tick data.' },
      { id: 'SR_AVWAP', label: 'Anchored VWAP', category: 'SR', isActive: false, score: 0, description: 'Requires user-defined anchor.' },
      { id: 'SR_RVWAP', label: 'Rolling VWAP', category: 'SR', isActive: false, score: 0, description: 'Requires intraday tick data.' },
      { id: 'SR_PIV', label: 'Pivot point', category: 'SR', isActive: false, score: 0, description: 'Classic pivot calculation.' },
      { id: 'SR_R1S1', label: 'R1/S1', category: 'SR', isActive: false, score: 0, description: 'Classic pivot calculation.' },
      { id: 'SR_R2S2', label: 'R2/S2', category: 'SR', isActive: false, score: 0, description: 'Classic pivot calculation.' },
      { id: 'SR_R3S3', label: 'R3/S3', category: 'SR', isActive: false, score: 0, description: 'Classic pivot calculation.' },
      { id: 'SR_PSY', label: 'Psychological level', category: 'SR', isActive: last.close % 100 < 1 || last.close % 100 > 99, score: 75, description: 'Trading near a major round hundred.' },
      { id: 'SR_RN', label: 'Round number', category: 'SR', isActive: last.close % 10 < 0.1 || last.close % 10 > 9.9, score: 60, description: 'Trading near a round ten.' },
      { id: 'SR_HD', label: 'Half dollar level', category: 'SR', isActive: Math.abs((last.close % 1) - 0.5) < 0.05, score: 50, description: 'Equities .50 level.' },
      { id: 'SR_QL', label: 'Quarter level', category: 'SR', isActive: Math.abs((last.close % 1) - 0.25) < 0.05 || Math.abs((last.close % 1) - 0.75) < 0.05, score: 40, description: 'Equities .25/.75 level.' },
      { id: 'SR_GF', label: 'Gap fill level', category: 'SR', isActive: last.low <= prev.high && last.open > prev.high, score: 85, description: 'Filling an opening gap.' },
      { id: 'SR_ORH', label: 'Opening range high', category: 'SR', isActive: false, score: 0, description: 'Requires intraday time series.' },
      { id: 'SR_ORL', label: 'Opening range low', category: 'SR', isActive: false, score: 0, description: 'Requires intraday time series.' },
      { id: 'SR_ORB', label: 'Opening range breakout', category: 'SR', isActive: false, score: 0, description: 'Requires intraday time series.' },
      { id: 'SR_PDV', label: 'Prior day VWAP', category: 'SR', isActive: false, score: 0, description: 'Requires intraday volume.' },
      { id: 'SR_PWV', label: 'Prior week VWAP', category: 'SR', isActive: false, score: 0, description: 'Requires intraday volume.' },

      // ================= MOVING AVERAGES =================
      { id: 'MA_9EMA', label: '9 EMA', category: 'MA', isActive: Math.abs(last.close - ema9) < atr14 * 0.2, score: 70, description: 'Testing fast momentum moving average.' },
      { id: 'MA_20EMA', label: '20 EMA', category: 'MA', isActive: Math.abs(last.close - ema20) < atr14 * 0.2, score: 75, description: 'Testing short-term moving average.' },
      { id: 'MA_21EMA', label: '21 EMA', category: 'MA', isActive: Math.abs(last.close - ema21) < atr14 * 0.2, score: 75, description: 'Testing short-term moving average.' },
      { id: 'MA_50EMA', label: '50 EMA', category: 'MA', isActive: Math.abs(last.close - ema50) < atr14 * 0.2, score: 85, description: 'Testing medium-term moving average.' },
      { id: 'MA_100EMA', label: '100 EMA', category: 'MA', isActive: Math.abs(last.close - ema100) < atr14 * 0.2, score: 85, description: 'Testing medium-long moving average.' },
      { id: 'MA_200EMA', label: '200 EMA', category: 'MA', isActive: Math.abs(last.close - ema200) < atr14 * 0.2, score: 95, description: 'Testing macro trend moving average.' },
      { id: 'MA_200SMA', label: '200 SMA', category: 'MA', isActive: Math.abs(last.close - sma200) < atr14 * 0.2, score: 95, description: 'Testing institutional macro baseline.' },
      { id: 'MA_CROSS', label: 'EMA cross', category: 'MA', isActive: (ema9 > ema21 && prev.close < ema21) || (ema9 < ema21 && prev.close > ema21), score: 80, description: 'Fast MA crossing Slow MA.' },
      { id: 'MA_GC', label: 'Golden cross', category: 'MA', isActive: ema50 > sma200 && prevEma50 <= prevEma200, score: 100, description: 'Macro bullish structural shift.' },
      { id: 'MA_DC', label: 'Death cross', category: 'MA', isActive: ema50 < sma200 && prevEma50 >= prevEma200, score: 100, description: 'Macro bearish structural shift.' },
      { id: 'MA_P200', label: 'Price above 200 MA', category: 'MA', isActive: last.close > sma200, score: 80, description: 'Long term bias is bullish.' },
      { id: 'MA_SLOPE', label: 'MA slope alignment', category: 'MA', isActive: ema9 > ema20 && ema20 > ema50 && ema50 > sma200, score: 90, description: 'All moving averages fanning out bullishly.' },
      { id: 'MA_CLUS', label: 'MA cluster', category: 'MA', isActive: Math.abs(ema20 - ema50) / last.close < 0.01, score: 70, description: 'Moving averages tightly coiled, expect expansion.' },
      { id: 'MA_VWMA', label: 'VWMA', category: 'MA', isActive: false, score: 0, description: 'Requires Volume Weighted calc.' },
      { id: 'MA_HULL', label: 'Hull MA', category: 'MA', isActive: false, score: 0, description: 'Hull moving average.' },
      { id: 'MA_KAMA', label: 'KAMA', category: 'MA', isActive: false, score: 0, description: 'Kaufman adaptive.' },
      { id: 'MA_RCOMP', label: 'Ribbon compression', category: 'MA', isActive: Math.abs(ema9 - ema50) / last.close < 0.01, score: 75, description: 'EMAs converging, low volatility state.' },
      { id: 'MA_REXP', label: 'Ribbon expansion', category: 'MA', isActive: Math.abs(ema9 - ema50) / last.close > 0.05, score: 85, description: 'EMAs diverging, high trend strength.' },

      // ================= MOMENTUM INDICATORS =================
      { id: 'MOM_RSI_OS', label: 'RSI oversold', category: 'MOMENTUM', isActive: rsi14 < 30, score: 80, description: 'RSI reading below 30 threshold.' },
      { id: 'MOM_RSI_OB', label: 'RSI overbought', category: 'MOMENTUM', isActive: rsi14 > 70, score: 80, description: 'RSI reading above 70 threshold.' },
      { id: 'MOM_RSI_DIV', label: 'RSI divergence', category: 'MOMENTUM', isActive: last.close < prev.close && rsi14 > 35, score: 70, description: 'Price making lower lows, RSI making higher lows (approx).' },
      { id: 'MOM_RSI_HDIV', label: 'RSI hidden divergence', category: 'MOMENTUM', isActive: false, score: 0, description: 'Advanced divergence calculation.' },
      { id: 'MOM_ST_OS', label: 'Stochastic oversold', category: 'MOMENTUM', isActive: false, score: 0, description: 'Stochastic < 20.' },
      { id: 'MOM_ST_OB', label: 'Stochastic overbought', category: 'MOMENTUM', isActive: false, score: 0, description: 'Stochastic > 80.' },
      { id: 'MOM_ST_C', label: 'Stochastic cross', category: 'MOMENTUM', isActive: false, score: 0, description: 'K and D lines crossing.' },
      { id: 'MOM_MACD_C', label: 'MACD crossover', category: 'MOMENTUM', isActive: false, score: 0, description: 'MACD line crossing signal line.' },
      { id: 'MOM_MACD_DIV', label: 'MACD divergence', category: 'MOMENTUM', isActive: false, score: 0, description: 'Price divergent from MACD.' },
      { id: 'MOM_MACD_Z', label: 'MACD zero line cross', category: 'MOMENTUM', isActive: false, score: 0, description: 'MACD crossing above/below 0.' },
      { id: 'MOM_HIST', label: 'Histogram expansion', category: 'MOMENTUM', isActive: false, score: 0, description: 'MACD histogram growing.' },
      { id: 'MOM_SHIFT', label: 'Momentum shift', category: 'MOMENTUM', isActive: rsi14 > 50 && prev.close < prev.open && last.close > last.open, score: 75, description: 'Bullish engulfing with RSI > 50.' },
      { id: 'MOM_ROC', label: 'ROC spike', category: 'MOMENTUM', isActive: (last.close - closes[closes.length-10]) / closes[closes.length-10] > 0.05, score: 85, description: 'Rate of Change > 5%.' },
      { id: 'MOM_CCI', label: 'CCI extreme', category: 'MOMENTUM', isActive: false, score: 0, description: 'Commodity Channel Index.' },
      { id: 'MOM_WIL', label: 'Williams %R extreme', category: 'MOMENTUM', isActive: false, score: 0, description: 'Williams %R overbought/oversold.' },
      { id: 'MOM_ADX_E', label: 'ADX expansion', category: 'MOMENTUM', isActive: false, score: 0, description: 'Trend strength increasing.' },
      { id: 'MOM_ADX_C', label: 'ADX contraction', category: 'MOMENTUM', isActive: false, score: 0, description: 'Trend strength decreasing.' },

      // ================= VOLUME & ORDER FLOW =================
      { id: 'VOL_SPIKE', label: 'Volume spike', category: 'VOLUME', isActive: last.volume > avgVol20 * 1.5, score: 85, description: 'Volume is 50% above 20-day average.' },
      { id: 'VOL_CLIMAX', label: 'Volume climax', category: 'VOLUME', isActive: last.volume === Math.max(...volumes.slice(-20)), score: 95, description: 'Highest volume in the last 20 days.' },
      { id: 'VOL_DRY', label: 'Volume dry-up', category: 'VOLUME', isActive: last.volume < avgVol20 * 0.5, score: 70, description: 'Volume is 50% below 20-day average.' },
      { id: 'VOL_DIV', label: 'Volume divergence', category: 'VOLUME', isActive: last.close > prev.close && last.volume < prev.volume, score: 75, description: 'Price advancing on declining volume.' },
      { id: 'VOL_RVOL', label: 'Relative volume (RVOL) > 2', category: 'VOLUME', isActive: last.volume > avgVol20 * 2, score: 95, value: (last.volume / avgVol20).toFixed(1), description: 'Massive institutional participation.' },
      { id: 'VOL_HVN', label: 'Volume profile HVN', category: 'VOLUME', isActive: false, score: 0, description: 'High Volume Node (Requires VPVR).' },
      { id: 'VOL_LVN', label: 'Volume profile LVN', category: 'VOLUME', isActive: false, score: 0, description: 'Low Volume Node (Requires VPVR).' },
      { id: 'VOL_POC', label: 'Point of control (POC)', category: 'VOLUME', isActive: false, score: 0, description: 'Requires VPVR data.' },
      { id: 'VOL_NPOC', label: 'Naked POC', category: 'VOLUME', isActive: false, score: 0, description: 'Untested Point of Control.' },
      { id: 'VOL_SHELF', label: 'Volume shelf', category: 'VOLUME', isActive: false, score: 0, description: 'Requires VPVR data.' },
      { id: 'VOL_DDIV', label: 'Delta divergence', category: 'VOLUME', isActive: false, score: 0, description: 'Requires L2 order flow data.' },
      { id: 'VOL_CDD', label: 'Cumulative delta divergence', category: 'VOLUME', isActive: false, score: 0, description: 'Requires L2 order flow data.' },
      { id: 'VOL_ABS', label: 'Absorption', category: 'VOLUME', isActive: last.volume > avgVol20 * 1.5 && Math.abs(last.close - last.open) < atr14 * 0.2, score: 90, description: 'High volume but no price progress (Iceberg likely).' },
      { id: 'VOL_ICE', label: 'Iceberg orders', category: 'VOLUME', isActive: false, score: 0, description: 'Requires L2 footprint.' },
      { id: 'VOL_STOP', label: 'Stop run', category: 'VOLUME', isActive: last.high > recentHigh20 && last.close < prev.close, score: 85, description: 'Pushed above highs and reversed.' },
      { id: 'VOL_SWEEP', label: 'Liquidity sweep with volume spike', category: 'VOLUME', isActive: last.high > recentHigh20 && last.close < prev.close && last.volume > avgVol20 * 1.5, score: 100, description: 'High volume trap at structure highs.' },
      { id: 'VOL_TAPE', label: 'Tape acceleration', category: 'VOLUME', isActive: false, score: 0, description: 'Requires real-time tick speed data.' },
      { id: 'VOL_BID', label: 'Bid/ask imbalance', category: 'VOLUME', isActive: false, score: 0, description: 'Requires L2 depth.' },
      { id: 'VOL_FOOT', label: 'Footprint imbalance', category: 'VOLUME', isActive: false, score: 0, description: 'Requires footprint chart data.' },
      { id: 'VOL_STACK', label: 'Stacked imbalance', category: 'VOLUME', isActive: false, score: 0, description: 'Requires footprint chart data.' },
      { id: 'VOL_FLIP', label: 'Delta flip', category: 'VOLUME', isActive: false, score: 0, description: 'Requires order flow delta.' },
      { id: 'VOL_SPOOF', label: 'Order book spoof', category: 'VOLUME', isActive: false, score: 0, description: 'Requires historical L2 book.' },
      { id: 'VOL_BLOCK', label: 'Large block trade', category: 'VOLUME', isActive: false, score: 0, description: 'Requires trade tape.' },
      { id: 'VOL_VWREC', label: 'VWAP reclaim', category: 'VOLUME', isActive: false, score: 0, description: 'Requires intraday VWAP.' },
      { id: 'VOL_VWREJ', label: 'VWAP rejection', category: 'VOLUME', isActive: false, score: 0, description: 'Requires intraday VWAP.' },

      // ================= CANDLESTICK SIGNALS =================
      { id: 'CAN_BULL_ENG', label: 'Bullish engulfing', category: 'CANDLE', isActive: isBullEngulf, score: 85, description: 'Body fully engulfs prior red candle.' },
      { id: 'CAN_BEAR_ENG', label: 'Bearish engulfing', category: 'CANDLE', isActive: isBearEngulf, score: 85, description: 'Body fully engulfs prior green candle.' },
      { id: 'CAN_PIN', label: 'Pin bar', category: 'CANDLE', isActive: isHammer, score: 80, description: 'Long wick rejecting lower prices.' },
      { id: 'CAN_HAM', label: 'Hammer', category: 'CANDLE', isActive: isHammer && last.close > last.open, score: 80, description: 'Bullish rejection off lows.' },
      { id: 'CAN_STAR', label: 'Shooting star', category: 'CANDLE', isActive: (last.high - last.close) / (last.high - last.low) > 0.6 && Math.abs(last.close - last.open) < (last.high - last.low) * 0.3, score: 80, description: 'Bearish rejection off highs.' },
      { id: 'CAN_DOJI', label: 'Doji', category: 'CANDLE', isActive: isDoji, score: 60, description: 'Indecision candle.' },
      { id: 'CAN_IN', label: 'Inside bar', category: 'CANDLE', isActive: last.high < prev.high && last.low > prev.low, score: 70, description: 'Volatility contraction.' },
      { id: 'CAN_OUT', label: 'Outside bar', category: 'CANDLE', isActive: last.high > prev.high && last.low < prev.low, score: 75, description: 'Volatility expansion sweeping both sides.' },
      { id: 'CAN_TTOP', label: 'Tweezer top', category: 'CANDLE', isActive: Math.abs(last.high - prev.high) < atr14 * 0.05 && last.close < last.open, score: 75, description: 'Matching highs with rejection.' },
      { id: 'CAN_TBOT', label: 'Tweezer bottom', category: 'CANDLE', isActive: Math.abs(last.low - prev.low) < atr14 * 0.05 && last.close > last.open, score: 75, description: 'Matching lows with rejection.' },
      { id: 'CAN_MSTAR', label: 'Morning star', category: 'CANDLE', isActive: false, score: 0, description: '3-bar bullish reversal.' },
      { id: 'CAN_ESTAR', label: 'Evening star', category: 'CANDLE', isActive: false, score: 0, description: '3-bar bearish reversal.' },
      { id: 'CAN_3WS', label: 'Three white soldiers', category: 'CANDLE', isActive: false, score: 0, description: '3 consecutive bullish engulfing.' },
      { id: 'CAN_3BC', label: 'Three black crows', category: 'CANDLE', isActive: false, score: 0, description: '3 consecutive bearish engulfing.' },
      { id: 'CAN_MARU', label: 'Marubozu', category: 'CANDLE', isActive: Math.abs(last.close - last.high) < atr14 * 0.05 && Math.abs(last.open - last.low) < atr14 * 0.05, score: 85, description: 'Full body candle, total dominance.' },
      { id: 'CAN_REJ', label: 'Long wick rejection', category: 'CANDLE', isActive: (last.high - Math.max(last.open, last.close)) > atr14 * 0.8, score: 80, description: 'Aggressive selling at the highs.' },
      { id: 'CAN_GAG', label: 'Gap and go', category: 'CANDLE', isActive: last.open > prev.high && last.close > last.open, score: 85, description: 'Gapped up and sustained momentum.' },
      { id: 'CAN_EXGAP', label: 'Exhaustion gap', category: 'CANDLE', isActive: false, score: 0, description: 'Requires structural context.' },
      { id: 'CAN_BGAP', label: 'Breakaway gap', category: 'CANDLE', isActive: last.open > recentHigh20 && last.close > last.open, score: 95, description: 'Gapped out of a trading range.' },
      { id: 'CAN_ISL', label: 'Island reversal', category: 'CANDLE', isActive: false, score: 0, description: 'Requires multi-day gap pattern.' },

      // ================= FIBONACCI =================
      { id: 'FIB_382', label: '38.2% retracement', category: 'FIB', isActive: Math.abs(last.close - (recentHigh20 - (recentHigh20-recentLow20)*0.382)) < atr14*0.2, score: 70, description: 'Shallow algorithmic pullback.' },
      { id: 'FIB_50', label: '50% retracement', category: 'FIB', isActive: Math.abs(last.close - rangeMid) < atr14*0.2, score: 80, description: 'Equilibrium algorithmic pullback.' },
      { id: 'FIB_618', label: '61.8% retracement', category: 'FIB', isActive: Math.abs(last.close - (recentHigh20 - (recentHigh20-recentLow20)*0.618)) < atr14*0.2, score: 90, description: 'Golden ratio algorithmic pullback.' },
      { id: 'FIB_786', label: '78.6% retracement', category: 'FIB', isActive: Math.abs(last.close - (recentHigh20 - (recentHigh20-recentLow20)*0.786)) < atr14*0.2, score: 85, description: 'Deep algorithmic pullback.' },
      { id: 'FIB_127', label: '127% extension', category: 'FIB', isActive: false, score: 0, description: 'Algorithmic profit target.' },
      { id: 'FIB_161', label: '161.8% extension', category: 'FIB', isActive: false, score: 0, description: 'Algorithmic profit target.' },
      { id: 'FIB_261', label: '261.8% extension', category: 'FIB', isActive: false, score: 0, description: 'Algorithmic profit target.' },
      { id: 'FIB_CLUS', label: 'Fib cluster', category: 'FIB', isActive: false, score: 0, description: 'Overlapping Fib levels from multiple swings.' },
      { id: 'FIB_STRUC', label: 'Fib + structure confluence', category: 'FIB', isActive: false, score: 0, description: 'Fib level aligning with previous SR.' },
      { id: 'FIB_VWAP', label: 'Fib + VWAP confluence', category: 'FIB', isActive: false, score: 0, description: 'Fib aligning with VWAP.' },

      // ================= TIME-BASED =================
      { id: 'TIME_LO', label: 'London open', category: 'TIME', isActive: false, score: 0, description: 'Intraday timezone.' },
      { id: 'TIME_NYO', label: 'New York open', category: 'TIME', isActive: false, score: 0, description: 'Intraday timezone.' },
      { id: 'TIME_PH', label: 'Power hour', category: 'TIME', isActive: false, score: 0, description: 'Intraday timezone.' },
      { id: 'TIME_ASIA', label: 'Asia range', category: 'TIME', isActive: false, score: 0, description: 'Intraday timezone.' },
      { id: 'TIME_KZ', label: 'Killzone', category: 'TIME', isActive: false, score: 0, description: 'ICT specific volatile window.' },
      { id: 'TIME_OR', label: 'Opening range', category: 'TIME', isActive: false, score: 0, description: 'First 30-60 mins of NY.' },
      { id: 'TIME_5M', label: 'First 5-min high/low', category: 'TIME', isActive: false, score: 0, description: 'Intraday metric.' },
      { id: 'TIME_1H', label: 'First hour high/low', category: 'TIME', isActive: false, score: 0, description: 'Intraday metric.' },
      { id: 'TIME_OPEX', label: 'OPEX week', category: 'TIME', isActive: new Date().getDate() >= 15 && new Date().getDate() <= 21 && new Date().getDay() >= 1, score: 80, description: 'Monthly options expiration week mechanics.' },
      { id: 'TIME_QUAD', label: 'Quad witching', category: 'TIME', isActive: false, score: 0, description: 'Quarterly expiration.' },
      { id: 'TIME_FOMC', label: 'FOMC day', category: 'TIME', isActive: false, score: 0, description: 'Requires calendar link.' },
      { id: 'TIME_CPI', label: 'CPI release', category: 'TIME', isActive: false, score: 0, description: 'Requires calendar link.' },
      { id: 'TIME_NFP', label: 'NFP release', category: 'TIME', isActive: false, score: 0, description: 'Requires calendar link.' },
      { id: 'TIME_EARN', label: 'Earnings day', category: 'TIME', isActive: false, score: 0, description: 'Requires calendar link.' },
      { id: 'TIME_POST', label: 'Post-earnings drift', category: 'TIME', isActive: false, score: 0, description: 'Requires fundamental feed.' },
      { id: 'TIME_MEND', label: 'Month-end rebalance', category: 'TIME', isActive: new Date().getDate() >= 28, score: 75, description: 'Institutional portfolio rebalancing flows.' },
      { id: 'TIME_QEND', label: 'Quarter-end rebalance', category: 'TIME', isActive: [2,5,8,11].includes(new Date().getMonth()) && new Date().getDate() >= 28, score: 85, description: 'Major quarterly rebalancing flows.' },
      { id: 'TIME_TT', label: 'Turnaround Tuesday', category: 'TIME', isActive: new Date().getDay() === 2, score: 60, description: 'Statistical tendency for reversals.' },
      { id: 'TIME_SSTR', label: 'Seasonal strength', category: 'TIME', isActive: false, score: 0, description: 'Historical 10-year avg bias.' },
      { id: 'TIME_SWEAK', label: 'Seasonal weakness', category: 'TIME', isActive: false, score: 0, description: 'Historical 10-year avg bias.' },
      { id: 'TIME_EOD', label: 'End-of-day squeeze', category: 'TIME', isActive: false, score: 0, description: 'Intraday short covering.' },

      // ================= DERIVATIVES & POSITIONING =================
      { id: 'DER_GAMM', label: 'Options gamma squeeze', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Options Chain data.' },
      { id: 'DER_GWALL', label: 'Gamma wall', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Dealer Gamma positioning.' },
      { id: 'DER_MAXP', label: 'Max pain', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Options Chain data.' },
      { id: 'DER_CWALL', label: 'Call wall', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Options Chain data.' },
      { id: 'DER_PWALL', label: 'Put wall', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Options Chain data.' },
      { id: 'DER_DEAL', label: 'Dealer hedging level', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Dealer Gamma positioning.' },
      { id: 'DER_OI', label: 'Open interest spike', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Futures/Options feed.' },
      { id: 'DER_IVC', label: 'IV crush', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Implied Volatility feed.' },
      { id: 'DER_IVE', label: 'IV expansion', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Implied Volatility feed.' },
      { id: 'DER_PCR', label: 'Put/call ratio extreme', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires Options volume feed.' },
      { id: 'DER_SI', label: 'Short interest > 20%', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires FINRA short interest.' },
      { id: 'DER_DTC', label: 'Days to cover high', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires short interest data.' },
      { id: 'DER_DP', label: 'Dark pool level', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires ATS / Dark Pool tape.' },
      { id: 'DER_INB', label: 'Insider buying', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires SEC Form 4 filings.' },
      { id: 'DER_INS', label: 'Insider selling', category: 'DERIVATIVES', isActive: false, score: 0, description: 'Requires SEC Form 4 filings.' },

      // ================= INTERMARKET =================
      { id: 'INT_DXY', label: 'Dollar index divergence', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires cross-asset matrix feed.' },
      { id: 'INT_BOND', label: 'Bond yield divergence', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires cross-asset matrix feed.' },
      { id: 'INT_VIX', label: 'VIX divergence', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires cross-asset matrix feed.' },
      { id: 'INT_SECT', label: 'Sector rotation', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires relative strength vs SPY.' },
      { id: 'INT_CONF', label: 'Index confirmation', category: 'INTERMARKET', isActive: false, score: 0, description: 'Dow Theory.' },
      { id: 'INT_NCONF', label: 'Index non-confirmation', category: 'INTERMARKET', isActive: false, score: 0, description: 'Dow Theory.' },
      { id: 'INT_CORR', label: 'Correlated asset breakout', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires cross-asset matrix feed.' },
      { id: 'INT_COMM', label: 'Commodity correlation', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires cross-asset matrix feed.' },
      { id: 'INT_RON', label: 'Risk-on sentiment', category: 'INTERMARKET', isActive: false, score: 0, description: 'High Beta outperforming Low Vol.' },
      { id: 'INT_ROFF', label: 'Risk-off sentiment', category: 'INTERMARKET', isActive: false, score: 0, description: 'Low Vol / Utilities outperforming.' },
      { id: 'INT_BREAD', label: 'Breadth thrust', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires NYAD feed.' },
      { id: 'INT_ADD', label: 'Advance/decline divergence', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires NYAD feed.' },
      { id: 'INT_TICK', label: 'TICK extreme', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires NYSE TICK.' },
      { id: 'INT_TRIN', label: 'TRIN extreme', category: 'INTERMARKET', isActive: false, score: 0, description: 'Requires Arms Index.' },

      // ================= FUNDAMENTAL / INVESTING =================
      { id: 'FUN_REV', label: 'Revenue growth acceleration', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires earnings database.' },
      { id: 'FUN_EPS', label: 'EPS beat', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires earnings database.' },
      { id: 'FUN_GUID', label: 'Guidance raise', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires earnings database.' },
      { id: 'FUN_MARG', label: 'Margin expansion', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires earnings database.' },
      { id: 'FUN_ACC', label: 'Insider accumulation', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires 13F filings.' },
      { id: 'FUN_IACC', label: 'Institutional accumulation', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires 13F filings.' },
      { id: 'FUN_BUY', label: 'Buyback announcement', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires corporate actions feed.' },
      { id: 'FUN_DIV', label: 'Dividend increase', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires corporate actions feed.' },
      { id: 'FUN_VAL', label: 'Valuation discount', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires historical P/E bands.' },
      { id: 'FUN_PEG', label: 'PEG < 1', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires fundamental DB.' },
      { id: 'FUN_FCF', label: 'FCF expansion', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires fundamental DB.' },
      { id: 'FUN_DEBT', label: 'Debt reduction', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Requires fundamental DB.' },
      { id: 'FUN_MOAT', label: 'Moat expansion', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Qualitative metric.' },
      { id: 'FUN_TAM', label: 'TAM expansion', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Qualitative metric.' },
      { id: 'FUN_REG', label: 'Regulatory catalyst', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Qualitative metric.' },
      { id: 'FUN_MA', label: 'M&A catalyst', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Event driven.' },
      { id: 'FUN_MAC', label: 'Macro tailwind', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Top down view.' },
      { id: 'FUN_POL', label: 'Policy shift', category: 'FUNDAMENTAL', isActive: false, score: 0, description: 'Top down view.' },

      // ================= STATISTICAL / QUANT =================
      { id: 'QNT_MR', label: 'Mean reversion band touch', category: 'QUANT', isActive: Math.abs(last.close - (sma200 - atr14*3)) < atr14*0.5, score: 85, description: 'Price 3 ATRs below mean.' },
      { id: 'QNT_BB', label: 'Bollinger Band squeeze', category: 'QUANT', isActive: (atr14 / sma200) < 0.01, score: 80, description: 'Volatility at extreme lows.' },
      { id: 'QNT_BBE', label: 'Bollinger Band expansion', category: 'QUANT', isActive: (atr14 / sma200) > 0.03, score: 80, description: 'Volatility breaking out.' },
      { id: 'QNT_KELT', label: 'Keltner squeeze', category: 'QUANT', isActive: false, score: 0, description: 'BB inside Keltner Channels.' },
      { id: 'QNT_ATRE', label: 'ATR expansion', category: 'QUANT', isActive: atr14 > this.SMA(highs.map((h,i)=>h-lows[i]), 50) * 1.5, score: 85, description: 'ATR 50% above moving average.' },
      { id: 'QNT_ATRC', label: 'ATR contraction', category: 'QUANT', isActive: atr14 < this.SMA(highs.map((h,i)=>h-lows[i]), 50) * 0.5, score: 85, description: 'ATR 50% below moving average.' },
      { id: 'QNT_ZSC', label: 'Z-score extreme', category: 'QUANT', isActive: Math.abs((last.close - sma200) / atr14) > 3, score: 95, description: '3 standard deviations from mean.' },
      { id: 'QNT_SDE', label: 'Standard deviation extreme', category: 'QUANT', isActive: false, score: 0, description: 'Statistical anomaly.' },
      { id: 'QNT_VC', label: 'Volatility compression', category: 'QUANT', isActive: atr14 < this.SMA(highs.map((h,i)=>h-lows[i]), 200) * 0.5, score: 80, description: 'Coiled spring.' },
      { id: 'QNT_VE', label: 'Volatility expansion', category: 'QUANT', isActive: atr14 > this.SMA(highs.map((h,i)=>h-lows[i]), 200) * 2, score: 80, description: 'Trend underway.' },
      { id: 'QNT_RSB', label: 'Relative strength breakout', category: 'QUANT', isActive: false, score: 0, description: 'Requires RS relative to SPY.' },
      { id: 'QNT_RSH', label: 'RS new high before price', category: 'QUANT', isActive: false, score: 0, description: 'Leading indicator.' },
      { id: 'QNT_BETA', label: 'Beta divergence', category: 'QUANT', isActive: false, score: 0, description: 'Requires historical beta.' },
      { id: 'QNT_SEAS', label: 'Seasonality edge', category: 'QUANT', isActive: false, score: 0, description: 'Requires historical daily returns array.' },
      { id: 'QNT_HWR', label: 'Historical win-rate level', category: 'QUANT', isActive: false, score: 0, description: 'Requires backtest engine.' },
      { id: 'QNT_BACK', label: 'Backtested level', category: 'QUANT', isActive: false, score: 0, description: 'Requires backtest engine.' },
      { id: 'QNT_CORR', label: 'Correlation breakdown', category: 'QUANT', isActive: false, score: 0, description: 'Requires cross-asset array.' },
    ];
  }
}