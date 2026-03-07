import type { DataProvenance, NewsArchiveDataset, SyntheticNewsArticle } from './contracts';
import { createSeededRandom, pseudoUuid, toDateISO } from './seed';

const EVENT_TYPES: SyntheticNewsArticle['eventType'][] = ['earnings', 'm&a', 'litigation', 'regulatory'];
const VERBS = ['updates', 'revises', 'targets', 'signals', 'outlines', 'expands', 'accelerates', 'adjusts'] as const;
const SUBJECTS = ['guidance', 'capital plan', 'regional strategy', 'margin outlook', 'compliance framework', 'supplier terms'] as const;

export function generateNewsArchive(symbol: string, seed: number, entityIds: string[]): NewsArchiveDataset {
  const rng = createSeededRandom(seed + 401);
  const count = 220;
  const articles: SyntheticNewsArticle[] = [];

  for (let i = 0; i < count; i += 1) {
    const eventType = EVENT_TYPES[(seed + i) % EVENT_TYPES.length];
    const linkCount = rng.int(1, Math.min(4, Math.max(1, entityIds.length)));
    const linkedEntityIds: string[] = [];
    for (let j = 0; j < linkCount; j += 1) {
      linkedEntityIds.push(entityIds[(i * 7 + j * 3 + seed) % entityIds.length]);
    }
    const countryTag = ['US', 'EU', 'APAC', 'LATAM', 'MEA'][(seed + i * 5) % 5];
    const verb = VERBS[(seed + i * 2) % VERBS.length];
    const subject = SUBJECTS[(seed + i * 3) % SUBJECTS.length];
    const title = `${symbol} ${verb} ${subject} after ${eventType} watch`;
    const snippet = `${symbol} ${eventType} monitor: desk notes indicate cross-asset repricing, linked counterparties, and incremental revisions in forward assumptions.`;

    articles.push({
      id: pseudoUuid(seed + 89, i),
      title,
      snippet,
      date: toDateISO(i * 5),
      linkedEntityIds,
      countryTag,
      eventType,
    });
  }

  const provenance: DataProvenance = {
    label: 'SIMULATED',
    origin: 'synthetic',
    seeded: true,
    seed,
    generator: 'generateNewsArchive',
    note: `Deterministic 200+ article archive for ${symbol}`,
  };

  return { articles, provenance };
}
