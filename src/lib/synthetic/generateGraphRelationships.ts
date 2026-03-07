import type { DataProvenance, RelationshipGraphDataset, SyntheticEntityNode, SyntheticGraphEdge } from './contracts';
import { createSeededRandom, pseudoUuid } from './seed';

const SECTORS = ['Technology', 'Healthcare', 'Financials', 'Industrials', 'Energy', 'Consumer', 'Utilities', 'Materials'] as const;
const COUNTRIES = ['US', 'DE', 'JP', 'CN', 'GB', 'IN', 'BR', 'CA', 'KR', 'FR'] as const;

function mkEntitySymbol(rootSymbol: string, idx: number): string {
  if (idx === 0) return rootSymbol;
  return `${rootSymbol}${String.fromCharCode(65 + (idx % 26))}${idx % 10}`;
}

export function generateGraphRelationships(symbol: string, seed: number): RelationshipGraphDataset {
  const rng = createSeededRandom(seed + 307);
  const entityCount = rng.int(20, 50);
  const entities: SyntheticEntityNode[] = [];
  for (let i = 0; i < entityCount; i += 1) {
    entities.push({
      id: pseudoUuid(seed + 53, i),
      symbol: mkEntitySymbol(symbol, i),
      name: i === 0 ? `${symbol} Holdings` : `${symbol} Linked Entity ${i}`,
      country: COUNTRIES[(seed + i * 3) % COUNTRIES.length],
      sector: SECTORS[(seed + i * 7) % SECTORS.length],
    });
  }

  const root = entities[0];
  const byRole = {
    suppliers: entities.slice(1, 6),
    customers: entities.slice(6, 9),
    partnerships: entities.slice(9, 11),
    country: entities.slice(11, 13),
    litigation: entities.slice(13, 14),
    docMentions: entities.slice(14, 17),
  };

  const edges: SyntheticGraphEdge[] = [];
  const pushEdges = (targets: SyntheticEntityNode[], relationshipType: SyntheticGraphEdge['relationshipType'], min = 0.4, max = 0.95) => {
    for (const t of targets) {
      edges.push({
        fromId: root.id,
        toId: t.id,
        relationshipType,
        weight: Number(rng.float(min, max).toFixed(3)),
      });
    }
  };

  pushEdges(byRole.suppliers, 'SUPPLIER');
  pushEdges(byRole.customers, 'CUSTOMER');
  pushEdges(byRole.partnerships, 'PARTNERSHIP');
  pushEdges(byRole.country, 'COUNTRY_EXPOSURE');
  pushEdges(byRole.litigation, 'LITIGATION');
  pushEdges(byRole.docMentions, 'DOCUMENT_MENTION');

  for (let i = 1; i < entities.length; i += 1) {
    const secondaryLinks = rng.int(1, 3);
    for (let j = 0; j < secondaryLinks; j += 1) {
      const targetIndex = rng.int(1, entities.length - 1);
      if (targetIndex === i) continue;
      const relTypes: SyntheticGraphEdge['relationshipType'][] = ['SUPPLIER', 'CUSTOMER', 'PARTNERSHIP', 'DOCUMENT_MENTION'];
      edges.push({
        fromId: entities[i].id,
        toId: entities[targetIndex].id,
        relationshipType: rng.pick(relTypes),
        weight: Number(rng.float(0.2, 0.85).toFixed(3)),
      });
    }
  }

  const provenance: DataProvenance = {
    label: 'SIMULATED',
    origin: 'synthetic',
    seeded: true,
    seed,
    generator: 'generateGraphRelationships',
    note: `Deterministic graph map for ${symbol}`,
  };

  return { entities, edges, provenance };
}
