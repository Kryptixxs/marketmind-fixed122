import type { DataProvenance, EventTimelineDataset, EventTimelineRow } from './contracts';
import { createSeededRandom, toDateISO } from './seed';

const TYPES: EventTimelineRow['type'][] = ['EARNINGS', 'M&A', 'EXEC_CHANGE', 'LAWSUIT', 'REGULATORY', 'CONTRACT'];

const TITLE_BY_TYPE: Record<EventTimelineRow['type'], string[]> = {
  EARNINGS: ['Quarterly results published', 'Guidance range updated', 'Unexpected margin inflection'],
  'M&A': ['Strategic acquisition announced', 'Asset divestiture outlined', 'Joint bid disclosed'],
  EXEC_CHANGE: ['CFO transition filed', 'Board committee reshuffle', 'Regional leadership change'],
  LAWSUIT: ['Class action filed', 'Commercial dispute hearing', 'Patent claim update'],
  REGULATORY: ['Regulatory review initiated', 'Consent order published', 'Antitrust checkpoint opened'],
  CONTRACT: ['Major supply contract signed', 'Government framework extension', 'Multi-year service award'],
};

export function generateEventTimeline(symbol: string, seed: number): EventTimelineDataset {
  const rng = createSeededRandom(seed + 809);
  const count = 72;
  const events: EventTimelineRow[] = [];
  for (let i = 0; i < count; i += 1) {
    const type = TYPES[(seed + i * 3) % TYPES.length];
    const titleSeed = TITLE_BY_TYPE[type];
    events.push({
      date: toDateISO(i * 18),
      type,
      title: `${symbol}: ${titleSeed[(seed + i) % titleSeed.length]}`,
      priceImpactPct: Number((Math.sin((seed + i) * 0.37) * 3.6 + rng.float(-0.7, 0.7)).toFixed(2)),
      volumeImpactPct: Number((Math.cos((seed + i) * 0.21) * 22 + rng.float(-3, 3)).toFixed(2)),
      volatilityImpactPct: Number((Math.sin((seed + i) * 0.13) * 18 + rng.float(-2.5, 2.5)).toFixed(2)),
    });
  }

  const provenance: DataProvenance = {
    label: 'SIMULATED',
    origin: 'synthetic',
    seeded: true,
    seed,
    generator: 'generateEventTimeline',
    note: `Deterministic 3-5 year event stream for ${symbol}`,
  };
  return { events, provenance };
}
