# Product Transformation Strategy

## 1. Product Repositioning

**Definition:**
A mission-critical intelligence platform for high-value professionals, embedded in daily workflows, delivering asymmetric ROI.

**ICP Definition:**
*   **Job Title:** Portfolio Manager, CIO, Head of Trading, Senior Risk Analyst.
*   **Firm Size:** Hedge Funds ($50M+ AUM), Family Offices, Proprietary Trading Firms, Boutique Investment Banks.
*   **Budget Authority:** Direct P&L responsibility or discretionary technology budget >$50k/year.

**Core Pain (Quantified):**
*   **Latency Cost:** "Missing a macro rotation correlation by 15 minutes cost us 40bps on a $10M position ($40k)."
*   **Context Switching:** "Analyst spends 2 hours/day aggregating news/prices across 5 tabs = $50k/year in wasted productivity."
*   **Blind Spots:** "Failure to see cross-asset contagion risks led to a 5% drawdown."

**Switching Cost Strategy:**
*   **Data Gravity:** Store user's custom derived datasets and historical annotations.
*   **Workflow Integration:** Custom alerts trigger their execution algorithms (webhooks).
*   **Learned Behavior:** Proprietary hotkeys and command syntax become muscle memory.

**Competitive Moat:**
*   **Proprietary Synthesis:** Unique "Insight Score" combining News sentiment + Price Action + Macro Events (not just raw data).
*   **Speed to Insight:** Sub-second push notifications for complex event correlations.

## 2. System Architecture Overhaul

**Proposed Architecture:**

*   **Frontend (The Terminal):** Next.js (App Router) + React Server Components for shell, Client Components for interactive widgets.
*   **Real-time Layer:** Dedicated WebSocket Server (Node.js/Go) or Supabase Realtime for pushing tick-level updates.
*   **API Gateway:** GraphQL (e.g., Apollo) or tRPC for type-safe data fetching.
*   **Ingestion Engine:** Python/Rust workers consuming varied feeds (Bloomberg, Polygon, Twitter/X), normalizing, and pushing to:
    *   **Hot Store:** Redis (latest state, pub/sub).
    *   **Time-Series DB:** TimescaleDB or ClickHouse (historical ticks).
    *   **Relational DB:** PostgreSQL (Users, Configs, Audit Logs).
*   **Auth:** Enterprise SSO (SAML/OIDC) via Auth0 or Supabase Auth.

**Schema Redesign (Key Entities):**
*   `User`: { id, org_id, role, settings (JSONB) }
*   `Organization`: { id, name, subscription_tier, sso_config }
*   `Workspace`: { id, owner_id, layout_config (JSONB), shared_with (Array) }
*   `AuditLog`: { id, actor_id, action, resource, timestamp, metadata }

**Observability:**
*   OpenTelemetry tracing across services.
*   Log management (Datadog/Elastic).
*   Real-time specialized metric: "Tick-to-Glass Latency".

## 3. UI/UX: Bloomberg-Level Density

**Design Philosophy:**
*   **Density > White Space:** No padding > 4px unless necessary for separation.
*   **Data-Ink Ratio:** Maximize data per pixel.
*   **Keyboard First:** Mouse is secondary.

**New Layout System:**
*   **Grid Framework:** CSS Grid with user-resizable panes (react-resizable-panels).
*   **Global Command Palette (Cmd+K):** Navigate, execute trades, toggle settings.
*   **Contextual Hotkeys:** "1m", "5m", "1h" changes chart timeframe instantly.

**State Management:**
*   **Zustand:** For global client state (active workspace, layout, selected ticker).
*   **React Query:** For server state (async data) with aggressive stale-while-revalidate.
*   **Web Workers:** Offload heavy calculations (technical indicators) to keep UI thread smooth.

## 4. Data Advantage

**Proprietary Intelligence Layer:**
*   **Normalization:** Map all assets to a unified global ID (FIGI or custom).
*   **Scoring Engine:** "Market Stress Index" (0-100) calculated real-time from VIX, MOVE, Credit Spreads.
*   **Predictive Models:** Simple regression/ML models running on historical data to flag "Anomalous Moves" (e.g., "AAPL is down 2% but Tech Sector is up 1% -> Divergence Alert").

**Defensibility:**
*   The models improve as we gather more proprietary user interaction data (what do winners look at?).

## 5. Enterprise Features ($20k/yr Justification)

**Feature Spec:**
*   **SSO:** Enforce login via Okta/Azure AD.
*   **RBAC:** "Analyst" (Read-only), "Trader" (Execute), "Admin" (Billing/Users).
*   **Audit Logs:** "User X exported 'Q3 Earnings Data' at 14:02 UTC."
*   **SLA:** 99.99% uptime guarantee.

## 6. Monetization Design

*   **Tier 1: Professional ($2k/mo / $20k/yr):** Full terminal, real-time data, 5 workspaces, API access (100 req/s).
*   **Tier 2: Team ($50k/yr):** 3 Seats, Shared Workspaces, Admin Console, SSO.
*   **Add-ons:**
    *   "Alpha Stream" (News Sentiment): +$5k/yr.
    *   "Global Macro" (Emerging Markets Data): +$5k/yr.

## 7. Implementation Plan

**Phase 1: Core Infrastructure (Weeks 1-4)**
*   Set up Postgres + Redis.
*   Build simple Ingestion Service (fetch from Yahoo/Gemini -> Cache).
*   Deploy Next.js shell with Auth.

**Phase 2: UX Transformation (Weeks 5-8)**
*   Implement Grid Layout System.
*   Build "Widget" library (Chart, Tape, News, Watchlist).
*   Integrate Command Palette.

**Phase 3: Data & Intelligence (Weeks 9-12)**
*   Build Normalization Layer.
*   Implement first proprietary signals.

**Phase 4: Enterprise Hardening (Weeks 13-16)**
*   SSO integration.
*   Audit Logging.
*   Load Testing.

## 8. Codebase Transformation

**Current Weaknesses:**
*   Flat structure in `app/`.
*   Fetching logic inside UI components (`useEffect` in `page.tsx`).
*   No strict typing on external API responses (using `any` or loose types).

**Refactor Plan:**
1.  **Directory Structure:**
    *   `src/features/` (Auth, MarketData, News, Portfolio).
    *   `src/services/` (API clients, WebSocket managers).
    *   `src/components/ui/` (Atomic design system).
2.  **Strict Types:** Define Zod schemas for all external data.
3.  **Performance:** Memoize heavy components (`TradingChart`).

## 9. $100M Mindset
*   Every pixel must justify its existence.
*   Speed is a feature.
*   Trust is the currency.

---
**Immediate Action Items (Started)**
1.  Created this strategy document.
2.  Refactoring `app/layout.tsx` for dense, dark-mode-first "Terminal" feel.
3.  Building the Command Palette (`Cmd+K`).
