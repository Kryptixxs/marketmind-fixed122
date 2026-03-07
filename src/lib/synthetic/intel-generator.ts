import type {
  AnalystRevisionsDataset,
  DataProvenance,
  EventTimelineDataset,
  FinancialHistoryDataset,
  FlowMetricsDataset,
  NewsArchiveDataset,
  PeerComparisonDataset,
  RelationshipGraphDataset,
  RiskProfileDataset,
} from './contracts';
import { generateAnalystRevisions } from './generateAnalystRevisions';
import { generateEventTimeline } from './generateEventTimeline';
import { generateFinancialHistory } from './generateFinancialHistory';
import { generateFlowMetrics } from './generateFlowMetrics';
import { generateGraphRelationships } from './generateGraphRelationships';
import { generateNewsArchive } from './generateNewsArchive';
import { generatePeerComparison } from './generatePeerComparison';
import { generateRiskProfile } from './generateRiskProfile';
import { hashSymbol } from './seed';

export interface SyntheticIntelBundle {
  symbol: string;
  seed: number;
  financialHistory: FinancialHistoryDataset;
  analystRevisions: AnalystRevisionsDataset;
  relationshipGraph: RelationshipGraphDataset;
  newsArchive: NewsArchiveDataset;
  riskProfile: RiskProfileDataset;
  flowMetrics: FlowMetricsDataset;
  peerComparison: PeerComparisonDataset;
  eventTimeline: EventTimelineDataset;
  provenance: DataProvenance;
}

export function generateSyntheticIntel(symbolInput: string): SyntheticIntelBundle {
  const symbol = symbolInput.trim().toUpperCase() || 'AAPL';
  const seed = hashSymbol(symbol);

  const financialHistory = generateFinancialHistory(symbol, seed);
  const analystRevisions = generateAnalystRevisions(symbol, seed);
  const relationshipGraph = generateGraphRelationships(symbol, seed);
  const newsArchive = generateNewsArchive(
    symbol,
    seed,
    relationshipGraph.entities.map((e) => e.id)
  );
  const riskProfile = generateRiskProfile(symbol, seed);
  const flowMetrics = generateFlowMetrics(symbol, seed);
  const peerComparison = generatePeerComparison(symbol, seed);
  const eventTimeline = generateEventTimeline(symbol, seed);

  const provenance: DataProvenance = {
    label: 'SIMULATED',
    origin: 'synthetic',
    seeded: true,
    seed,
    generator: 'generateSyntheticIntel',
    note: `Deterministic symbol-seeded synthetic intel for ${symbol}`,
  };

  return {
    symbol,
    seed,
    financialHistory,
    analystRevisions,
    relationshipGraph,
    newsArchive,
    riskProfile,
    flowMetrics,
    peerComparison,
    eventTimeline,
    provenance,
  };
}
