# Vantage Terminal — Data Source Evaluation & Architecture

## Part 1: Current State Diagnosis

### Why the Dashboard Is Slow

After auditing every data flow in the codebase, here are the **specific root causes**:

| # | Problem | Impact | Location |
|---|---------|--------|----------|
| 1 | **Polygon.io WebSocket auth fails** on free tier (403 on stocks/forex). Only crypto sometimes connects. | No real-time data for equities/forex. Entire watchlist falls back to Yahoo polling. | `providers/polygon.ts` |
| 2 | **Yahoo Finance polling every 10s for 19 symbols** — each symbol is a separate HTTP request via server action round-trip (browser → Next.js server → Yahoo → back). | ~19 sequential fetches × 10s loop = constant churn, frequent timeouts, UI flicker. | `polygon.ts → fetchMarketDataBatch` |
| 3 | **No server-side aggregation** — the browser orchestrates ALL data fetching through server actions. No API routes, no backend data bus. | Every panel independently triggers its own fetch waterfall. No data sharing between components. | `src/app/actions/*` |
| 4 | **No loading skeletons** — components show nothing or a spinner while data loads. Market Monitor table renders empty rows (`---`) that pop in one at a time. | Perceived slowness is worse than actual slowness. Users see a broken UI. | `dashboard/page.tsx` |
| 5 | **Gemini AI calls block panel rendering** — MiniCalendar and other widgets call AI server actions that take 2-8 seconds. | Right side panels appear dead on load. | `generateFullEventIntel.ts`, `analyzeMacroRegime.ts` |
| 6 | **RSS feeds fetched on every tab switch** — 5-min `revalidate` helps on repeat loads but first load for each category is 4-6 parallel fetches with 6s timeout. | News tab feels broken on first click. | `fetchNews.ts` |
| 7 | **In-memory cache resets on server restart** — `unstable_cache` and the `CACHE` object in `fetchEconomicCalendar.ts` are process-scoped. Dev server HMR clears them. | During development, caches are useless. | Multiple files |

### Data Flow Bottleneck Map

```
Browser loads dashboard
  ├── useMarketData(19 symbols)
  │     ├── Polygon WebSocket → FAILS (403 for stocks/forex)
  │     ├── Fallback: fetchMarketDataBatch(19 symbols, Yahoo) → 19 HTTP requests
  │     └── Repeats every 10 seconds
  ├── <MiniCalendar />
  │     └── fetchEconomicCalendarBatch(7 dates) → 7 HTTP requests to NASDAQ API
  ├── <NewsFeed />
  │     └── fetchNews('General') → 4 RSS fetches with 6s timeout each
  ├── <MarketInternals /> — depends on useMarketData (waits for first tick)
  ├── <SessionTracker /> — depends on useMarketData (waits for first tick)
  ├── <ICTPanel /> — depends on useMarketData (waits for first tick)
  └── <ConfluenceScanner /> — depends on useMarketData + Gemini AI call
```

**Total initial page load: ~30+ concurrent HTTP requests**, many dependent on each other.

---

## Part 2: API Evaluation Matrix

### EQUITIES / MULTI-ASSET

| API | Data Type | Delivery | Latency | Rate Limit (Free) | Reliability | Production Viable | Verdict |
|-----|-----------|----------|---------|-------------------|-------------|-------------------|---------|
| **Alpha Vantage** | OHLCV, quotes, fundamentals | REST | 15min delayed | 25 req/day (free), 75/min (premium) | Medium — frequent 503s under load | ❌ No. 25 calls/day is unusable. | **DROP** for MVP. The daily limit makes it a non-starter. |
| **Finnhub** ✅ | Real-time trades, quotes, candles, fundamentals, news | **WebSocket + REST** | **Real-time** (US stocks) | 60 API calls/sec, 50 WS symbols | **High** — stable, well-documented | ✅ **Yes** | **PRIMARY for US equities.** WebSocket for live prices, REST for candles/fundamentals. |
| **Twelve Data** | OHLCV, real-time (paid), quotes | REST + WS | 1min delayed (free) | 800 req/day, 8/min | Medium | ⚠️ Marginal | **SKIP.** Not enough requests for a dashboard. |
| **IEX Cloud** | Quotes, OHLCV, fundamentals | REST | 15min delayed (free) | 500k msg/mo (legacy free) | High — enterprise-grade | ⚠️ Free tier sunset | **SKIP.** Free tier is being phased out. |
| **StockData.org** | OHLCV, news | REST | 15min delayed | 100 req/day | Low — new, unproven | ❌ | **DROP.** Too few requests. |
| **Financial Modeling Prep** | Fundamentals, financials, SEC, calendars | REST | End-of-day | 250 req/day (free) | Medium | ⚠️ Good for fundamentals only | **KEEP for fundamentals/earnings.** Not for real-time. |
| **Alpaca Market Data** | Real-time trades, bars, quotes | **WebSocket + REST** | **Real-time** (with account) | Unlimited (with brokerage account) | **High** | ✅ **Yes** (requires account signup) | **FUTURE UPGRADE.** Best free real-time source if user has Alpaca account. |
| **SEC EDGAR** | Filings (10-K, 10-Q, 8-K) | REST | Minutes after filing | 10 req/sec | **High** — official source | ✅ | **KEEP.** Irreplaceable for SEC filings. |
| **Yahoo Finance** (current) | OHLCV, quotes, indices, forex, crypto | REST | ~15min delayed | Unofficial, no SLA | **Low** — can break without warning, cookie/crumb issues | ⚠️ Fragile | **KEEP as fallback only.** Too unreliable as primary source. Best coverage of indices/commodities. |

