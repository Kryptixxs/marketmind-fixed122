export type DataLabel = 'SIMULATED' | 'PROVISIONAL' | 'DEMO DATA';
export type DataOrigin = 'synthetic' | 'fallback' | 'mixed';

export interface DataProvenance {
  label: DataLabel;
  origin: DataOrigin;
  seeded: boolean;
  seed: number;
  generator: string;
  note?: string;
}

export type YearMetricPoint = {
  year: number;
  revenue: number;
  ebitda: number;
  netIncome: number;
  fcf: number;
  marginPct: number;
  debt: number;
  yoyRevenuePct: number;
  yoyEbitdaPct: number;
  yoyNetIncomePct: number;
  yoyFcfPct: number;
};

export type TrendDirection = 'UP' | 'DOWN' | 'FLAT';

export interface FinancialHistoryDataset {
  points: YearMetricPoint[];
  cagrRevenuePct: number;
  cagrEbitdaPct: number;
  cagrNetIncomePct: number;
  cagrFcfPct: number;
  trend: TrendDirection;
  provenance: DataProvenance;
}

export interface AnalystRevisionRow {
  date: string;
  quarter: string;
  epsEstimate: number;
  epsRevisionDeltaPct: number;
  surprisePct: number;
  targetPrice: number;
  targetDeltaPct: number;
}

export interface AnalystRevisionsDataset {
  rows: AnalystRevisionRow[];
  revisionTrendScore: number;
  consensusDispersion: number;
  provenance: DataProvenance;
}

export type RelationshipType =
  | 'SUPPLIER'
  | 'CUSTOMER'
  | 'PARTNERSHIP'
  | 'COUNTRY_EXPOSURE'
  | 'LITIGATION'
  | 'DOCUMENT_MENTION';

export interface SyntheticEntityNode {
  id: string;
  symbol: string;
  name: string;
  country: string;
  sector: string;
}

export interface SyntheticGraphEdge {
  fromId: string;
  toId: string;
  relationshipType: RelationshipType;
  weight: number;
}

export interface RelationshipGraphDataset {
  entities: SyntheticEntityNode[];
  edges: SyntheticGraphEdge[];
  provenance: DataProvenance;
}

export interface SyntheticNewsArticle {
  id: string;
  title: string;
  snippet: string;
  date: string;
  linkedEntityIds: string[];
  countryTag: string;
  eventType: 'earnings' | 'm&a' | 'litigation' | 'regulatory';
}

export interface NewsArchiveDataset {
  articles: SyntheticNewsArticle[];
  provenance: DataProvenance;
}

export interface RiskProfileDataset {
  debtMaturityLadder: Array<{ bucket: string; amount: number; pctOfDebt: number }>;
  interestCoverageTrend: Array<{ year: number; ratio: number }>;
  countryRevenuePct: Array<{ country: string; pct: number }>;
  fxExposurePct: Array<{ currency: string; pct: number }>;
  sanctionsRiskFlag: boolean;
  regulatoryRiskScore: number;
  provenance: DataProvenance;
}

export interface FlowMetricsDataset {
  etfOwnershipPct: number;
  passiveIndexWeightPct: number;
  institutionalOwnershipPct: number;
  shortInterestTrend: Array<{ date: string; shortPctFloat: number }>;
  borrowCostPct: number;
  volatilityPercentile: number;
  provenance: DataProvenance;
}

export interface PeerComparisonRow {
  symbol: string;
  relativeValuation: number;
  relativeGrowth: number;
  relativeMargins: number;
  relativeRisk: number;
  sectorPercentile: number;
}

export interface PeerComparisonDataset {
  peers: PeerComparisonRow[];
  provenance: DataProvenance;
}

export interface EventTimelineRow {
  date: string;
  type: 'EARNINGS' | 'M&A' | 'EXEC_CHANGE' | 'LAWSUIT' | 'REGULATORY' | 'CONTRACT';
  title: string;
  priceImpactPct: number;
  volumeImpactPct: number;
  volatilityImpactPct: number;
}

export interface EventTimelineDataset {
  events: EventTimelineRow[];
  provenance: DataProvenance;
}
