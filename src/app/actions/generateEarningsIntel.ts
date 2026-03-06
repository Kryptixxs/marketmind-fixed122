'use server';

import { EarningsEvent } from '@/lib/types';

export async function generateEarningsIntel(event: EarningsEvent) {
  const estEps = event.epsEst ?? 1.0;
  const estRev = event.revEst ?? 15;
  const actEps = event.epsAct ?? Number((estEps * 1.04).toFixed(2));
  const actRev = event.revAct ?? Number((estRev * 1.03).toFixed(2));
  const beat = actEps >= estEps && actRev >= estRev;

  return {
    reportStatus: event.epsAct ? 'POST-EARNINGS' : 'PRE-EARNINGS',
    actualEPS: `$${actEps.toFixed(2)}`,
    estimatedEPS: `$${estEps.toFixed(2)}`,
    actualRevenue: `$${actRev.toFixed(2)}B`,
    revenueEstimate: `$${estRev.toFixed(2)}B`,
    yoyGrowth: beat ? '+9.4%' : '-2.1%',
    guidanceSummary: beat
      ? 'Guidance leans constructive with stable demand and controlled opex.'
      : 'Management guidance is cautious and implies a slower demand rebound.',
    sentiment: beat ? 'Bullish' : 'Neutral',
    expectedMove: beat ? '+/- 5.2%' : '+/- 4.1%',
    whisperNumber: `$${(estEps * 1.03).toFixed(2)}`,
    optionsData: { ivRank: '71%', putCallRatio: beat ? '0.84' : '1.09', skew: beat ? 'Call Heavy' : 'Balanced' },
    bullCase: 'Revenue acceleration plus margin expansion supports rerating.',
    bearCase: 'Guide-down risk and margin compression pressure valuation.',
    historicalReaction: 'Typical day-1 post-earnings move ranges from 3% to 7%.',
    institutionalBias: 'Funds favor buying pullbacks unless guidance weakens materially.',
    keyMetrics: ['Revenue Growth', 'Gross Margin', 'Operating Income', 'Forward Guidance'],
    analysis: `Prototype earnings model for ${event.ticker} indicates a ${beat ? 'modest beat' : 'mixed print'} and elevated short-term volatility.`,
  };
}