### CRYPTO

| API | Data Type | Delivery | Latency | Rate Limit | Reliability | Production Viable | Verdict |
|-----|-----------|----------|---------|------------|-------------|-------------------|---------|
| **CoinGecko** | Prices, market data, OHLCV | REST | 1-2min delayed | 30 req/min (free) | High | ⚠️ For reference data only | **KEEP for reference** (market cap, coin info). Not for real-time. |
| **Binance WebSocket** ✅ | Trades, order book, klines, ticker | **WebSocket** | **Real-time** (~50ms) | 5 WS connections, 300 streams/conn | **Very High** | ✅ **Yes** | **PRIMARY for crypto.** Best free real-time crypto source, period. |
| **Coinbase WebSocket** | Trades, order book, ticker | **WebSocket** | **Real-time** (~100ms) | Reasonable | High | ✅ | **SECONDARY fallback.** Slightly less comprehensive than Binance. |
| **Alpaca Crypto** | Trades, bars, quotes | **WebSocket + REST** | Real-time | With account | High | ✅ | **FUTURE.** Requires account. |

### FOREX

| API | Data Type | Delivery | Latency | Rate Limit | Reliability | Production Viable | Verdict |
|-----|-----------|----------|---------|------------|-------------|-------------------|---------|
| **Open Exchange Rates** | Exchange rates | REST | Hourly (free) | 1,000 req/mo | High | ⚠️ Too slow for trading | **DROP.** Hourly updates useless for forex trading. |
| **Currencylayer** | Exchange rates | REST | Hourly (free) | 100 req/mo | Medium | ❌ | **DROP.** 100 requests/month is unusable. |
| **OANDA API** | Quotes, candles | REST | Near real-time | Requires demo account | High | ⚠️ | **FUTURE.** Good if user creates demo account. |
| **Finnhub Forex** | Forex candles, exchange rates | REST | 1-5min | Included in 60/sec | Medium | ⚠️ | **USE for forex quotes** (REST, not WS on free tier). |
| **Yahoo Finance** (current) | Forex pairs | REST | ~15min | Unofficial | Low | ⚠️ | **KEEP as fallback.** Already implemented. |

### MACRO DATA

| API | Data Type | Delivery | Latency | Rate Limit | Reliability | Production Viable | Verdict |
|-----|-----------|----------|---------|------------|-------------|-------------------|---------|
| **FRED API** ✅ | US economic indicators (GDP, CPI, rates, employment) | REST | Same-day release | 120 req/min | **Very High** — Federal Reserve | ✅ **Yes** | **PRIMARY for US macro.** Gold standard. 500k+ series. |
| **IMF SDMX API** | Global GDP, trade, balance of payments | REST | Monthly/quarterly | Generous | High | ⚠️ | **KEEP for global macro.** Slow-moving data. |
| **World Bank** | Development indicators | REST | Annual | Generous | High | ⚠️ | **SKIP for MVP.** Too slow-moving for trading terminal. |
| **NASDAQ Economic Calendar** (current) | Calendar events, dates, actual/forecast | REST | Same-day | Generous | Medium | ⚠️ | **KEEP.** Already implemented and working. |

### NEWS & SENTIMENT

