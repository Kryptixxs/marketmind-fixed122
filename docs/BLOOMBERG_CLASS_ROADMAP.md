# Bloomberg-Class Architecture Roadmap

This document validates the architectural gap analysis against the MarketMind codebase and proposes a phased implementation plan.

---

## 1. Gap Analysis — Validated Against Codebase

### ✅ 1. Knowledge Graph / Entity Relationship Layer

**Status: Partially implemented**

| Component | Exists | Location |
|-----------|--------|----------|
| Entities table | ✅ | `supabase/migrations/...entities_relationships_documents.sql` |
| Relationships (customer/supplier/partner) | ✅ | Same migration |
| Documents with entity_ids + full-text | ✅ | Same migration |
| Supply chain fetch (Supabase → static fallback) | ✅ | `fetchSupplyChain.ts`, `supply-chain-data.ts` |
| Entity intel (entity + relationships + news) | ✅ | `fetchEntityIntel.ts` |
| Cross-entity traversal | ⚠️ | Single-hop only; no multi-hop graph queries |
| Historical events linked to entities | ❌ | No event→entity linkage |
| Country/date filtering on relationships | ✅ | `fetchEntityIntel` supports `country`, `date` |

**Missing:** Multi-hop graph traversal, event→entity links, Neo4j-style relationship queries.

---

### ✅ 2. Search System Limited to Command Parsing

**Status: Confirmed**

| Component | Current State |
|-----------|---------------|
| Command engine | `TerminalCommandEngine` parses `go <fn>`, `<symbol> <fn>`, route aliases — structural only |
| Symbol search | `searchSymbols` → `searchPrototypeSymbols` — in-memory filter, `.slice(0, 8)` |
| Document search | `searchDocuments` exists with full-text, entity, date filters — **not wired to UI** |
| Entity search | `fetchEntityIntel` exists — **not exposed in global search** |
| Natural language routing | ❌ None |
| Elasticsearch/OpenSearch | ❌ Postgres `tsvector` used instead (sufficient for MVP) |

**Key finding:** Backend search exists (`searchDocuments`, `fetchEntityIntel`). The UI does not use it.

---

### ✅ 3. Panels Render Limited Content

**Status: Confirmed — many hard caps**

| File | Pattern | Cap |
|------|---------|-----|
| `TerminalStore.tsx` | `tape.slice(0, 80)`, `systemFeed.slice(0, 80)` | 80 |
| `DescriptionModule.tsx` | `headlines.slice(0, 26)` | 26 |
| `HistoricalPricingModule.tsx` | `quotes.slice(0, 8)`, `executionEvents.slice(0, 24)`, `systemFeed.slice(0, 14)` | 8–24 |
| `FinancialAnalysisModule.tsx` | `quotes.slice(0, 34)` | 34 |
| `CalendarModule.tsx` | `quotes.slice(0, 24)` | 24 |
| `ICTPanel.tsx` | `swingHighs.slice(0, 3)`, `fvgs.slice(0, 4)` | 3–4 |
| `BondAnalyticsModule.tsx` | `orderBook.slice(0, 8)` | 8 |
| `prototype-data.ts` | `searchPrototypeSymbols` → `.slice(0, 8)` | 8 |
| `EarningsCalendarView.tsx` | `dayEvents.slice(0, 15)` | 15 |
| `NewsFeed.tsx` | `.slice(0, 20)` | 20 |

**Recommendation:** Replace fixed caps with configurable limits + virtualized lists where appropriate.

---

### ✅ 4. Dynamic Data Streams

**Status: Mixed**

| Data Type | Source | Live? |
|-----------|--------|-------|
| Market prices | `useMarketData` → Yahoo Finance | ✅ Real |
| Order book / tape | Simulator | ❌ Simulated |
| News | `makePrototypeNews`, `documents` table | ⚠️ Prototype + DB (if seeded) |
| Economic events | `fetchEconomicCalendar`, prototype | ⚠️ Real API + prototype |
| Earnings | `fetchEarnings`, prototype | ⚠️ Real API + prototype |

**Missing:** Pluggable ingestion pipeline, real news/event streams, WebSocket feeds for tape/depth.

---

### ✅ 5. Module Isolation — Shallow Data

**Status: Confirmed**

| Module | Data Source | Rich? |
|--------|-------------|-------|
| DES (Description) | `issuerRows` hardcoded, `fetchSupplyChain` for Supply Chain tab | ⚠️ Partial |
| FA (Financial Analysis) | Simulator `functionRows`, static metrics | ❌ Simulated |
| WEI (Earnings) | Simulator + `fetchEarnings` | ⚠️ Mixed |
| HP (Historical Pricing) | Simulator quotes, execution events | ❌ Simulated |
| INTEL | `fetchEntityIntel` | ✅ Real backend — **underused** |

**Key finding:** `fetchEntityIntel` and `fetchSupplyChain` return real data. DES/FA/WEI modules don't consistently use them.

---

### ✅ 6. Search & Entity Tabs Shallow or Absent

**Status: Confirmed**

| Feature | Exists | Notes |
|---------|--------|-------|
| Global search bar | ⚠️ | CommandPalette (Ctrl+K) — symbols, nav, workspaces only |
| Search results: entities | ❌ | No entity result type |
| Search results: news | ❌ | No document/news result type |
| Timeline filters | ❌ | `searchDocuments` supports dateFrom/dateTo — not in UI |
| Relationship graph view | ❌ | Supply chain is list, not graph |
| Drill-down entity pages | ⚠️ | DES module shows supply chain; no dedicated entity page |

---

## 2. What Already Exists (Leverage This)

