'use server';

export async function analyzeMacroRegime(activeSymbol: string, price: number) {
  const score = Math.max(25, Math.min(82, Math.round((Math.sin(price / 17) + 1) * 28 + 24)));
  const bias = score > 58 ? 'Bullish' : score < 42 ? 'Bearish' : 'Neutral';

  return {
    narrative: score > 60 ? 'Risk-On Rotation' : score < 40 ? 'Defensive Rotation' : 'Range Consolidation',
    stance: score > 60 ? 'Mildly Dovish' : score < 40 ? 'Mildly Hawkish' : 'Neutral',
    regime: score > 60 ? 'Trending' : score < 40 ? 'Distribution' : 'Mean Reverting',
    bias,
    score,
    insight: `${activeSymbol} is running in prototype mode; maintain tactical sizing and react to level breaks.`,
  };
}