| API | Data Type | Delivery | Latency | Rate Limit | Reliability | Production Viable | Verdict |
|-----|-----------|----------|---------|------------|-------------|-------------------|---------|
| **Finnhub News** ✅ | Market news, company news | REST | Near real-time | Included in 60/sec | High | ✅ | **ADD as news source.** Structured, reliable. |
| **StockTwits** | Social sentiment, trending | REST | Real-time | 200 req/hr | Medium — rate limits tight | ⚠️ | **NICE-TO-HAVE.** Good for retail sentiment gauge. |
| **RSS Feeds** (current) | Headlines from CNBC, Yahoo, FT, etc. | RSS/HTTP | 5-15min | None | Medium — feeds break/change | ⚠️ | **KEEP.** Already implemented. Broadest coverage. |
| **GDELT** | Global event database, tone analysis | REST + BigQuery | 15min | Generous | High — academic-grade | ⚠️ | **FUTURE.** Complex to integrate. |
| **FinBERT** | Sentiment classification (model) | Local inference | Depends on hardware | N/A | High | ✅ | **FUTURE.** Requires Python backend. Would replace Gemini sentiment. |

### OPTIONS & DERIVATIVES

| API | Data Type | Delivery | Latency | Rate Limit | Reliability | Production Viable | Verdict |
|-----|-----------|----------|---------|------------|-------------|-------------------|---------|
| **Tradier** | Options chains, Greeks, historical | REST | 15min delayed (free) | Limited | High | ⚠️ User can't sign up | **BLOCKED.** User unable to create account. |
| **Alpaca Options** | Options data | REST | With account | With account | Medium — newer feature | ⚠️ | **FUTURE.** |
| **Polygon** | Options, snapshots | REST | Free tier: very limited | 5 req/min (free) | Medium | ❌ | **DROP.** 5 req/min is unusable. Current Polygon integration is broken. |

**Options verdict:** No viable free real-time options source exists. This is a known gap in the free API ecosystem. Best path: Alpaca account (free) or Tradier when signup works.

### OPEN SOURCE INFRASTRUCTURE

| Tool | Purpose | Recommendation |
|------|---------|----------------|
| **OpenBB** | Data aggregation layer (wraps 50+ sources) | **FUTURE** — useful as Python aggregation backend, overkill for MVP |
| **QuantConnect Lean** | Backtesting engine | **FUTURE** — for algo trading features |
| **DuckDB** | Analytical SQL engine | **MVP** — great for in-process analytics on OHLCV data |
| **Polars** | Fast DataFrame library | **FUTURE** — for Python quant engine |
| **TimescaleDB** | Time-series PostgreSQL extension | **SCALABLE** — best for time-series storage at scale |
| **ClickHouse** | Column-oriented OLAP database | **SCALABLE** — best for analytics queries on billions of rows |
| **Redis** | In-memory cache + pub/sub | **MVP** — critical for caching and real-time broadcast |
| **Kafka / Redpanda** | Stream processing | **SCALABLE** — overkill for MVP, essential at 100k+ users |
| **FastAPI** | Python API framework | **SCALABLE** — for Python quant engine API |
| **TradingView Lightweight Charts** | Charting library | **ALREADY USED** ✅ |

---

## Part 3: Overlap & Redundancy Analysis

### Redundant Combinations

| Overlap | Sources | Keep | Drop |
|---------|---------|------|------|
| US stock quotes | Alpha Vantage, Finnhub, Twelve Data, IEX, Yahoo | **Finnhub** (real-time WS) + Yahoo (fallback) | Alpha Vantage, Twelve Data, IEX |
| Crypto prices | CoinGecko, Binance, Coinbase, Alpaca | **Binance** (real-time WS) + CoinGecko (reference) | Coinbase (keep as fallback), Alpaca |
| Forex rates | Open Exchange Rates, Currencylayer, OANDA, Finnhub, Yahoo | **Finnhub** (REST) + Yahoo (fallback) | Open Exchange Rates, Currencylayer |
| News | Finnhub News, RSS, GDELT | **RSS** (broadest) + **Finnhub** (structured) | GDELT (future) |
| Sentiment | StockTwits, FinBERT, Gemini | **Gemini** (already integrated) | StockTwits (add later), FinBERT (future) |
| Economic data | FRED, NASDAQ, IMF, World Bank | **FRED** + **NASDAQ** (calendar) | World Bank, IMF (future) |

---

## Part 4: Recommended Stacks

### MVP Stack (Immediate — Single Next.js App)