1. **Supabase backend**
   - `entities`, `relationships`, `documents`
   - Full-text search on documents (`tsvector`)
   - `fetchEntityIntel(entity, { country?, date? })`
   - `searchDocuments(query, entityId?, dateFrom?, dateTo?)`
   - `fetchSupplyChain(symbol)` with DB fallback

2. **Seed script**
   - `scripts/seed-intel-data.ts` — seeds from `supply-chain-data.ts`

3. **Static supply chain data**
   - `supply-chain-data.ts` — PLTR, AAPL, MSFT, NVDA, AMZN, TSLA, META, GOOGL

---

## 3. Phased Implementation Plan

### Phase 1: Wire Existing Backend to UI (1–2 weeks)

**Goal:** Make existing search and entity APIs visible in the UI.

1. **Global search enhancement**
   - Extend CommandPalette or add a dedicated search bar.
   - On query:
     - Call `searchSymbols` (keep for symbols).
     - Call `searchDocuments(query)` for news/documents.
     - Call `fetchEntityIntel(query)` for entity summary.
   - Render results in tabs: **Symbols** | **Entities** | **News**.

2. **DES module enrichment**
   - Replace hardcoded `issuerRows` with `fetchEntityIntel(state.activeSymbol)`.
   - Use `entity` + `supplyChain` + `news` from the response.
   - Add date filter for news: `fetchEntityIntel(sym, { date: '2019-08-09' })`.

3. **INTEL module**
   - Ensure it uses `fetchEntityIntel` with country/date filters.
   - Add "News for [entity] on [date]" support.

**Deliverables:** "Palantir Russia" and "News for Palantir on 2019-08-09" return real results.

---

### Phase 2: Relax Panel Caps & Improve Density (1 week)

**Goal:** Panels show more data; layout flexes to content.

1. **Replace fixed `.slice(0, N)` with configurable limits**
   - e.g. `DISPLAY_LIMITS = { tape: 200, systemFeed: 150, quotes: 50 }`.
   - Add "Show more" or infinite scroll where appropriate.

2. **Virtualized lists**
   - Use `react-window` or `@tanstack/react-virtual` for tape, system feed, news.
   - Prevents DOM bloat while allowing large datasets.

3. **Flexible grid layouts**
   - Replace `grid-rows-[60%_40%]` with `min-height` + `flex-1` where possible.
   - Allow panels to grow with content up to a max.

---

### Phase 3: Backend Search & Graph Expansion (2–3 weeks)

**Goal:** Richer search, entity graph, date-aware queries.

1. **Unified search API**
   - New route: `POST /api/search` or server action `searchAll(query, filters)`.
   - Aggregates: symbols, entities, documents, (optional) relationships.
   - Returns ranked, typed results.

2. **Entity graph API**
   - `GET /api/entities/:id/relationships?depth=2` for multi-hop.
   - Optional: Materialize graph in Postgres or add Neo4j for complex traversal.

3. **Document indexing**
   - Ingest real news (RSS, API) into `documents` with `entity_ids`.
   - Run seed script regularly.

---

### Phase 4: Dynamic Data Streams (2+ weeks)

**Goal:** Live feeds for tape, depth, news.

1. **Pluggable data adapters**
   - Abstract `useMarketData` behind an adapter interface.
   - Support: Yahoo (current), Polygon, Alpaca, etc.

2. **News/event streams**
   - WebSocket or polling for `documents` table.
   - Push new items to News panel.

3. **Tape/depth**
   - If real L2/L3 feed available, replace simulator for that symbol.

---

## 4. Where to Start

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Wire `searchDocuments` + `fetchEntityIntel` to CommandPalette or new Global Search | 2–3 days | High — enables "search news and relationships" |
| 2 | DES module: use `fetchEntityIntel` for issuer + supply chain + news | 1 day | High — fills blank space with real data |
| 3 | Add date filter to entity news ("News for X on Y") | 0.5 day | Medium — answers date-scoped queries |
| 4 | Relax tape/systemFeed/quote caps; add virtualization | 2–3 days | Medium — better density |
| 5 | Unified `/api/search` aggregating symbols + entities + documents | 2 days | High — single entry point for search UX |

**Recommended first step:** Implement **Priority 1** — a Global Search component that calls `searchDocuments` and `fetchEntityIntel`, and renders results in a modal or dropdown. This immediately unlocks "Who does Palantir work with in Russia?" and "News for Palantir on 2019-08-09" using existing backend.

---

## 5. API Surface (Current + Proposed)

### Existing

```
searchSymbols(query)           → SymbolSearchItem[]  (prototype only)
searchDocuments(query, entityId?, dateFrom?, dateTo?) → DocumentResult[]
fetchEntityIntel(entity, { country?, date? })        → EntityIntelResult
fetchSupplyChain(symbol)        → SupplyChainData | null
```

### Proposed

```
searchAll(query, { types?: ['symbol','entity','document'], dateFrom?, dateTo?, entityId? })
  → { symbols, entities, documents }
```

---

## 6. Files to Modify (Phase 1)

| File | Change |
|------|--------|
| `CommandPalette.tsx` or new `GlobalSearch.tsx` | Add document + entity search, multi-tab results |
| `DescriptionModule.tsx` | Use `fetchEntityIntel` for Overview; add date picker for news |
| `IntelModule.tsx` | Verify uses `fetchEntityIntel` with filters |
| `TerminalStore.tsx` | Increase tape/systemFeed limits or make configurable |
| `src/app/actions/searchAll.ts` (new) | Aggregate searchSymbols + searchDocuments + fetchEntityIntel |

---

*Last updated: 2025-03-05*
