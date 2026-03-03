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

export function runBacktest(data: Bar[], params: StrategyParams): StrategyResult {
  if (data.length < params.slowMa) {
    return { trades: [], totalTrades: 0, winRate: 0, netProfit: 0, maxDrawdown: 0, sharpeRatio: 0, equityCurve: [] };
  }

  const trades: Trade[] = [];
  let equity = 10000;
  const initialEquity = 10000;
  const equityCurve = [{ time: data[0].time, value: equity }];
  const dailyReturns: number[] = [];
  
  let position: { side: 'long' | 'short'; price: number; time: number } | null = null;
  
  for (let i = params.slowMa; i < data.length; i++) {
    const currentBar = data[i];
    const prevBar = data[i-1];
    
    // Simple MA Calculation
    const getMa = (period: number, index: number) => {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[index - j].close;
      return sum / period;
    };

    const fastMa = getMa(params.fastMa, i);
    const slowMa = getMa(params.slowMa, i);
    const prevFastMa = getMa(params.fastMa, i - 1);
    const prevSlowMa = getMa(params.slowMa, i - 1);

    // Check Exits
    if (position) {
      let exitPrice = null;
      
      // Stop Loss / Take Profit
      if (position.side === 'long') {
        if (currentBar.low <= position.price * (1 - params.stopLossPct/100)) exitPrice = position.price * (1 - params.stopLossPct/100);
        else if (currentBar.high >= position.price * (1 + params.takeProfitPct/100)) exitPrice = position.price * (1 + params.takeProfitPct/100);
        // Trend Exit (Cross back)
        else if (fastMa < slowMa) exitPrice = currentBar.close;
      }
      
      if (exitPrice) {
        const pnlPercent = (exitPrice - position.price) / position.price;
        const pnl = equity * pnlPercent;
        equity += pnl;
        trades.push({
          entryTime: position.time,
          exitTime: currentBar.time,
          entryPrice: position.price,
          exitPrice,
          side: position.side,
          pnl,
          pnlPercent: pnlPercent * 100
        });
        position = null;
      }
    }

    // Check Entries
    if (!position) {
      if (prevFastMa <= prevSlowMa && fastMa > slowMa) {
        position = { side: 'long', price: currentBar.close, time: currentBar.time };
      }
    }
    
    const prevEquity = equityCurve[equityCurve.length - 1].value;
    dailyReturns.push((equity - prevEquity) / prevEquity);
    equityCurve.push({ time: currentBar.time, value: equity });
  }

  // Statistics
  const wins = trades.filter(t => t.pnl > 0).length;
  const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
  const netProfit = ((equity - initialEquity) / initialEquity) * 100;

  // Sharpe Ratio Calculation (Annualized)
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const stdDev = Math.sqrt(dailyReturns.map(x => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b, 0) / dailyReturns.length);
  const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

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
    sharpeRatio,
    equityCurve
  };
}