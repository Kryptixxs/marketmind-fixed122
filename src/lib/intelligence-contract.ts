export type EntityType =
  | 'company'
  | 'subsidiary'
  | 'counterparty'
  | 'contract'
  | 'event'
  | 'filing'
  | 'country'
  | 'sector'
  | 'executive'
  | 'product'
  | 'supplier';

export interface IntelligenceEntity {
  id: string;
  type: EntityType;
  display_name: string;
  ticker?: string;
  country?: string;
  sector?: string;
  aliases: string[];
}

export interface IntelligenceDocument {
  id: string;
  title: string;
  body?: string;
  entity_ids: string[];
  country_tags: string[];
  published_at: string;
  source?: string;
  url?: string;
}

export interface IntelligenceGraphEdge {
  from_id: string;
  to_id: string;
  relationship_type: string;
  weight: number;
  created_at?: string;
}

export interface IntelligenceEvent {
  id: string;
  label: string;
  entity_ids: string[];
  occurred_at?: string;
  source?: string;
}

export interface IntelligenceSymbol {
  symbol: string;
  name: string;
  type: string;
}

export interface IntelligenceEnvelope {
  entities: IntelligenceEntity[];
  documents: IntelligenceDocument[];
  relationships: IntelligenceGraphEdge[];
  events: IntelligenceEvent[];
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  total?: number;
}

export interface IntelligenceResponse {
  entities: PaginatedResult<IntelligenceEntity>;
  documents: PaginatedResult<IntelligenceDocument>;
  relationships: PaginatedResult<IntelligenceGraphEdge>;
  events: PaginatedResult<IntelligenceEvent>;
  symbols?: PaginatedResult<IntelligenceSymbol>;
  metadata: {
    query: string;
    canonicalEntityId?: string;
    filterState?: Record<string, string | undefined>;
    provisional?: boolean;
  };
}

export function emptyIntelligenceEnvelope(): IntelligenceEnvelope {
  return {
    entities: [],
    documents: [],
    relationships: [],
    events: [],
  };
}

export function emptyPaginatedResult<T>(): PaginatedResult<T> {
  return {
    items: [],
  };
}