```
┌──────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                      │
├──────────────────────────────────────────────────────────┤
│  Finnhub WebSocket ──→ US stock real-time prices          │
│  Binance WebSocket ──→ Crypto real-time prices            │
│  Yahoo REST (via API route) ──→ Indices, commodities,     │
│                                 forex, OHLCV history      │
│  SSE/polling ──→ News, calendar, macro                    │
│  Gemini ──→ AI analysis (cached, on-demand)               │
└──────────────────────────────────────────────────────────┘
                            │
                  Next.js API Routes
                            │
┌──────────────────────────────────────────────────────────┐
│                    SERVER (Next.js)                        │
├──────────────────────────────────────────────────────────┤
│  In-memory cache (Map with TTL) for:                      │
│    • Yahoo quotes (30s TTL)                               │
│    • OHLCV history (60s TTL)                              │
│    • FRED macro data (1h TTL)                             │
│    • NASDAQ calendar (1h TTL)                             │
│    • RSS news (5min TTL)                                  │
│    • Finnhub fundamentals (24h TTL)                       │
│  API Routes:                                              │
│    /api/market/quotes   — batch quote proxy               │
│    /api/market/chart    — OHLCV proxy                     │
│    /api/macro/fred      — FRED series data                │
│    /api/news/feed       — cached news aggregation         │
│  Server Actions (existing):                               │
│    AI analysis, event intel, earnings                     │
└──────────────────────────────────────────────────────────┘
                            │
┌──────────────────────────────────────────────────────────┐
│                   EXTERNAL DATA SOURCES                    │
├──────────────────────────────────────────────────────────┤
│  Finnhub ──→ WS: US stocks real-time                      │
│              REST: candles, fundamentals, news             │
│  Binance ──→ WS: crypto trades + mini-ticker              │
│  Yahoo   ──→ REST: indices, commodities, forex, OHLCV     │
│  FRED    ──→ REST: US macro indicators                    │
│  NASDAQ  ──→ REST: economic calendar, earnings            │
│  RSS     ──→ HTTP: news feeds                             │
│  Gemini  ──→ REST: AI analysis                            │
│  Supabase──→ REST: auth, user preferences                 │
│  SEC EDGAR─→ REST: filings (future)                       │
└──────────────────────────────────────────────────────────┘
```

### Scalable Stack (100k+ Concurrent Users)

```
┌───────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                            │
│  WebSocket connection to backend ──→ all real-time data            │
│  REST calls to API gateway ──→ historical, on-demand queries       │
└───────────────────────────────────────────────────────────────────┘
                                │
                          Load Balancer
                                │
┌───────────────────────────────────────────────────────────────────┐
│                       API GATEWAY (FastAPI)                         │
│  • Rate limiting, auth, routing                                    │
│  • WebSocket fan-out to connected clients                          │
│  • REST endpoints for historical queries                           │
└───────────────────────────────────────────────────────────────────┘
            │                    │                     │
┌───────────┴────────┐ ┌────────┴──────────┐ ┌───────┴──────────┐
│  DATA INGESTION    │ │  CACHE LAYER      │ │  STORAGE         │
│  WORKERS           │ │                   │ │                  │
│                    │ │  Redis Cluster     │ │  TimescaleDB     │
│  Finnhub WS ─┐    │ │  • Quote cache     │ │  • OHLCV history │
│  Binance WS ─┤    │ │  • Pub/Sub for     │ │  • Tick archive  │
│  Alpaca WS ──┤    │ │    real-time fan-   │ │                  │
│  OANDA WS ───┘    │ │    out to API pods  │ │  ClickHouse      │
│         │         │ │  • Session store    │ │  • Analytics     │
│    Redpanda       │ │                    │ │  • Backtesting   │
│    (message bus)  │ │                    │ │                  │
└───────────────────┘ └────────────────────┘ └──────────────────┘
```

Key differences at scale:
- **Redpanda** replaces direct API calls — data ingestion workers normalize all feeds into a unified topic
- **Redis Pub/Sub** replaces per-client WebSocket connections to external APIs
- **TimescaleDB** stores all historical OHLCV data locally (no more Yahoo dependency)
- **ClickHouse** for analytical queries (backtesting, pattern scanning)
- **FastAPI** backend replaces Next.js server actions for data-intensive operations

---

## Part 5: Implementation Plan

### Phase 1: Fix Critical Slowness (This PR)

**Priority: IMMEDIATE — fixes the broken dashboard**

1. ✅ **Replace Polygon with Finnhub WebSocket** for US stock real-time data
   - Symbols: AAPL, TSLA, NVDA, MSFT (and any US stocks)
   - Real-time trade data, sub-second latency

2. ✅ **Add Binance WebSocket** for crypto real-time data
   - Symbols: BTCUSDT, ETHUSDT, SOLUSDT
   - Real-time mini-ticker, sub-100ms latency

