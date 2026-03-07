// Run in Neo4j Browser or cypher-shell before sync.

CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
FOR (e:Entity)
REQUIRE e.id IS UNIQUE;

CREATE INDEX entity_ticker_idx IF NOT EXISTS
FOR (e:Entity)
ON (e.ticker);

CREATE INDEX entity_country_idx IF NOT EXISTS
FOR (e:Entity)
ON (e.country);

CREATE INDEX entity_sector_idx IF NOT EXISTS
FOR (e:Entity)
ON (e.sector);
