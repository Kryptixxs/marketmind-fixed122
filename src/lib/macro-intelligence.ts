export interface YieldData {
  tenYear: number;
  twoYear: number;
  spread: number;
  regime: 'Inverted' | 'Flat' | 'Steepening';
  bias: 'Hawkish' | 'Dovish' | 'Neutral';
}

export function analyzeYieldCurve(tenYear: number, twoYear: number): YieldData {
  const spread = tenYear - twoYear;
  
  let regime: YieldData['regime'] = 'Flat';
  if (spread < -0.1) regime = 'Inverted';
  else if (spread > 0.5) regime = 'Steepening';

  let bias: YieldData['bias'] = 'Neutral';
  if (regime === 'Inverted') bias = 'Hawkish'; // Tightening cycle peak
  else if (regime === 'Steepening') bias = 'Dovish'; // Easing cycle start

  return { tenYear, twoYear, spread, regime, bias };
}

export function getCreditStress(vix: number, highYieldSpread: number = 4.5) {
  // High Yield Spread is a mock for now, but VIX is real
  const stressScore = (vix / 40) * 50 + (highYieldSpread / 10) * 50;
  return {
    score: Math.min(100, Math.round(stressScore)),
    status: stressScore > 60 ? 'CRITICAL' : stressScore > 40 ? 'ELEVATED' : 'STABLE'
  };
}