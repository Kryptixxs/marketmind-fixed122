import { EconomicEvent } from './types';

export interface ScenarioRow {
  label: string;
  probability: number; // 0-100
  reaction: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface AssetSensitivity {
  symbol: string;
  sensitivity: 'HIGH' | 'MODERATE' | 'LOW';
  expectedMove: string;
  weight: number; // 1-10
}

export interface EventIntel {
  volatility: 'Low' | 'Moderate' | 'High' | 'Extreme';
  macroImpact: number; // 1-10
  narrative: string;
  positioning: string;
  scenarios: ScenarioRow[];
  sensitivities: AssetSensitivity[];
  surpriseThresholdPct: number;
}

export function computeSurprise(event: { actual: string | null, forecast: string | null }) {
  if (!event.actual || !event.forecast) return { classification: 'N/A' as const };
  
  const act = parseFloat(event.actual.replace(/[^0-9.-]/g, ''));
  const est = parseFloat(event.forecast.replace(/[^0-9.-]/g, ''));
  
  if (isNaN(act) || isNaN(est) || est === 0) return { classification: 'N/A' as const };
  
  const diff = act - est;
  const surprisePct = (diff / Math.abs(est)) * 100;
  
  let classification: 'HOT' | 'COOL' | 'INLINE' = 'INLINE';
  if (Math.abs(surprisePct) < 0.5) classification = 'INLINE';
  else if (surprisePct > 0) classification = 'HOT';
  else classification = 'COOL';
  
  return { surprisePct, classification };
}

const RULES: Record<string, Partial<EventIntel>> = {
  "CPI": {
    volatility: 'High',
    macroImpact: 10,
    narrative: "Core inflation remains the primary driver of Fed terminal rate expectations. Markets are hyper-sensitive to any deviation that challenges the 'disinflation' trend.",
    positioning: "Crowded long in front-end yields; Neutral equities.",
    surpriseThresholdPct: 5,
    sensitivities: [
      { symbol: 'DXY', sensitivity: 'HIGH', expectedMove: '+0.8% on Hot', weight: 10 },
      { symbol: 'NQ', sensitivity: 'HIGH', expectedMove: '-1.5% on Hot', weight: 9 },
      { symbol: '2Y Yield', sensitivity: 'HIGH', expectedMove: '+12bps on Hot', weight: 10 },
      { symbol: 'Gold', sensitivity: 'MODERATE', expectedMove: '-1.0% on Hot', weight: 7 }
    ],
    scenarios: [
      { label: 'Hot (>Forecast)', probability: 35, reaction: 'Hawkish pivot, aggressive USD buying, Tech sell-off.', bias: 'BEARISH' },
      { label: 'In-Line', probability: 40, reaction: 'Relief rally in bonds, equities chop.', bias: 'NEUTRAL' },
      { label: 'Cool (<Forecast)', probability: 25, reaction: 'Soft landing narrative fuels risk-on rally.', bias: 'BULLISH' }
    ]
  },
  "Nonfarm Payrolls": {
    volatility: 'Extreme',
    macroImpact: 10,
    narrative: "Labor market resilience is the last pillar of the 'higher for longer' argument. A significant miss would trigger immediate recession re-pricing.",
    positioning: "Short Gamma in ES; Long USD.",
    surpriseThresholdPct: 15,
    sensitivities: [
      { symbol: 'ES', sensitivity: 'HIGH', expectedMove: '+1.2% on Miss', weight: 9 },
      { symbol: 'DXY', sensitivity: 'HIGH', expectedMove: '-0.9% on Miss', weight: 10 },
      { symbol: 'Gold', sensitivity: 'HIGH', expectedMove: '+$25 on Miss', weight: 8 },
      { symbol: 'USD/JPY', sensitivity: 'HIGH', expectedMove: '-120 pips on Miss', weight: 9 }
    ],
    scenarios: [
      { label: 'Beat (>250k)', probability: 30, reaction: 'Yields spike, USD strength, Stocks pressured.', bias: 'BEARISH' },
      { label: 'In-Line (150k-200k)', probability: 45, reaction: 'Status quo maintained.', bias: 'NEUTRAL' },
      { label: 'Miss (<100k)', probability: 25, reaction: 'Aggressive rate cut bets, USD dump, Gold rally.', bias: 'BULLISH' }
    ]
  },
  "FOMC": {
    volatility: 'Extreme',
    macroImpact: 10,
    narrative: "The Fed's forward guidance is the single most important variable for global liquidity. Focus is on the 'Dot Plot' and Powell's tone regarding the neutral rate.",
    positioning: "Short Volatility; Long Duration.",
    surpriseThresholdPct: 2,
    sensitivities: [
      { symbol: 'DXY', sensitivity: 'HIGH', expectedMove: '+1.5% on Hawkish', weight: 10 },
      { symbol: 'NQ', sensitivity: 'HIGH', expectedMove: '-2.5% on Hawkish', weight: 10 },
      { symbol: '2Y Yield', sensitivity: 'HIGH', expectedMove: '+20bps on Hawkish', weight: 10 },
      { symbol: 'BTC', sensitivity: 'HIGH', expectedMove: '-5.0% on Hawkish', weight: 8 }
    ],
    scenarios: [
      { label: 'Hawkish Hold', probability: 20, reaction: 'Yields moon, Equities dump, USD king.', bias: 'BEARISH' },
      { label: 'Dovish Hold', probability: 60, reaction: 'Relief rally, USD weakness, Gold spike.', bias: 'BULLISH' },
      { label: 'Surprise Cut', probability: 20, reaction: 'Chaos, Volatility spike, Risk-on explosion.', bias: 'BULLISH' }
    ]
  },
  "Retail Sales": {
    volatility: 'Moderate',
    macroImpact: 7,
    narrative: "Consumer spending is 70% of US GDP. This is the ultimate 'real-time' health check for the economy.",
    positioning: "Neutral; Retail-heavy.",
    surpriseThresholdPct: 10,
    sensitivities: [
      { symbol: 'ES', sensitivity: 'MODERATE', expectedMove: '+0.5% on Beat', weight: 7 },
      { symbol: 'DXY', sensitivity: 'MODERATE', expectedMove: '+0.3% on Beat', weight: 6 },
      { symbol: 'XLY', sensitivity: 'HIGH', expectedMove: '+1.2% on Beat', weight: 9 }
    ],
    scenarios: [
      { label: 'Strong Beat', probability: 30, reaction: 'Soft landing narrative reinforced.', bias: 'BULLISH' },
      { label: 'In-Line', probability: 50, reaction: 'No change in macro bias.', bias: 'NEUTRAL' },
      { label: 'Weak Miss', probability: 20, reaction: 'Recession fears resurface.', bias: 'BEARISH' }
    ]
  }
};

export function getEventIntel(event: EconomicEvent): EventIntel {
  const title = event.title.toLowerCase();
  const ruleKey = Object.keys(RULES).find(k => title.includes(k.toLowerCase()));
  const rule = ruleKey ? RULES[ruleKey] : null;

  if (rule) {
    return {
      volatility: rule.volatility || 'Moderate',
      macroImpact: rule.macroImpact || 5,
      narrative: rule.narrative || '',
      positioning: rule.positioning || 'Neutral / Balanced',
      scenarios: rule.scenarios || [],
      sensitivities: rule.sensitivities || [],
      surpriseThresholdPct: rule.surpriseThresholdPct || 10
    };
  }

  // Fallback
  return {
    volatility: event.impact === 'High' ? 'High' : 'Moderate',
    macroImpact: event.impact === 'High' ? 8 : 4,
    narrative: `Standard ${event.currency} release. Focus is on deviation from consensus to gauge local economic momentum.`,
    positioning: "Retail-heavy; Institutional neutral.",
    scenarios: [
      { label: 'Beat', probability: 33, reaction: `Positive for ${event.currency}.`, bias: 'BULLISH' },
      { label: 'In-Line', probability: 34, reaction: 'Neutral reaction.', bias: 'NEUTRAL' },
      { label: 'Miss', probability: 33, reaction: `Negative for ${event.currency}.`, bias: 'BEARISH' }
    ],
    sensitivities: [
      { symbol: event.currency, sensitivity: 'MODERATE', expectedMove: 'Directional', weight: 8 }
    ],
    surpriseThresholdPct: 10
  };
}