3. ✅ **Create HybridProvider** that routes symbols to correct provider:
   - US stocks → Finnhub WebSocket
   - Crypto → Binance WebSocket
   - Everything else → Yahoo REST polling (with improved caching)

4. ✅ **Add API routes** with server-side caching:
   - `/api/market/quotes` — batched, cached quote endpoint
   - `/api/market/chart` — cached OHLCV endpoint
   - `/api/macro/fred` — FRED series data

5. ✅ **Wire FRED API** for real macro data
   - Fed funds rate, CPI, GDP, unemployment, treasury yields

6. ✅ **Add .env.local keys** — Finnhub, FRED

### Phase 2: Improve UX (Next Sprint)

7. Add skeleton loading states to all panels
8. Implement stale-while-revalidate pattern for server actions
9. Add SSE endpoint for news streaming
10. Pre-warm caches on server startup
11. Add Finnhub company news to supplement RSS feeds

### Phase 3: Scale Data Layer (Future)

12. Add Redis for cross-process caching
13. Add TimescaleDB for OHLCV storage
14. Replace Yahoo with Alpaca for indices/options (requires account)
15. Add SEC EDGAR filing integration
16. Add OANDA for forex (requires demo account)
17. Integrate OpenBB as data aggregation layer
18. Add FinBERT for local sentiment (replaces Gemini for sentiment)

### Phase 4: Production Scale (100k+ Users)

19. Migrate data ingestion to standalone workers
20. Add Redpanda message bus
21. Deploy Redis cluster for pub/sub fan-out
22. Add ClickHouse for analytics
23. Build FastAPI gateway for data-heavy endpoints

---

## Part 6: Symbol Routing Strategy

| Symbol | Primary Source | Fallback | Delivery | Expected Latency |
|--------|---------------|----------|----------|-------------------|
| AAPL, TSLA, NVDA, MSFT | **Finnhub WS** | Yahoo REST | Real-time | <1s |
| BTCUSD, ETHUSD, SOLUSD | **Binance WS** | Yahoo REST | Real-time | <100ms |
| NAS100, SPX500, US30, RUSSELL, DAX40 | **Yahoo REST** | — | 10s polling | ~15min delayed |
| GOLD, SILVER, CRUDE, NATGAS | **Yahoo REST** | — | 10s polling | ~15min delayed |
| EURUSD, GBPUSD, USDJPY, AUDUSD | **Yahoo REST** | Finnhub REST | 10s polling | ~15min delayed |
| VIX, DXY, US10Y | **Yahoo REST** | — | 10s polling | ~15min delayed |

**Note:** Free-tier indices/commodities/forex will always be delayed. Real-time for these asset classes requires paid subscriptions (Alpaca, OANDA, or exchange feeds). This is an inherent limitation of the free API ecosystem, not an architecture problem.

---

## Part 7: Rate Limit Management

| API | Limit | Strategy |
|-----|-------|----------|
| **Finnhub** | 60 req/sec REST, 50 symbols WS | WS for quotes (no REST needed for live prices). REST only for candles/fundamentals. |
| **Binance** | 5 WS connections × 300 streams | Single connection with combined stream. Well within limits. |
| **Yahoo** | Unofficial, ~2000/hr estimated | Batch requests, 10s polling, server-side cache. |
| **FRED** | 120 req/min | Cache aggressively (1h TTL). Macro data doesn't change intra-day. |
| **NASDAQ** | Generous, no documented limit | Already cached 1h. Fine as-is. |
| **Gemini** | 15 RPM (free), 1500 RPM (paid) | `unstable_cache` with 1h TTL. Already implemented. |

---

## Part 8: Critical Missing Components

| Component | Priority | Why It's Missing | Recommendation |
|-----------|----------|------------------|----------------|
| **Real-time index data** | High | No free source provides real-time index WebSocket | Alpaca (free account) or accept 15min delay |
| **Options chain data** | Medium | Tradier signup blocked, Polygon free tier useless | Wait for Tradier, or use Alpaca |
| **SEC filing integration** | Medium | Not implemented yet | EDGAR API — straightforward to add |
| **Historical data storage** | Medium | All OHLCV fetched live from Yahoo every time | TimescaleDB or DuckDB for local OHLCV cache |
| **Forex real-time** | Medium | No free real-time forex feed | OANDA demo account or accept Yahoo delay |
| **Sentiment pipeline** | Low | Using Gemini (expensive, slow) | FinBERT local model or StockTwits API |
| **Backtesting data** | Low | No historical data pipeline | QuantConnect Lean + DuckDB |
