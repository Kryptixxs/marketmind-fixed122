-- Backend Intelligence Layer: entities, relationships, documents
-- Phase 1: Minimal search + graph for INTEL module

-- entities: canonical companies/issuers and counterparties
CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text UNIQUE,
  name text NOT NULL,
  sector text,
  country text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS entities_name_null_symbol_idx ON entities(name) WHERE symbol IS NULL;

-- relationships: graph edges (customers, suppliers, partners)
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target_entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('customer', 'supplier', 'partner')),
  segment text,
  note text,
  country text
);

CREATE INDEX IF NOT EXISTS relationships_source_idx ON relationships(source_entity_id);
CREATE INDEX IF NOT EXISTS relationships_target_idx ON relationships(target_entity_id);
CREATE INDEX IF NOT EXISTS relationships_country_idx ON relationships(country) WHERE country IS NOT NULL;

-- documents: news/filings with entity tags and full-text search
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text DEFAULT '',
  published_at date NOT NULL,
  source text DEFAULT '',
  entity_ids uuid[] DEFAULT '{}',
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))
  ) STORED
);

CREATE INDEX IF NOT EXISTS documents_search_idx ON documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS documents_published_idx ON documents(published_at);
CREATE INDEX IF NOT EXISTS documents_entity_ids_idx ON documents USING GIN(entity_ids);

-- RLS: allow read for anon (app), insert for seed script
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entities_select" ON entities FOR SELECT USING (true);
CREATE POLICY "entities_insert" ON entities FOR INSERT WITH CHECK (true);
CREATE POLICY "relationships_select" ON relationships FOR SELECT USING (true);
CREATE POLICY "relationships_insert" ON relationships FOR INSERT WITH CHECK (true);
CREATE POLICY "documents_select" ON documents FOR SELECT USING (true);
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (true);
