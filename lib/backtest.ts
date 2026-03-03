export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  side: 'long' | 'short';
  pnl: number;
  pnlPercent: number;
}

export interface StrategyResult {
  trades: Trade[];
  totalTrades: number;
  winRate: number;
  netProfit: number;
  maxDrawdown: number;
  sharpeRatio: number;
  equityCurve: { time: number; value: number }[];
}

export interface StrategyParams {
  fastMa: number;
  slowMa: number;
  stopLossPct: number;
  takeProfitPct: number;
}

// Simple Moving Average Crossover Strategy Simulation
export function runBacktest(data: Bar[], params: StrategyParams): StrategyResult {
  const trades: Trade[] = [];
  let equity = 10000;
  const equityCurve = [{ time: data[0].time, value: equity }];
  
  let position: { side: 'long' | 'short'; price: number; time: number } | null = null;
  
  for (let i = Math.max(params.fastMa, params.slowMa); i < data.length; i++) {
    const price = data[i].close;
    const prevPrice = data[i-1].close;
    
    // Calculate indicators (inefficient but readable for demo)
    const fastMa = data.slice(i - params.fastMa, i).reduce((sum, b) => sum + b.close, 0) / params.fastMa;
    const slowMa = data.slice(i - params.slowMa, i).reduce((sum, b) => sum + b.close, 0) / params.slowMa;
    
    const prevFastMa = data.slice(i - 1 - params.fastMa, i - 1).reduce((sum, b) => sum + b.close, 0) / params.fastMa;
    const prevSlowMa = data.slice(i - 1 - params.slowMa, i - 1).reduce((sum, b) => sum + b.close, 0) / params.slowMa;

    // Check Exits
    if (position) {
      let exitPrice = null;
      
      // Stop Loss / Take Profit
      if (position.side === 'long') {
        if (data[i].low <= position.price * (1 - params.stopLossPct/100)) exitPrice = position.price * (1 - params.stopLossPct/100);
        else if (data[i].high >= position.price * (1 + params.takeProfitPct/100)) exitPrice = position.price * (1 + params.takeProfitPct/100);
      }
      
      if (exitPrice) {
        const pnl = (exitPrice - position.price) * (position.side === 'long' ? 1 : -1) * (equity / position.price); // compound
        equity += pnl;
        trades.push({
          entryTime: position.time,
          exitTime: data[i].time,
          entryPrice: position.price,
          exitPrice,
          side: position.side,
          pnl,
          pnlPercent: (exitPrice - position.price) / position.price * 100
        });
        position = null;
      }
    }

    // Check Entries
    if (!position) {
      if (prevFastMa <= prevSlowMa && fastMa > slowMa) {
        position = { side: 'long', price: data[i].close, time: data[i].time };
      }
    }
    
    equityCurve.push({ time: data[i].time, value: equity });
  }

  // Statistics
  const wins = trades.filter(t => t.pnl > 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  const netProfit = ((equity - 10000) / 10000) * 100;

  // Max Drawdown
  let peak = -Infinity;
  let maxDd = 0;
  for (const point of equityCurve) {
    if (point.value > peak) peak = point.value;
    const dd = (peak - point.value) / peak;
    if (dd > maxDd) maxDd = dd;
  }

  return {
    trades,
    totalTrades: trades.length,
    winRate,
    netProfit,
    maxDrawdown: maxDd * 100,
    sharpeRatio: 1.5, // Mock calc for brevity
    equityCurve
  };
}