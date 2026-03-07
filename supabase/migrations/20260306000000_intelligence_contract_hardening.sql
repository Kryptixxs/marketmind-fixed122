-- Phase 1 hardening: canonical IDs, aliases, deterministic ingest metadata

ALTER TABLE entities
  ADD COLUMN IF NOT EXISTS entity_type text NOT NULL DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE entities
SET display_name = COALESCE(display_name, name)
WHERE display_name IS NULL;

ALTER TABLE entities
  ALTER COLUMN display_name SET NOT NULL;

CREATE TABLE IF NOT EXISTS entity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  alias text NOT NULL,
  alias_norm text GENERATED ALWAYS AS (lower(regexp_replace(alias, '[^a-zA-Z0-9]+', '', 'g'))) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entity_id, alias_norm)
);

CREATE UNIQUE INDEX IF NOT EXISTS entity_aliases_alias_norm_unique ON entity_aliases(alias_norm);
CREATE INDEX IF NOT EXISTS entity_aliases_entity_idx ON entity_aliases(entity_id);

ALTER TABLE relationships
  ADD COLUMN IF NOT EXISTS weight numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS relationships_unique_edge_idx
  ON relationships(source_entity_id, target_entity_id, relationship_type, COALESCE(segment, ''), COALESCE(note, ''));

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'news',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS country_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ingested_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE entity_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_aliases_select" ON entity_aliases FOR SELECT USING (true);
CREATE POLICY "entity_aliases_insert" ON entity_aliases FOR INSERT WITH CHECK (true);
