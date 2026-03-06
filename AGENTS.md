# Agents

## Cursor Cloud specific instructions

### Project overview

Vantage Terminal is a Next.js 15 (App Router, React 19) AI-powered financial intelligence terminal. It's a single monolith — no separate backend services, Docker, or local database required. All external services are either cloud-hosted (Supabase auth at `oeosfycqhpsripaihaqy.supabase.co` with hardcoded credentials) or public APIs (Yahoo Finance, NASDAQ, RSS feeds).

There is also a `quant_engine/` directory with standalone Python code (not wired into the web app at runtime).

### Running the app

- `npm run dev` — starts the Next.js dev server on port 3000
- `npm run build` — production build
- `npm run lint` — ESLint (pre-existing lint errors exist in the codebase; ~40 errors, ~13 warnings)
- See `package.json` scripts for the full list

### Environment variables

Copy `.env.example` to `.env.local` and set the following (see `.env.example` for descriptions):

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Yes | AI analysis features (Gemini 2.0/2.5 Flash) |
| `NEXT_PUBLIC_FINNHUB_KEY` | Recommended | Real-time US stock WebSocket (client-side) |
| `FINNHUB_API_KEY` | Recommended | Finnhub REST API (server-side quotes, fundamentals) |
| `FRED_API_KEY` | Recommended | Federal Reserve macro data (GDP, CPI, rates) |
| `FMP_API_KEY` | Optional | Economic calendar accuracy |

### Data architecture

See `docs/DATA_ARCHITECTURE.md` for the full API evaluation, architecture design, and implementation plan. Key data flow:

- **US stocks** (AAPL, TSLA, NVDA, MSFT): Finnhub WebSocket → Yahoo REST fallback
- **Crypto** (BTCUSD, ETHUSD, SOLUSD): Binance WebSocket → Yahoo REST fallback
- **Indices, commodities, forex**: Yahoo REST polling (10s interval)
- **Macro data**: FRED API via `/api/macro/fred` route
- **News**: RSS feeds (Yahoo, CNBC, MarketWatch, FT, CoinTelegraph)
- **AI analysis**: Google Gemini with `unstable_cache` (1h TTL)
- **Calendar/Earnings**: NASDAQ API

Provider selection is in `src/features/MarketData/services/marketdata/providers/hybrid.ts`.

### API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/macro/fred` | GET/POST | FRED economic data (cached 1h) |
| `/api/market/quotes` | GET | Batch quotes with Finnhub→Yahoo fallback (cached 15s) |

### Important caveats

- **Kill switch / expiry date**: `src/services/context/AuthContext.tsx` contains a hardcoded `EXPIRY_DATE` (currently set to March 5, 2026). After this date, guest access via the secret sequence is blocked. If testing after this date, the expiry date must be extended or a Supabase account must be used.
- **Guest access**: The app has a hidden guest bypass activated by typing the sequence `02062010` on the landing page. This sets a session storage key (`vantage_session_bypass`) that grants access without Supabase auth.
- **Supabase credentials** are hardcoded in `src/integrations/supabase/client.ts` — no env vars needed for auth.
- **No automated test suite** exists in this repository. Testing is manual (run the dev server and interact with the UI).
- **Finnhub free tier**: 60 REST req/sec, 50 WebSocket symbols. Rate limit errors fall back to Yahoo automatically.
- **Binance WebSocket**: Requires outbound access to `stream.binance.com:9443`. May fail in restricted network environments (falls back to Yahoo).
