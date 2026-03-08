'use client';

export type RelEdgeType =
  | 'supplier-of'
  | 'customer-of'
  | 'competes-with'
  | 'rate-sensitive'
  | 'oil-linked'
  | 'news-linked'
  | 'factor-linked';

export interface RelNode {
  id: string;
  label: string;
  kind: 'SECURITY' | 'SECTOR' | 'MACRO' | 'COMMODITY' | 'REGION' | 'NARRATIVE' | 'BASKET';
  score: number;
}

export interface RelEdge {
  id: string;
  fromId: string;
  toId: string;
  type: RelEdgeType;
  weight: number;
  direction: 'OUT' | 'IN' | 'BIDIR';
  evidence: string[];
}

const NODES: RelNode[] = [
  { id: 'AAPL US EQUITY', label: 'AAPL US EQUITY', kind: 'SECURITY', score: 1 },
  { id: 'MSFT US EQUITY', label: 'MSFT US EQUITY', kind: 'SECURITY', score: 0.91 },
  { id: 'NVDA US EQUITY', label: 'NVDA US EQUITY', kind: 'SECURITY', score: 0.87 },
  { id: 'QQQ US EQUITY', label: 'QQQ US EQUITY', kind: 'SECURITY', score: 0.84 },
  { id: 'US2Y', label: 'US 2Y Yield', kind: 'MACRO', score: 0.79 },
  { id: 'DXY', label: 'US Dollar Index', kind: 'MACRO', score: 0.73 },
  { id: 'OIL', label: 'Brent Crude', kind: 'COMMODITY', score: 0.65 },
  { id: 'US', label: 'United States', kind: 'REGION', score: 0.8 },
  { id: 'CN', label: 'China', kind: 'REGION', score: 0.76 },
  { id: 'AI_DC', label: 'AI Datacenter Theme', kind: 'NARRATIVE', score: 0.82 },
];

const EDGES: RelEdge[] = [
  { id: 'e1', fromId: 'AAPL US EQUITY', toId: 'MSFT US EQUITY', type: 'competes-with', weight: 0.68, direction: 'BIDIR', evidence: ['peer-multiples', 'co-news'] },
  { id: 'e2', fromId: 'AAPL US EQUITY', toId: 'CN', type: 'supplier-of', weight: 0.72, direction: 'OUT', evidence: ['facility-footprint', 'trade-corridor'] },
  { id: 'e3', fromId: 'AAPL US EQUITY', toId: 'US2Y', type: 'rate-sensitive', weight: 0.63, direction: 'IN', evidence: ['rolling-beta-1Y', 'valuation-duration'] },
  { id: 'e4', fromId: 'NVDA US EQUITY', toId: 'AI_DC', type: 'news-linked', weight: 0.84, direction: 'BIDIR', evidence: ['narrative-intensity', 'headline-cluster'] },
  { id: 'e5', fromId: 'MSFT US EQUITY', toId: 'QQQ US EQUITY', type: 'factor-linked', weight: 0.77, direction: 'BIDIR', evidence: ['co-move', 'index-weight'] },
  { id: 'e6', fromId: 'AAPL US EQUITY', toId: 'DXY', type: 'factor-linked', weight: 0.51, direction: 'IN', evidence: ['fx-exposure', 'intl-revenue-split'] },
  { id: 'e7', fromId: 'OIL', toId: 'CN', type: 'oil-linked', weight: 0.57, direction: 'OUT', evidence: ['import-dependency', 'shipping-cost'] },
];

export function listRelNodes() {
  return NODES;
}

export function listRelEdges() {
  return EDGES;
}

export function getNode(id: string) {
  return NODES.find((n) => n.id === id);
}

export function listEdgesForCenter(centerId: string, typeFilter: 'ALL' | RelEdgeType = 'ALL') {
  return EDGES.filter((e) => (e.fromId === centerId || e.toId === centerId) && (typeFilter === 'ALL' || e.type === typeFilter));
}

export function listEdgeEvidence(edgeId: string) {
  return EDGES.find((e) => e.id === edgeId)?.evidence ?? [];
}

export function pathBetween(fromId: string, toId: string) {
  // Deterministic simulated path explorer.
  if (fromId === toId) return [{ step: 1, node: fromId, edgeType: 'factor-linked', evidence: 'identity-path' }];
  return [
    { step: 1, node: fromId, edgeType: 'factor-linked', evidence: 'driver-exposure' },
    { step: 2, node: 'US2Y', edgeType: 'rate-sensitive', evidence: 'valuation-channel' },
    { step: 3, node: 'QQQ US EQUITY', edgeType: 'factor-linked', evidence: 'index-transmission' },
    { step: 4, node: toId, edgeType: 'competes-with', evidence: 'peer-rotation' },
  ];
}
