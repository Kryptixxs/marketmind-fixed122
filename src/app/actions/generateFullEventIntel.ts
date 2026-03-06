'use server';

import { EconomicEvent } from '@/lib/types';

export async function generateFullEventIntel(event: EconomicEvent) {
  const isHigh = event.impact === 'High';
  return {
    reportStatus: event.actual ? 'POST-RELEASE' : 'PRE-RELEASE',
    actualValue: event.actual || 'Pending',
    consensusValue: event.forecast || 'N/A',
    previousValue: event.previous || 'N/A',
    revision: 'Prototype dataset, no live revision feed attached.',
    liveBias: isHigh ? 'Bullish' : 'Neutral',
    predictionAccuracy: isHigh ? 80 : 72,
    smartMoneyPositioning: 'Systematic desks remain tactical and reduce size into event windows.',
    specificPrediction: 'A stronger-than-forecast print favors USD and yields; weaker data supports risk assets and duration.',
    narrative: 'Event-driven volatility with mean reversion between major releases.',
    volatility: isHigh ? 'High' : 'Moderate',
    macroImpact: isHigh ? 8 : 5,
    surpriseThresholdPct: isHigh ? 4 : 7,
    scenarios: [
      { label: 'Hot', probability: 30, reaction: 'Rates up, USD bid, risk trims.', bias: 'BEARISH' },
      { label: 'In-Line', probability: 45, reaction: 'Range trade and muted follow-through.', bias: 'NEUTRAL' },
      { label: 'Cool', probability: 25, reaction: 'Duration rally and risk relief bid.', bias: 'BULLISH' },
    ],
    sensitivities: [
      { symbol: 'DXY', sensitivity: 'HIGH', expectedMove: '+/-0.4%', weight: 9 },
      { symbol: 'SPX500', sensitivity: 'MODERATE', expectedMove: '+/-0.8%', weight: 7 },
      { symbol: 'US10Y', sensitivity: 'HIGH', expectedMove: '+/-0.10', weight: 8 },
    ],
  };
}
