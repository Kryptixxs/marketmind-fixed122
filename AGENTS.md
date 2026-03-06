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

Only `GEMINI_API_KEY` is required (for AI features). Copy `.env.example` to `.env.local` and set it. Without it, the app runs but AI-powered panels (sentiment, technical analysis, macro analysis) will fail gracefully. `FMP_API_KEY` is optional (economic calendar accuracy).

### Important caveats

- **Kill switch / expiry date**: `src/services/context/AuthContext.tsx` contains a hardcoded `EXPIRY_DATE` (currently set to March 5, 2026). After this date, guest access via the secret sequence is blocked. If testing after this date, the expiry date must be extended or a Supabase account must be used.
- **Guest access**: The app has a hidden guest bypass activated by typing the sequence `02062010` on the landing page. This sets a session storage key (`vantage_session_bypass`) that grants access without Supabase auth.
- **Supabase credentials** are hardcoded in `src/integrations/supabase/client.ts` — no env vars needed for auth.
- **No automated test suite** exists in this repository. Testing is manual (run the dev server and interact with the UI).
