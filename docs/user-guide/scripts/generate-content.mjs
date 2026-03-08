#!/usr/bin/env node
/**
 * MarketMind Terminal — Docs Content Generator
 * Reads the live mnemonic catalog/registry from source code and generates
 * all Markdown pages under docs/user-guide/src/
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC  = join(ROOT, 'src');

// ── Dynamic import of catalog from app source ───────────────────────────────
// We resolve relative to this script's location
const catalogPath = join(ROOT, '../../src/features/terminal-next/mnemonics/catalog.ts');
const { listCatalogMnemonics, listCatalogByTaxonomy } = await import(
  // Use file:// URL to avoid Windows path issues
  `file:///${catalogPath.replace(/\\/g, '/')}`
);

const ALL_CATALOG = listCatalogMnemonics();
const TAXONOMY = listCatalogByTaxonomy();

// ── The hand-built MNEMONIC_DEFS reference ──────────────────────────────────
/** Core hand-built mnemonics with extra narrative */
const CORE_MNEMONICS = [
  // Equity
  { code: 'WEI',   title: 'World Equity Indices',         cat: 'Market Monitors', scoped: false, recipe: 'MonitorTable',
    purpose: 'Real-time overview of all global equity indices. Shows level, change, %change, YTD, and region tags.',
    inputs: 'No security required. Loads with global default universe.',
    tiles: ['Index table (full universe)', 'Top movers (gainers/losers)', 'Sector dispersion mini-table', 'Correlation mini-table', 'Alerts/notes strip'],
    fields: ['PX_LAST','PX_CHG','PCT_CHG','YTD_PCT','REGION'],
    drills: ['Click index row → DES', 'Shift+Click → new pane', 'Alt+Click → Inspector', 'Column header → sort'],
    keys: ['↑↓ select row', 'Enter → DES of selected', 'Shift+Enter → send to pane'],
    example: 'WEI GO',
    related: ['IMAP','TOP','ECO','FXC','RFCM','GMOV'],
    pitfalls: ['All data is SIM-sourced; freshness badges show STALE after session age', 'Use IMAP for sector breakdown instead of column scrolling'],
  },
  { code: 'DES',   title: 'Security Description',          cat: 'Equity Reference', scoped: true, recipe: 'ReferenceSheet',
    purpose: 'Comprehensive reference sheet for any security: fundamentals, trading stats, business summary, peers, ownership, events.',
    inputs: 'Requires a security (ticker + market). E.g. AAPL US Equity.',
    tiles: ['Key fundamentals (P/E, EPS, Div Yield, Market Cap, Beta)', 'Trading statistics (VWAP, 52W H/L, volume)', 'Business summary text', 'Peer quick table', 'Ownership & events strip'],
    fields: ['PX_LAST','PE_RATIO','EPS','DIV_YLD','MKT_CAP','BETA','VWAP','52W_HIGH','52W_LOW'],
    drills: ['P/E field → LINE (lineage)', 'Peer row → DES of peer', 'Ownership row → OWN', 'Events row → EVT'],
    keys: ['F2 → MENU for related functions', 'Alt+Enter on any value → Inspector with field history'],
    example: 'AAPL US DES GO',
    related: ['HP','FA','OWN','CN','EVT','RELS','MGMT','DVD'],
    pitfalls: ['Must include market suffix: AAPL US not just AAPL', 'Business summary is SIM; real filings require TRNS/FIL'],
  },
  { code: 'HP',    title: 'Historical Pricing',            cat: 'Equity Reference', scoped: true, recipe: 'AnalyticsBoard',
    purpose: 'Day-by-day OHLCV table with change columns and sorting. Supports multiple timeframes.',
    inputs: 'Security required. Timeframe can be set: 1M, 3M, 1Y, 5Y.',
    tiles: ['OHLCV table (sortable, virtualised for large ranges)', 'Return distribution mini-chart'],
    fields: ['PX_OPEN','PX_HIGH','PX_LOW','PX_LAST','PX_CHG','PCT_CHG','VOLUME'],
    drills: ['Click date row → GP chart at that date', 'Click column header → sort', 'PCT_CHG value → LINE'],
    keys: ['PageDown → next page of rows', 'Click col header → toggle sort', 'Enter → drill selected security'],
    example: 'MSFT US HP GO  |  MSFT US HP 1Y GO',
    related: ['GP','GIP','DES','DVD','HIST+'],
    pitfalls: ['Data is simulated; gaps may exist at session boundary', '1M is default — add 1Y or 5Y to command for longer history'],
  },
  { code: 'GP',    title: 'Price Chart (Daily)',            cat: 'Charts', scoped: true, recipe: 'AnalyticsBoard',
    purpose: 'Canvas-based OHLCV candlestick/line chart with volume. Supports timeframe switching and comparison.',
    inputs: 'Security required. Timeframe via command or UI.',
    tiles: ['Main chart (canvas)', 'Volume bars', 'Stats strip (return, volatility)', 'Related tickers chips'],
    fields: ['PX_LAST','PCT_CHG','VOLUME','VWAP'],
    drills: ['Click ticker chip → GP of that ticker', 'PX_LAST chip → LINE'],
    keys: ['1D/5D/1M/3M/1Y → change timeframe in command', 'Crosshair shows OHLC on hover'],
    example: 'AAPL US GP GO  |  EURUSD Curncy GP 1Y GO',
    related: ['GIP','HP','RV','DES'],
    pitfalls: ['Canvas chart — not copyable as SVG. Use GRAB+ to export', 'Long timeframes (5Y) may show gaps in simulated data'],
  },
  { code: 'GIP',   title: 'Intraday Chart',                cat: 'Charts', scoped: true, recipe: 'Chart',
    purpose: 'Intraday minute/tick chart with open reference line and OHLC crosshair.',
    inputs: 'Security required.',
    tiles: ['Intraday price line chart', 'Open price marker'],
    fields: ['PX_LAST','PX_OPEN'],
    drills: ['Click → GP (daily)', 'Shift+Click → new pane with GP'],
    keys: ['Hover → OHLC tooltip'],
    example: 'SPX Index GIP GO',
    related: ['GP','HP'],
    pitfalls: ['Intraday data is SIM-generated and refreshes each session'],
  },
  { code: 'FA',    title: 'Financial Analysis',             cat: 'Equity Reference', scoped: true, recipe: 'AnalyticsBoard',
    purpose: 'Three-tab financial statement viewer: Income Statement, Balance Sheet, Cash Flow.',
    inputs: 'Security (equity or corp) required.',
    tiles: ['Tab selector (IS / BS / CF)', 'Line-item table with multi-period columns'],
    fields: ['REVENUE','EBITDA','NET_INCOME','TOTAL_ASSETS','TOTAL_DEBT','FCF'],
    drills: ['Click line item → LINE for field lineage'],
    keys: ['Click IS/BS/CF tab → switch statement', '↑↓ navigate rows', 'Enter → drill field'],
    example: 'NVDA US FA GO',
    related: ['DES','HP','DVD','NOTES'],
    pitfalls: ['Figures are SIM unless marked LIVE. All periods are approximated.'],
  },
  { code: 'OWN',   title: 'Institutional Ownership',        cat: 'Equity Reference', scoped: true, recipe: 'ReferenceSheet',
    purpose: 'Ranked list of institutional holders with stake %, shares, and value. Shows recent changes.',
    inputs: 'Security (equity) required.',
    tiles: ['Holder ranking table', 'Stake concentration chart', 'Change in position column'],
    fields: ['HOLDER','STAKE_PCT','SHARES_M','VALUE_BN','CHG_M'],
    drills: ['Click holder row → CMPY dossier for that holder'],
    keys: ['↑↓ navigate', 'Click col → sort by stake/change'],
    example: 'MSFT US OWN GO',
    related: ['DES','MGMT','RELS','RELG'],
    pitfalls: ['Ownership data is SIM. Changes column shows simulated delta, not real 13F data.'],
  },
  { code: 'TOP',   title: 'Top News / News Hub',            cat: 'News', scoped: false, recipe: 'NewsHub',
    purpose: 'Global top news feed with headline tape, extracted entities, impacted tickers, and theme tags.',
    inputs: 'No security required (global); CN version requires security.',
    tiles: ['Headline tape', 'Theme tags', 'Impacted tickers list', 'Market snapshot strip'],
    fields: ['HEADLINE','SOURCE','ENTITY_TAGS','IMPACT_SCORE'],
    drills: ['Click headline → NTIM (news timeline)', 'Click ticker → DES', 'Click theme tag → THEME'],
    keys: ['↑↓ select headline', 'Enter → drill story', 'Right-click → context menu with "Open NREL"'],
    example: 'TOP GO  |  AAPL US CN GO',
    related: ['CN','N','NMAP','NREL','NTIM','SENT'],
    pitfalls: ['Headlines are SIM-generated with realistic structure. Not real news.'],
  },
  { code: 'ECO',   title: 'Economic Calendar',              cat: 'Macro', scoped: false, recipe: 'AnalyticsBoard',
    purpose: 'Upcoming macro releases with country, importance, consensus, prior, and actual (where released).',
    inputs: 'No security. Timeframe optional.',
    tiles: ['Calendar table (date, event, country, importance, consensus, prior, actual)', 'Surprise index strip'],
    fields: ['EVENT','COUNTRY','IMPORTANCE','CONSENSUS','PRIOR','ACTUAL','SURPRISE'],
    drills: ['Click event row → MACRO or CPI/NFP function', 'Click country → CTY dossier'],
    keys: ['↑↓ navigate', 'Enter → drill event'],
    example: 'ECO GO',
    related: ['WEI','TOP','CAL24','FXC','MACRO'],
    pitfalls: ['All releases are SIM placeholders with realistic metadata.'],
  },
  { code: 'FXC',   title: 'FX Cross Matrix',                cat: 'FX', scoped: false, recipe: 'MonitorTable',
    purpose: 'N×N matrix of spot FX rates for all major pairs.',
    inputs: 'No security required.',
    tiles: ['Cross-rate matrix table'],
    fields: ['FX_SPOT','PCT_CHG'],
    drills: ['Click cell → DES of that FX pair', 'Right-click → GP chart'],
    keys: ['Click row/col header → sort'],
    example: 'FXC GO',
    related: ['DES','GP','ECO','CORR+'],
    pitfalls: ['Matrix shows SIM rates. Not live interbank rates.'],
  },
  { code: 'MON',   title: 'Monitor / Watchlist',            cat: 'Monitors', scoped: false, recipe: 'MonitorTable',
    purpose: 'Streaming watchlist with custom columns from the Field Catalog. Supports multiple lists, sorting, filtering.',
    inputs: 'No security required (universe-scoped).',
    tiles: ['Symbol ticker column', 'Custom field columns (add via FLD)', 'Sort/filter bar', 'List selector tabs'],
    fields: ['PX_LAST','PCT_CHG','VOLUME','(user-defined columns)'],
    drills: ['Click row → DES', 'Click numeric cell → LINE lineage'],
    keys: ['Tab → switch watchlist', 'Alt+Click any cell → Inspector'],
    example: 'MON GO',
    related: ['MON+','FLD','ALRT+','ALRT','WS'],
    pitfalls: ['Custom columns persist to localStorage. Clear browser data to reset.', 'Symbol input requires full Bloomberg-style format: AAPL US Equity'],
  },
  { code: 'GEO',   title: 'Global Intelligence Map',        cat: 'Geo Intelligence', scoped: false, recipe: 'RelationshipBoard',
    purpose: 'Primary world map with clickable country tiles. Drill into news heat, company footprints, macro signals, and supply chain disruptions.',
    inputs: 'No security required.',
    tiles: ['Interactive world map (MapLibre GL)', 'Country detail panel', 'Region news strip', 'Active alerts overlay'],
    fields: ['NEWS_INTENSITY','MACRO_SIGNAL','RISK_SCORE'],
    drills: ['Click country → RGN dossier', 'Shift+Click → new pane', 'Right-click → GEO sub-functions'],
    keys: ['Click → drill region', 'Shift+Click → send to pane', 'Use GEO.N/C/R/M/X/S/E/F/A variants for specific overlays'],
    example: 'GEO GO',
    related: ['GEO.N','GEO.C','GEO.R','GEO.M','RGN','NMAP','SCN'],
    pitfalls: ['Requires MapLibre tile loading. Slow on first load.', 'GEO sub-functions (GEO.N etc.) work as separate mnemonics.'],
  },
  { code: 'RELG',  title: 'Relationship Graph',             cat: 'Relationships', scoped: true, recipe: 'RelationshipBoard',
    purpose: 'Visual relationship graph showing peer/supply-chain/ownership/correlation links for a security.',
    inputs: 'Security required.',
    tiles: ['Graph edge table', 'Evidence panel', 'Expand controls'],
    fields: ['REL_TYPE','STRENGTH','EVIDENCE'],
    drills: ['Click node → DES of related company', 'Click edge → EVID'],
    keys: ['Enter → expand selected node'],
    example: 'AAPL US RELG GO',
    related: ['RELT','EVID','PATH','SCN','CUST','OUT'],
    pitfalls: ['Graph edges are SIM-generated with realistic relationship types.'],
  },
  { code: 'WS',    title: 'Workspace Manager',              cat: 'Platform', scoped: false, recipe: 'OpsConsole',
    purpose: 'Save and restore complete workspace states including pane layouts, panel content, command histories, and pin strip.',
    inputs: 'No security required.',
    tiles: ['Saved workspaces list', 'Load/Save/Delete controls', 'Panel state preview'],
    fields: [],
    drills: ['Click workspace row → LOAD prompt'],
    keys: ['WS <name> GO → save/load by name', 'WS DEL <name> GO → delete'],
    example: 'WS GO  |  WS myworkspace GO  |  WS DEL myworkspace GO',
    related: ['DOCK','FLOAT','LAYOUT','SNAP','TRAIL'],
    pitfalls: ['Workspaces saved to localStorage. Clearing browser data deletes them.', 'WS:MARKET-WALL, WS:NEWSROOM, WS:RESEARCH, WS:TRADING → preset workspaces'],
  },
  { code: 'NAVTREE', title: 'Global Function Navigator',    cat: 'Platform', scoped: false, recipe: 'OpsConsole',
    purpose: 'Browse, filter, and launch all 2,949+ functions in the mnemonic catalog. Supports category filters, taxonomy groups, favorites, and recent lists.',
    inputs: 'No security required.',
    tiles: ['Full catalog table with search', 'Category filter dropdown', 'Favorites/Recent/Pinned filters', 'Taxonomy group count badge'],
    fields: ['CODE','TITLE','TAXONOMY','RELATED'],
    drills: ['Click any row → launch that function in focused pane'],
    keys: ['Type to filter → instant results', 'Category dropdown → filter by asset class', 'Favorites/Recent/Pinned filter tabs'],
    example: 'NAVTREE GO',
    related: ['TUTOR','PREF','KEYMAP','NX'],
    pitfalls: ['Shows up to 1800 results. Use search to narrow down.'],
  },
  { code: 'ALRT',  title: 'Alerts Monitor',                 cat: 'Monitors', scoped: false, recipe: 'MonitorTable',
    purpose: 'Live alert rules showing triggered vs inactive status. Drill into triggered alerts for evidence.',
    inputs: 'No security required.',
    tiles: ['Alert rules table (symbol, condition, triggered, created)'],
    fields: ['SYMBOL','CONDITION','TRIGGERED','CREATED'],
    drills: ['Click triggered alert → evidence trail'],
    keys: ['ALRT+ GO → advanced alert creation with field conditions'],
    example: 'ALRT GO',
    related: ['ALRT+','MON','MON+','NOTIF'],
    pitfalls: ['Alerts evaluate against simulated streaming data. May trigger unexpectedly on SIM data.'],
  },
  { code: 'FLD',   title: 'Field Catalog',                  cat: 'Data & Lineage', scoped: false, recipe: 'OpsConsole',
    purpose: 'Searchable catalog of all available data fields with definitions, units, cadence, and asset class availability.',
    inputs: 'No security required.',
    tiles: ['Field search table', 'Add to Monitor/Screener buttons', 'Chart and lineage drill actions'],
    fields: ['FIELD_ID','LABEL','DEFINITION','UNIT','TYPE','CADENCE','AVAILABILITY'],
    drills: ['Click field row → LINE lineage viewer', 'Add→MON → add field as monitor column'],
    keys: ['Type to search across all field metadata', 'Click Add→MON → appends column to active monitor'],
    example: 'FLD GO  |  FLD PE_RATIO GO',
    related: ['LINE','MAP','QLT','MON+'],
    pitfalls: ['Field IDs must match exactly for monitor columns. Use FLD search to find correct IDs.'],
  },
  { code: 'LINE',  title: 'Data Lineage Viewer',            cat: 'Data & Lineage', scoped: false, recipe: 'OpsConsole',
    purpose: 'Visual lineage trace for any field value: source → normalization → display. Shows SIM/LIVE provenance and freshness.',
    inputs: 'No security required. Activated by clicking numeric field values or via LINE <field_id> GO.',
    tiles: ['Lineage flow table (source, transforms, output)', 'Freshness badge', 'Provenance timeline'],
    fields: ['FIELD_ID','SOURCE','TRANSFORMS','FRESHNESS','AS_OF'],
    drills: ['Click source row → SRC data source manager'],
    keys: ['Click any numeric value in DES/WEI/HP → opens this panel automatically'],
    example: 'LINE GO  |  LINE PX_LAST GO',
    related: ['FLD','MAP','QLT','SRC'],
    pitfalls: ['Lineage is simulated. Transform steps are representative, not from live systems.'],
  },
  { code: 'TUTOR', title: 'Guided Tutorial',                cat: 'Platform', scoped: false, recipe: 'OpsConsole',
    purpose: 'Step-by-step walkthrough of the terminal. Three tracks: Core, Global Map, Platform.',
    inputs: 'No security required.',
    tiles: ['Step table (click to execute)', 'Track selector (CORE / MAP / PLATFORM)', 'Map stack quick-launch buttons'],
    fields: [],
    drills: ['Click any step row → opens that function immediately'],
    keys: ['Select CORE for basic workflow', 'Select MAP for geo intelligence track', 'Select PLATFORM for admin/OS track'],
    example: 'TUTOR GO  |  HELP GO',
    related: ['NAVTREE','PREF','KEYMAP','DOCS'],
    pitfalls: ['HELP GO and TUTOR GO both open the tutorial. Use F1 for panel-contextual help.'],
  },
  { code: 'PREF',  title: 'Preferences & Settings',         cat: 'Platform', scoped: false, recipe: 'OpsConsole',
    purpose: 'User settings panel: display density, layout mode, streaming mode, and advanced settings links.',
    inputs: 'No security required.',
    tiles: ['Density picker (Comfortable / Default / Compact)', 'Layout mode (Tile / Tab / Stack)', 'Live Mode / High Density toggles', 'Advanced settings quick-links'],
    fields: [],
    drills: ['Click advanced links → KEYMAP, LAYOUT, FLD, POLICY, ENT, AUD, API, SRC'],
    keys: ['Density changes persist to localStorage across sessions'],
    example: 'PREF GO',
    related: ['KEYMAP','GRIDCFG','THEMEPRO','FORMAT'],
    pitfalls: ['Density changes update token values but require reload to fully propagate to all components.'],
  },
  { code: 'ORD',   title: 'Order Ticket',                   cat: 'Trading', scoped: true, recipe: 'OpsConsole',
    purpose: 'Submit simulated buy/sell orders with quantity, type (MKT/LMT), and price.',
    inputs: 'Security required.',
    tiles: ['Order form (symbol, side, type, quantity, price)', 'Recent orders strip'],
    fields: ['SYMBOL','SIDE','ORDER_TYPE','QTY','PRICE'],
    drills: ['Click sent order → BLTR blotter'],
    keys: ['BUY/SELL toggle', 'MKT/LMT selector', 'Enter → submit order (respects KILL switch)'],
    example: 'AAPL US ORD GO',
    related: ['BLTR','TCA','VEN','IMP','KILL'],
    pitfalls: ['All orders are SIM-only. KILL switch disables order entry. Check COMP/POL if blocked.'],
  },
  { code: 'BLTR',  title: 'Order Blotter',                  cat: 'Trading', scoped: false, recipe: 'MonitorTable',
    purpose: 'Real-time streaming blotter of all submitted orders with status, fill info, and drill actions.',
    inputs: 'No security required.',
    tiles: ['Order stream table (symbol, side, type, qty, px, status, time)'],
    fields: ['SYMBOL','SIDE','QTY','FILL_PX','STATUS','TIMESTAMP'],
    drills: ['Click order row → TCA analysis', 'Click symbol → DES'],
    keys: ['KILL GO → activate kill switch', 'ALRT GO → set price alert on selected'],
    example: 'BLTR GO',
    related: ['ORD','TCA','VEN','KILL','ANR'],
    pitfalls: ['Blotter data is session-only (not persisted across reload). Export with EXP before closing.'],
  },
  { code: 'AUD',   title: 'Command Audit Log',              cat: 'Governance', scoped: false, recipe: 'OpsConsole',
    purpose: 'Chronological log of all user actions: GO commands, drills, alerts, exports, policy blocks.',
    inputs: 'No security required.',
    tiles: ['Audit log table (timestamp, panel, type, mnemonic, security, detail)', 'Filter by type'],
    fields: ['TS','PANEL_IDX','TYPE','MNEMONIC','SECURITY','DETAIL','ACTOR'],
    drills: ['Click row → replay that navigation in panel'],
    keys: ['Filter by type: GO, DRILL, ALERT_CREATE, EXPORT, POLICY_BLOCK, NAV_JUMP'],
    example: 'AUD GO',
    related: ['AUDIT','TRAIL','NAV','NAVG','COMP','POL'],
    pitfalls: ['Log persists in localStorage. Export before clearing browser data.'],
  },
  { code: 'STAT',  title: 'System Status',                  cat: 'Platform', scoped: false, recipe: 'OpsConsole',
    purpose: 'Feed health, streaming subsystem status, and system metrics dashboard.',
    inputs: 'No security required.',
    tiles: ['Subsystem status table (Quotes, News, Alerts, Audit)', 'Feed tick rate metrics'],
    fields: ['SUBSYSTEM','HEALTH','VALUE','DRILL_CODE'],
    drills: ['Click subsystem row → drill to that function (STAT → ALRT+, NEWS → TOP)'],
    keys: ['Click row → navigate to subsystem function'],
    example: 'STAT GO  |  STATUS GO',
    related: ['LAT','ERR','CACH','DIAG','OFFLINE'],
    pitfalls: ['Metrics are derived from simulated streaming. FPS/TPS depend on browser performance.'],
  },
];

function sanitizeMd(s) {
  return String(s ?? '')
    .replace(/<(\w+[^>]*)>/g, '`<$1>`')  // wrap <token> in backticks
    .replace(/\|/g, '&#124;');
}

function escape(s) { return sanitizeMd(String(s ?? '')); }

function writePage(relPath, content) {
  const full = join(SRC, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  console.log('  wrote', relPath);
}

function mnemonicPage(m) {
  const relatedLinks = (m.related ?? []).map(c => `[${c}](/mnemonics/${c.replace(/[^A-Za-z0-9_\-]/g, '_')})`).join('  ·  ');
  // Sanitize all text in the template
  const purpose = String(m.purpose).replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inputs = String(m.inputs).replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const tilesText = (m.tiles ?? []).map((t,i) => `${i+1}. **${String(t).replace(/</g,'&lt;').replace(/>/g,'&gt;')}**`).join('\n');
  const drillsText = (m.drills ?? []).map(d => `- ${String(d).replace(/</g,'&lt;').replace(/>/g,'&gt;')}`).join('\n');
  const keysText = (m.keys ?? []).map(k => `- ${String(k).replace(/</g,'&lt;').replace(/>/g,'&gt;')}`).join('\n');
  const example = String(m.example).replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const pitfallsText = (m.pitfalls ?? []).map(p => `- ⚠️ ${String(p).replace(/</g,'&lt;').replace(/>/g,'&gt;')}`).join('\n');
  const fieldsTable = (m.fields ?? []).length
    ? `| Field ID | Description |\n|---|---|\n${(m.fields ?? []).map(f => `| \`${f}\` | SIM-sourced ${f} value |`).join('\n')}`
    : '_No specific fields — navigational/administrative function._';
  
  return `# ${m.code} — ${m.title}

<span class="mnemonic-badge">${m.code}</span>
<span class="scope-badge">${m.scoped ? '🔒 Security Scoped' : '🌍 Global'}</span>
<span class="scope-badge">${m.recipe}</span>

## Purpose

${purpose}

## Inputs

${inputs}

## Screen Layout

${tilesText}

## Key Fields

${fieldsTable}

## Drill Paths

${drillsText}

## Keyboard Controls

${keysText}

## Opening Examples

\`\`\`
${example}
\`\`\`

## Common Pitfalls

${pitfallsText}

## Related Functions

${relatedLinks}

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
`;
}

function catalogSectionPage(cat, items) {
  const rows = items.map(m => {
    const scope = m.requiresSecurity ? '🔒' : '🌍';
    const link = `/mnemonics/${m.code.replace(/[^A-Za-z0-9_\-]/g, '_')}`;
    return `| [${escape(m.code)}](${link}) | ${escape(m.title)} | ${scope} | ${escape(m.functionType)} | ${escape(m.scope.replace(/_/g,'·'))} |`;
  }).join('\n');
  
  return `# ${cat} Function Catalog

**${items.length} functions** in this category.

| Code | Title | Scope | Type | Context |
|------|-------|-------|------|---------|
${rows}

---

Click any code to open its dedicated page (for top-40 hand-enhanced functions) or get the factory-rendered dense view.

::: tip Tip
Type any code directly in the command bar with GO to open it. Or use **NAVTREE GO** to browse visually.
:::
`;
}

// ── INDEX PAGE ───────────────────────────────────────────────────────────────
console.log('Generating index pages...');

writePage('index.md', `---
layout: home
hero:
  name: "MarketMind Terminal"
  text: "Professional Market Intelligence Platform"
  tagline: Complete user guide for 2,900+ functions, workflows, keyboard shortcuts, and data provenance.
  image:
    src: /logo-mm.svg
    alt: MarketMind Terminal
  actions:
    - theme: brand
      text: Quick Start (5 min)
      link: /guide/getting-started
    - theme: alt
      text: Mnemonic Reference
      link: /mnemonics/
    - theme: alt
      text: All Functions (NAVTREE)
      link: /mnemonics/by-category

features:
  - icon: 🚀
    title: 2,949 Functions
    details: From quick-start mnemonics to deep analytics, geo intelligence, and platform admin — all discoverable via HL search or NAVTREE.
  - icon: 🗺️
    title: Global Intelligence
    details: World map stack (GEO, GEO.N, GEO.C, GEO.R…), Region Dossiers, News Maps, Supply Chain Networks.
  - icon: ⌨️
    title: Keyboard-First
    details: Full Bloomberg-style keyboard model. Every action has a keyboard path. F2 MENU, F1 HELP, Ctrl+K search, Alt+1…9 pane focus.
  - icon: 🔍
    title: Infinite Drill
    details: Click, Shift+Click, Alt+Click, Right-click — every entity drills deeper. Inspector overlay. Lineage viewer. Evidence chains.
  - icon: 📊
    title: Dense & Readable
    details: Monospace terminal aesthetic with proper contrast, row hierarchy, provenance badges, and streaming flash updates.
  - icon: 🛡️
    title: Enterprise Grade
    details: Audit trail, policy engine, entitlements, compliance locks, offline mode, workspace snapshots.
---
`);

// ── GUIDE PAGES ──────────────────────────────────────────────────────────────
console.log('Generating guide pages...');

writePage('guide/getting-started.md', `# Quick Start — 5 Minutes to Productivity

MarketMind Terminal is a Bloomberg-style market intelligence workstation. This guide gets you from zero to productive in five minutes.

## Step 1: Load a Security

Type any of these in the **Global Command Bar** at the top of the screen, then press **Enter** or click **GO**:

\`\`\`
AAPL US DES GO          → Apple description screen
MSFT US HP GO           → Microsoft historical prices
EURUSD Curncy GP GO     → EUR/USD daily price chart
SPX Index WEI GO        → S&P 500 with world indices
\`\`\`

**Command grammar:**
\`\`\`
<TICKER> <MARKET> <MNEMONIC> GO
\`\`\`

| Part | Example | Meaning |
|------|---------|---------|
| TICKER | AAPL | The symbol |
| MARKET | US / Curncy / Index / Corp / Comdty | Asset class suffix |
| MNEMONIC | DES / HP / GP / FA | The function to run |
| GO | GO | Executes the command |

## Step 2: Navigate Within a Panel

Once a function is open:

| Action | How |
|--------|-----|
| Drill into a row | Click it or press **Enter** |
| Open in new pane | **Shift+Click** or **Shift+Enter** |
| Open Inspector overlay | **Alt+Click** or **Alt+Enter** |
| Context menu | **Right-click** |
| Go back | **Ctrl+B** |
| Go forward | **Ctrl+Shift+B** |

## Step 3: Discover Functions

| How to discover | What to do |
|----------------|-----------|
| **Ctrl+K** or type HL GO | Opens the unified search overlay — find anything |
| **F2** | Opens MENU with related functions for current panel |
| **NAVTREE GO** | Browse all 2,900+ functions with category filters |
| **TUTOR GO** or **F1** | Opens the guided tutorial |

## Step 4: Open Multiple Panes

\`\`\`
NP GO         → New tab pane
NP H GO       → Split horizontally
NP V GO       → Split vertically
Alt+1…Alt+9   → Focus pane 1–9
Ctrl+\`        → Cycle pane focus
\`\`\`

## Step 5: Save Your Work

\`\`\`
WS myworkspace GO     → Save current layout + panels as "myworkspace"
WS myworkspace GO     → Load it back (run again with same name)
WS DEL myworkspace GO → Delete a workspace
\`\`\`

## If Something Goes Wrong

- **Panel empty?** → Type any command + GO, or press **F2** for MENU suggestions
- **Lost?** → Press **Ctrl+K** to search, or type **TUTOR GO**  
- **Wrong security?** → Type the correct security + MNEMONIC GO
- **Back to home screen?** → Type **HOME GO**
- **Navigate history?** → **Ctrl+B** (back), **Ctrl+Shift+B** (forward)

## The 10 Most Useful Commands to Know First

\`\`\`
WEI GO              → World equity indices monitor
TOP GO              → Top news headlines
AAPL US DES GO      → Any ticker description
AAPL US GP GO       → Price chart
AAPL US HP GO       → Historical pricing table
ECO GO              → Economic calendar
IMAP GO             → Sector heatmap
MON GO              → Your monitor/watchlist
GEO GO              → Global intelligence map
NAVTREE GO          → Browse all 2,900+ functions
\`\`\`
`);

writePage('guide/terminal-os.md', `# Terminal OS — Workspace & Pane Model

## Architecture Overview

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│  SYSTEM STRIP         MM ● SIM  ET 14:23:01  GMT 19:23:01   │
│  GLOBAL COMMAND BAR   P1 > AAPL US DES GO          [GO]     │
├────────────────────────────────────────────┬────────────────┤
│  PANEL 1                    PANEL 2        │  PANEL 3       │
│  ┌──────────────────────────────────────┐  │  ┌──────────┐  │
│  │ P1  DES  AAPL US Equity  ● FOCUSED  │  │  │ P2  WEI  │  │
│  │ ◀ ▶  MENU  HELP  HL  RECENT  ★      │  │  │          │  │
│  │ EQUITY › US › AAPL US Equity › DES   │  │  │          │  │
│  │ Next: HP  GP  CN  OWN  FA  RELS      │  │  │          │  │
│  │──────────────────────────────────────│  │  └──────────┘  │
│  │                                      │  │                │
│  │  [PANEL CONTENT]                     │  │                │
│  │                                      │  │                │
│  │  P1 > AAPL US DES GO [GO]            │  │                │
│  └──────────────────────────────────────┘  │                │
└────────────────────────────────────────────┴────────────────┘
\`\`\`

## Panels (Panes)

Each **panel** (pane) is an independent terminal session with its own:
- Active security and mnemonic
- Navigation history (back/forward)
- Command line
- Overlay state (MENU, HELP, Inspector, Search)

### Panel Chrome (from top to bottom)

| Strip | Contents |
|-------|----------|
| **Header** | Panel # · Mnemonic · Security · SIM badge · FOCUSED indicator · pane controls |
| **Toolbar** | ◀▶ back/fwd · MENU · HELP · HL · GRAB · RECENT · ★ favorites · FOCUS+ |
| **Breadcrumb** | AssetClass › Region › Security › Mnemonic (each clickable) |
| **Next Actions** | 5–8 context-relevant function chips (keyboard navigable) |
| **Keyboard Hint** | Context-specific shortcuts for current mnemonic |
| **Command Line** | P1> input field · GO button |
| **Content area** | The function view + auto-fill blocks if view is short |

## Workspace Model

A **workspace** is a named snapshot of:
- The full docking tree (splits, tabs, sizes)
- All panel states (active mnemonic, security, history)
- Command histories
- Pin strip items

**Preset workspaces:**
\`\`\`
WS:MARKET-WALL GO    → 8-pane market wall layout
WS:NEWSROOM GO       → News-focused layout  
WS:RESEARCH GO       → Research workflow layout
WS:TRADING GO        → Trading/execution layout
\`\`\`

## Focus Model

- One panel is **focused** at a time (bright border + FOCUSED badge)
- **Alt+1…9** → jump to pane N
- **Ctrl+\`** → cycle through all panes
- **Ctrl+Shift+\`** → switch between workspace A and B (2-up mode)
- Clicking inside any panel transfers focus to it

## Docking Engine

\`\`\`
DOCK GO      → Manage pane engine (tile/tab/stack)
FLOAT GO     → Pop-out / floating pane manager
NP GO        → New tab pane
NP H GO      → Split current pane horizontally
NP V GO      → Split current pane vertically
DOCK → HD ON  → High Density mode
DOCK → LIVE:ON → High Density Live mode
\`\`\`
`);

writePage('guide/command-line.md', `# Command Line & GO Execution

## Global Command Bar

The **Global Command Bar** appears at the top of the screen (below the System Strip).  
It always reflects the **focused panel's** input and executes in that panel.

\`\`\`
Panel N > [input field]                    [GO]
\`\`\`

## Per-Panel Command Line

Each panel also has its own command line at the bottom of the panel chrome.  
Pressing **Ctrl+L** focuses it. The global bar and panel bar are synchronized.

## Command Grammar

\`\`\`
<SECURITY> <MNEMONIC> GO
\`\`\`

### Security Format

\`\`\`
<TICKER> <EXCHANGE>          → AAPL US
<TICKER> <EXCHANGE> <TYPE>   → AAPL US Equity (optional — auto-inferred)
<PAIR> <TYPE>                → EURUSD Curncy
<INDEX> <TYPE>               → SPX Index
<ISSUER> <TYPE>              → T US Corp
<COMMODITY>                  → CL1 Comdty
\`\`\`

### Mnemonic Only (global functions)

\`\`\`
WEI GO     → World equity indices
TOP GO     → Top news
ECO GO     → Economic calendar
GEO GO     → Global map
\`\`\`

### Timeframe Modifier

\`\`\`
AAPL US HP 1Y GO    → Historical prices, 1 year
AAPL US GP 5D GO    → Chart, 5 days
Valid: INTRADAY, 1D, 5D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, YTD, MAX
\`\`\`

### Special Commands

\`\`\`
MENU GO        → Open MENU overlay
HELP GO        → Open HELP / TUTOR
HL GO          → Open Search overlay (same as Ctrl+K)
GRAB GO        → Export panel snapshot to new tab
WS <name> GO   → Save or load workspace by name
WS DEL <name>  → Delete workspace
HD ON / OFF    → Toggle High Density mode
LIVE ON / OFF  → Toggle Live streaming mode
NP GO          → New pane (tab)
NP H GO        → Split horizontal
NP V GO        → Split vertical
WS:PRESET GO   → Apply workstation preset (MARKET-WALL, NEWSROOM, etc.)
\`\`\`

## Auto-Complete

As you type, a dropdown appears with:
- **Matching securities** (ticker, name)
- **Matching mnemonics** (code, title)

Navigate with **↑↓** · Select with **Enter** or **Tab** · Close with **Esc**

## Typo Correction

The command parser uses **Levenshtein distance** to find close-enough mnemonics.  
If you type **WEL** it resolves to **WEI**. If you type **DEES** it resolves to **DES**.

## Command History

- **↑** (when dropdown is closed) → browse previous commands
- **↓** → forward through history
- History persists in localStorage per panel

## Parse Rules

1. Tokens matching known mnemonics (or close-enough) → mnemonic
2. Tokens matching market sectors (EQUITY, CORP, CURNCY…) → sector
3. Timeframe tokens (1M, 3M…) → timeframe modifier
4. Remaining tokens → security name (auto-appended with Equity if no type given)
`);

writePage('guide/keyboard-reference.md', `# Complete Keyboard Reference

## Global Shortcuts (work everywhere)

| Key | Action |
|-----|--------|
| \`Ctrl+K\` | Open HL unified search overlay |
| \`Ctrl+L\` | Focus command line of focused panel |
| \`Ctrl+B\` | Navigate back in panel history |
| \`Ctrl+Shift+B\` | Navigate forward in panel history |
| \`Ctrl+\`\` | Cycle panel focus to next pane |
| \`Ctrl+Shift+\`\` | Switch active workspace (A/B in 2-up mode) |
| \`Alt+1\` | Focus pane 1 |
| \`Alt+2\` | Focus pane 2 |
| \`Alt+3\` | Focus pane 3 |
| \`Alt+4\` | Focus pane 4 |
| \`Alt+5…9\` | Focus panes 5–9 |
| \`F1\` | Help / Tutorial (double-tap = Help Desk) |
| \`F2\` | MENU overlay (related functions) |
| \`Esc\` | Close overlay / clear command input |
| \`Enter\` | Execute command / drill selected row |
| \`Shift+Enter\` | Send selection to new pane |
| \`Alt+Enter\` | Open Inspector overlay |

## Command Line Shortcuts

| Key | Action |
|-----|--------|
| \`↑\` | Previous command (history) |
| \`↓\` | Next command (history forward) |
| \`↑\` (dropdown open) | Previous suggestion |
| \`↓\` (dropdown open) | Next suggestion |
| \`Tab\` | Accept top autocomplete suggestion |
| \`Esc\` | Close autocomplete / clear input |

## In Tables / Lists

| Key | Action |
|-----|--------|
| \`↑ / ↓\` | Move row selection |
| \`Enter\` | Drill selected row (open in place) |
| \`Shift+Enter\` | Open selected row in new pane |
| \`Alt+Enter\` | Open Inspector for selected row's entity |
| \`F2\` | Context menu for selected row |
| \`F1\` | Help for current mnemonic |
| \`PageUp / PageDown\` | Scroll one viewport in table |

## Mouse Semantics (universal)

| Mouse Action | Behavior |
|-------------|----------|
| **Click** | Open entity in place (OPEN_IN_PLACE) |
| **Shift+Click** | Open entity in new pane (OPEN_IN_NEW_PANE) |
| **Alt+Click** | Open Inspector overlay (INSPECT_OVERLAY) |
| **Right-click** | Context menu |
| **Hover** | Highlight row + show tooltip |

## Context Menu Actions (right-click on entity)

| Action | Description |
|--------|-------------|
| Open | Open in current pane |
| Open in new pane | Send to next available pane |
| Inspect | Open Inspector overlay |
| Related functions | Open MENU related actions |
| Add to monitor | Add to current MON watchlist |
| Alert on field | Create alert rule for this entity |
| Copy ID | Copy entity ID to clipboard |

## Mnemonic-Specific Shortcuts

| Mnemonic | Specific keys |
|----------|--------------|
| **GP** | TF=1Y/5D/1M etc in command · Crosshair=OHLC on hover |
| **GIP** | Crosshair=OHLC · Open line marked |
| **FA** | Click IS/BS/CF tab to switch statements |
| **ORD** | BUY/SELL toggle · MKT/LMT type selector · KILL=cancel all |
| **HP** | Click column header to sort · PageDn for next page |
| **WEI** | Click column to sort · Enter=chart of selected |
| **FXC** | Click cell → DES of pair |
| **MON** | Tab between lists · Add symbol with input+Enter |
`);

writePage('guide/drill-intents.md', `# Drill Intents & Entity Model

## What Is an Entity?

Every visible data point in the terminal is an **EntityRef** — a typed, drillable object.

### EntityKind Types

| Kind | Examples | Opens in |
|------|----------|---------|
| \`SECURITY\` | AAPL US Equity | DES, HP, GP, FA |
| \`INDEX\` | SPX Index | DES, WEI, GP |
| \`FX\` | EURUSD Curncy | DES, GP, FXC |
| \`RATE\` | US10YT | GC, LINE |
| \`FUTURE\` | CL1 Comdty | DES, GP |
| \`OPTION\` | AAPL option | CHAIN, SURF |
| \`ETF\` | QQQ US Equity | DES, ETFM |
| \`COMPANY\` | Apple Inc | CMPY, RELG |
| \`SECTOR\` | Technology | SECT, IMAP |
| \`INDUSTRY\` | Semiconductors | INDY, SCN |
| \`COUNTRY\` | US, JP, DE | CTY, GEO |
| \`PERSON\` | CEO name | MGMT |
| \`HOLDER\` | Institutional holder | OWN |
| \`NEWS\` | Headline | NTIM, NREL |
| \`EVENT\` | Earnings, dividend | EVT |
| \`FIELD\` | PX_LAST, PE_RATIO | LINE, FLD |
| \`FUNCTION\` | DES, WEI, GP | Navigates to that function |
| \`MONITOR\` | Custom watchlist | MON |
| \`WORKSPACE\` | Saved workspace | WS |
| \`ALERT\` | Alert rule | ALRT |
| \`ORDER\` | Submitted order | BLTR |
| \`TRADE\` | Executed trade | BLTR |

## Drill Intents

| Intent | Trigger | Behavior |
|--------|---------|----------|
| \`OPEN_IN_PLACE\` | Click | Open entity in current pane, replacing current view |
| \`OPEN_IN_NEW_PANE\` | Shift+Click or Shift+Enter | Open entity in next available pane or create new one |
| \`INSPECT_OVERLAY\` | Alt+Click or Alt+Enter | Open Inspector overlay without navigating away |
| Context menu | Right-click | Show all available actions for entity |

## The Inspector Overlay

Opening the Inspector (Alt+Click) shows:
- **Header**: entity display name, kind, provenance (SIM/LIVE/STALE), last updated
- **Key fields**: dense key-value grid (each field is itself a FIELD entity, clickable → LINE)
- **Related entities**: list of associated entities (clickable → drill further)
- **Related functions**: relevant mnemonics for this entity type
- **Evidence**: source confidence chain

**Inspector history**: Use back/forward arrows within Inspector to navigate the inspect chain.  
**Pin**: Keep Inspector open while clicking elsewhere in the panel.

## Provenance Badges

| Badge | Meaning |
|-------|---------|
| \`SIM\` | Simulated data — realistic but not live market data |
| \`LIVE\` | Live-streamed value (when live mode enabled) |
| \`STALE\` | Value has exceeded its expected refresh cadence |
| \`CALC\` | Derived/calculated from other fields |
`);

writePage('guide/search.md', `# Unified Search — HL / Ctrl+K

## Opening Search

- **Ctrl+K** — from anywhere
- **HL GO** or **SEARCH GO** — from command line
- **HL button** in panel toolbar

## What You Can Search

| Category | Examples |
|---------|---------|
| **Functions** | DES, WEI, CHAIN, RELG — by code, title, keyword, synonym |
| **Securities** | AAPL, Apple, S&P, EURUSD |
| **Fields** | PX_LAST, PE_RATIO, dividend — by ID, label, definition |
| **Monitors** | Your saved watchlists |
| **Workspaces** | Your saved workspaces |
| **News** | Headline fragments |

## Category Filters

Use the **Category** dropdown to narrow function results:
\`ALL\` · \`EQUITY\` · \`FX\` · \`RATES\` · \`CREDIT\` · \`DERIVS\` · \`MACRO\` · \`PORTFOLIO\` · \`NEWS_DOCS\` · \`OPS_ADMIN\`

## Result Types

| Icon | Type |
|------|------|
| \`fn\` | Function / mnemonic |
| \`→\` | Security |
| \`fld\` | Field from field catalog |
| \`mon\` | Monitor |
| \`ws\` | Workspace |
| \`n\` | News item |

## Keyboard Navigation in Search

| Key | Action |
|-----|--------|
| **↑↓** | Move through results |
| **Enter** | Open in current pane |
| **Shift+Enter** | Open in new pane |
| **Alt+Enter** | Open Inspector |
| **Esc** | Close search |

## Search Tips

- Type **"div"** → finds DVD (Dividend History)
- Type **"ownership"** → finds OWN
- Type **"options chain"** → finds CHAIN
- Type **"country dossier"** → finds CTY variants
- Functions are ranked: exact code match → prefix match → title match → keyword match → synonym match
`);

writePage('guide/data-provenance.md', `# Data & Provenance

## Provenance Model

Every numeric value in the terminal carries provenance metadata:

\`\`\`
Value  →  Field ID  →  Source  →  As-Of timestamp  →  Freshness
\`\`\`

**Field lineage** shows:
1. **Source** — where the raw value came from (SIM feed, LIVE endpoint)
2. **Transforms** — normalization and guard steps applied
3. **Displayed** — the final formatted value shown in the UI

## SIM vs LIVE vs STALE

| Badge | Meaning |
|-------|---------|
| **SIM** | Simulated data generated by MarketMind's built-in simulator. Realistic ranges and patterns but not real market data. |
| **LIVE** | Real-time streaming value (when High Density Live Mode is enabled). Refreshes every tick. |
| **STALE** | Value's age exceeds the expected refresh cadence for that field type (e.g. a tick-frequency field last updated >60 seconds ago). |
| **CALC** | Derived by calculation from other fields. Not directly sourced. |

## Freshness Thresholds by Cadence

| Cadence | Stale after |
|---------|-------------|
| Tick | 60 seconds |
| Daily | 36 hours |
| Monthly | 45 days |
| Quarterly | 120 days |
| Static | 10 years |

## Accessing Lineage

1. **Click any numeric value** in DES, WEI, HP → opens LINE viewer for that field
2. **Alt+Click** → Inspector shows field provenance in FIELDS section
3. **FLD GO** → search field catalog, find field, click "Lineage" → LINE
4. **LINE <field_id> GO** → direct lineage for a specific field

## Field Catalog (FLD)

The Field Catalog lists all available data fields:
- **id** — unique field identifier (e.g. \`PX_LAST\`, \`PE_RATIO\`)
- **label** — human-readable name
- **definition** — what the field measures
- **unit** — currency, percentage, ratio, etc.
- **type** — scalar (single value) or series (time series)
- **cadence** — how often it updates
- **chartable** — whether GP/HP can plot it
- **availability** — which asset classes support it

## Error States

| State | Cause | Resolution |
|-------|-------|-----------|
| **STALE badge** | Value not refreshed within cadence | Check STAT for feed health; reload panel |
| **--** value | Field not available for this security | Try a different security or asset class |
| **ERR row** | Data error logged | Check ERR console for details |
| **Policy block** | Entitlement restriction | Check ENT/COMP/POL |
`);

writePage('guide/settings.md', `# Settings & Personalization

## Preferences Panel (PREF)

Open with: \`PREF GO\`

### Display Density

| Setting | Row Height | Font Size | Best For |
|---------|-----------|-----------|---------|
| **Comfortable** | 22px | 13px | Easier reading, larger screens |
| **Default** | 20px | 12px | Balanced (recommended) |
| **Compact** | 17px | 11px | Maximum density, Bloomberg-style |

Changes persist to \`localStorage\`.

### Layout Mode

| Mode | Description |
|------|-------------|
| **Tile** | Grid of resizable panes (default) |
| **Tab** | Tabbed panes in a single region |
| **Stack** | Vertically stacked panes |

### Streaming Mode

| Toggle | Effect |
|--------|--------|
| **Live Mode ON** | Increases streaming rate, fills panels with more data |
| **High Density ON** | Reduces row padding, shows more rows per panel |

## Workspace Save/Restore

\`\`\`
WS myname GO          → Save current state as "myname" (or load if exists)
WS DEL myname GO      → Delete workspace
WS GO                 → Open workspace manager (list all)
WS:MARKET-WALL GO     → Load preset: 8-pane market wall
WS:NEWSROOM GO        → Load preset: newsroom layout
WS:RESEARCH GO        → Load preset: research layout
WS:TRADING GO         → Load preset: trading layout
\`\`\`

**What a workspace saves:**
- Full pane docking tree (splits, tabs, sizes)
- Each panel's active mnemonic, security, timeframe
- Navigation history per panel
- Command history per panel
- Pin strip items
- Dock layout settings

## Keyboard Mapping (KEYMAP)

Open with: \`KEYMAP GO\`

View and save keyboard binding profiles. Current bindings are shown in a table.  
Click **SAVE** to persist profile. Click **RESET** to restore defaults.

## Export Settings

Open with: \`EXP GO\` or \`EXPCTR GO\`

- Panel snapshot exports (JSON) via **GRAB GO**
- Report builder via **RPT GO**
- Clip library via **CLIP GO**
- All exports are logged in the audit trail (AUD)

## Admin & Entitlements

| Function | Purpose |
|---------|---------|
| **ENT GO** | View and manage entitlement matrix |
| **COMP GO** | Compliance lock modes (normal / restricted / frozen) |
| **POL GO** | Policy rules engine (allow/block actions by role) |
| **POLICY GO** | Full policy rules block/allow interface |
| **ROLE GO** | Roles and permissions assignment |
| **ADMIN GO** | Admin console (users, roles, entitlements, policies) |
| **AUD GO** | Command audit log |
| **AUDIT GO** | Full audit trail with replay |
`);

writePage('guide/troubleshooting.md', `# Troubleshooting & FAQ

## "Why is a panel empty?"

Panels show the WakeUp screen (home panel) when no mnemonic has been set.  
**Solution:** Type any command + GO. E.g. \`WEI GO\` or \`AAPL US DES GO\`.

If a function shows "UNKNOWN MNEMONIC", the code is not in the catalog.  
**Solution:** Use Ctrl+K to search for similar functions, or browse NAVTREE GO.

## "Why is data showing SIM or STALE?"

All data in MarketMind Terminal is **simulated** (SIM) by design for the demo platform.  
STALE means the simulated value hasn't refreshed within its expected cadence.  
**Solution:** Enable **Live Mode** via PREF GO or the DOCK panel. Or reload the panel.

## "Why can't I access a function?"

A policy block prevents access. Check the **ERR console** for the block message.  
**Solution:**
1. \`COMP GO\` → check current compliance mode
2. \`POL GO\` → check policy rules  
3. \`ENT GO\` → check entitlements for your role

## "Why is my drill not working?"

If clicking a row does nothing:
- The row may not have an entity assigned (informational row)
- The function may be a stub (shows enterprise scaffold screen)

**Solution:** Right-click the row to see available context menu actions.  
Or **Alt+Click** to try the Inspector overlay on that row.

## "Why is there no data in my monitor?"

MON requires securities to be added manually.  
**Solution:** Type symbols in the add field (e.g. \`AAPL US Equity\`) and press Enter.  
Or use MON+ GO to use the Monitor Builder with custom field columns.

## "Why are workspaces not loading?"

Workspaces are stored in localStorage.  
**Solution:** Check that you're using the exact same workspace name.  
Type \`WS GO\` to see all saved workspaces and their dates.

## "Performance is slow / UI is janky"

1. Disable Live Mode: \`PREF GO\` → toggle off
2. Reduce pane count: close unused panes with ✕ button
3. Use Compact density: \`PREF GO\` → select Compact
4. Check diagnostics: \`DIAG GO\` — shows FPS and render time per pane

## "The map (GEO) isn't loading"

The global map requires MapLibre GL tile loading from external CDN.  
**Solution:** Check internet connection. First load may take 2–5 seconds.  
If tiles don't appear, the map still works — country overlays are rendered client-side.

## "KILL switch was triggered — can't place orders"

\`\`\`
KILL GO → view kill switch status
COMP GO → reset compliance mode
\`\`\`
Ensure compliance mode is set to "normal" in COMP panel.

## Error Reference

| Error Type | Meaning |
|-----------|---------|
| \`PARSER\` | Command could not be parsed. Use format: TICKER MARKET MNEMONIC GO |
| \`POLICY\` | Action blocked by policy rule. Check COMP/POL |
| \`STORAGE\` | localStorage operation failed. Check browser quota |
| \`POLICY_BLOCK\` | Specific action blocked for your role. Check ENT |
`);

writePage('guide/glossary.md', `# Glossary

| Term | Definition |
|------|-----------|
| **Mnemonic** | A short code (2–6 characters) that identifies a terminal function. E.g. \`DES\`, \`WEI\`, \`GP\`. |
| **GO** | The command execution keyword. Append to any command to execute it. |
| **HL** | "Help & Lookup" — the unified search overlay (Ctrl+K). |
| **Entity** | Any typed, drillable data object in the terminal (security, field, news, holder, etc.). |
| **Drill** | Navigate from one entity/view to a deeper related view. |
| **Pane** | An individual panel window within the workspace. |
| **Workspace** | A named snapshot of the full layout and panel states. |
| **Provenance** | The origin and freshness metadata for a data value (SIM/LIVE/STALE). |
| **SIM** | Simulated data generated by the built-in market simulator. |
| **LIVE** | Real-time streaming data (when live mode is active). |
| **STALE** | Data that has exceeded its expected refresh cadence. |
| **Inspector** | The panel-local overlay showing deep metadata for any entity (Alt+Click). |
| **Monitor** | A user-defined streaming watchlist table (MON). |
| **B-PIPE** | "Bloomberg Pipe" — MarketMind's internal simulated data feed. |
| **MENU** | The F2 overlay showing related functions, next actions, and secondary tools for the current panel. |
| **Next Actions** | A strip of 5–8 context-relevant function chips shown in each panel. |
| **Lineage** | The data flow trace from source to display for a specific field value. |
| **Field Catalog** | Registry of all available data fields with metadata (FLD). |
| **Kill Switch** | Emergency stop for order entry (KILL GO). |
| **Policy** | Access control rule that allows or blocks specific actions by role. |
| **Entitlement** | Permission granted to a user role to access specific functions or data. |
| **Breadcrumb** | The AssetClass › Region › Security › Mnemonic navigation trail in each panel. |
| **Tile** | A sub-section of a composite view (e.g. "Key Fundamentals tile" within DES). |
| **Recipe** | The layout template used by the FunctionFactory to render a mnemonic view. |
| **FCAT** | Function Catalog — the taxonomy grouping of all 2,949 mnemonics. |
`);

writePage('guide/feature-inventory.md', `# Feature Inventory

Auto-generated from live code — current as of build time.

## Hand-Built Mnemonics (FUNCTION_MAP)

These mnemonics have dedicated, bespoke React implementations:

| Code | Title | Scoped | File |
|------|-------|--------|------|
| WEI | World Equity Indices | Global | FnWEI |
| DES | Security Description | Security | FnDES |
| HP | Historical Pricing | Security | FnHP |
| GP | Price Chart | Security | FnGP |
| GIP | Intraday Chart | Security | FnGP |
| FA | Financial Analysis | Security | FnFA |
| OWN | Ownership | Security | FnOWN |
| RELS | Related Securities | Security | FnRELS |
| CN | Company News | Security | FnTOP/FnCN |
| DVD | Dividend History | Security | FnDVD |
| MGMT | Management | Security | FnMGMT |
| EVT | Corporate Events | Security | FnEVT |
| TOP | Top News | Global | FnTOP |
| ECO | Economic Calendar | Global | FnECO |
| FXC | FX Cross Matrix | Global | FnFXC |
| IMAP | Sector Heatmap | Global | FnIMAP |
| GC | Yield Curve | Global | FnGC |
| RV | Relative Value | Security | FnRV |
| MKT | Market Context | Global | FnMKT |
| MON | Monitor / Watchlist | Global | FnMON |
| WS | Workspace Manager | Global | FnMON/FnWS |
| ALRT | Alerts Monitor | Global | FnALRT |
| BLTR | Blotter | Global | FnBLTR |
| ORD | Order Ticket | Security | FnORD |
| IB | Instant Bloomberg | Global | FnIB |
| ANR | Analytics Runtime | Global | AnalyticsMonitor |
| NOTES | Security Notes | Security | FnNOTES |
| AUD | Audit Log | Global | FnAUD |
| STAT | System Status | Global | FnSTAT |
| LAT | Latency Monitor | Global | FnLAT |
| CACH | Cache & Offline | Global | FnCACH |
| ERR | Error Console | Global | FnERR |
| ENT | Entitlements | Global | FnENT |
| COMP | Compliance | Global | FnCOMP |
| POL | Policy Rules | Global | FnPOL |
| LINE | Data Lineage | Global | FnLINE |
| FLD | Field Catalog | Global | FnFLD |
| MAP | Field Mapping | Global | FnMAP |
| QLT | Data Quality | Global | FnQLT |
| COLS | Column Sets | Global | FnCOLS |
| PIN | Pinboard | Global | FnPIN |
| NAV | Navigation Graph | Global | FnNAV |
| NX | Next Best Actions | Global | FnNX |
| GEO | Global Map | Global | FnGeoMapIntel |
| RELG | Relationship Graph | Security | FnRelationshipIntel |
| RELT | Relationship Table | Security | FnRelationshipIntel |
| RGN | Region Dossier | Global | FnRegionNewsIntel |
| SCN | Supply Chain Network | Security | FnSupplyDriverIntel |
| NAVTREE | Function Navigator | Global | FnPlatformOS |
| DOCK | Docking Engine | Global | FnPlatformOS |
| PREF | Preferences | Global | FnPlatformOS |
| TUTOR | Tutorial | Global | FnPlatformOS |
| KEYMAP | Keymap Editor | Global | FnPlatformOS |
| ALRT+ | Advanced Alerts | Global | FnPlatformOS |
| MON+ | Monitor Builder | Global | FnPlatformOS |
| ADMIN | Admin Console | Global | FnPlatformOS |
| STATUS | System Status | Global | FnPlatformOS |
| DIAG | Diagnostics | Global | FnPlatformOS |
| OFFLINE | Offline Mode | Global | FnPlatformOS |

## Catalog-Generated Mnemonics (FunctionFactory)

All remaining codes route to **FnFactoryMnemonic** which renders based on catalog recipe:

| Category | Count | Recipe |
|----------|-------|--------|
| EQUITY | 520 | ReferenceSheet |
| FX | 240 | MonitorTable / VolBoard |
| RATES | 240 | CurveBoard |
| CREDIT | 240 | AnalyticsBoard |
| DERIVS | 540 | VolBoard |
| MACRO | 220 | AnalyticsBoard |
| PORTFOLIO | 240 | PortfolioBoard |
| NEWS_DOCS | 220 | NewsHub |
| OPS_ADMIN | 180 | OpsConsole |
| **Total** | **2,949** | |

## Entity Types (22)

SECURITY · INDEX · FX · RATE · FUTURE · OPTION · ETF · COMPANY · SECTOR · INDUSTRY · COUNTRY · PERSON · HOLDER · NEWS · EVENT · FIELD · FUNCTION · MONITOR · WORKSPACE · ALERT · ORDER · TRADE

## Recipe Types (10)

MonitorTable · ReferenceSheet · AnalyticsBoard · Screener · CurveBoard · VolBoard · NewsHub · RelationshipBoard · OpsConsole · PortfolioBoard

## MnemonicCategory Types (9)

EQUITY · FX · RATES · CREDIT · DERIVS · MACRO · PORTFOLIO · NEWS_DOCS · OPS_ADMIN

## Function Scope Types (5)

SECURITY_SCOPED · UNIVERSE_SCOPED · REGION_SCOPED · CROSS_ASSET · PORTFOLIO_SCOPED
`);

// ── WORKFLOW PAGES ──────────────────────────────────────────────────────────
console.log('Generating workflow pages...');

writePage('workflows/research-ticker.md', `# Workflow: Research a Ticker

## Goal

Build a complete picture of a security: fundamentals, financials, price history, ownership, news, events, and peer context.

## Complete Step-by-Step

\`\`\`
Step 1:  AAPL US DES GO         → Open description screen (fundamentals overview)
Step 2:  AAPL US CN GO          → Company news (what's driving the stock today)
Step 3:  AAPL US HP 1Y GO       → One-year price history (OHLCV table)
Step 4:  AAPL US GP GO          → Price chart (visual candlestick/line)
Step 5:  AAPL US FA GO          → Financial analysis (IS/BS/CF)
Step 6:  AAPL US RELS GO        → Related securities (peers, comps)
Step 7:  AAPL US OWN GO         → Institutional ownership
Step 8:  AAPL US EVT GO         → Corporate events (earnings, dividends, splits)
Step 9:  AAPL US MGMT GO        → Management team
Step 10: AAPL US DVD GO         → Dividend history
\`\`\`

## Keyboard-Only Path

1. Type \`AAPL US DES GO\` + **Enter**
2. Press **F2** → MENU shows: HP · GP · CN · OWN · RELS · FA
3. Press **Enter** on HP → jumps to Historical Pricing
4. **Ctrl+B** → back to DES
5. **Shift+Enter** on CN in next actions → opens CN in new pane
6. **Alt+Click** any fundamental value → Inspector with lineage
7. **Ctrl+B** again → return to DES

## Multi-Pane Research Setup

\`\`\`
Pane 1: AAPL US DES GO
Pane 2: AAPL US GP GO      (NP GO to create, then Shift+Enter from DES)
Pane 3: AAPL US CN GO      (NP GO again)
Pane 4: AAPL US OWN GO     (NP GO)
\`\`\`

Or load the Research preset: \`WS:RESEARCH GO\`

## Related Functions

DES · HP · GP · GIP · FA · OWN · RELS · CN · DVD · EVT · MGMT · NOTES · RELG · CMPY · SUPP

## Pitfalls

- **DES requires security**: Always include market suffix (AAPL US, not just AAPL)
- **FA tabs**: Click IS / BS / CF to switch statement types
- **OWN is institutional only**: Individual holders not shown in SIM data
- **RELS uses sector correlation**: Peers are algorithmically determined, not curated
`);

writePage('workflows/build-monitor.md', `# Workflow: Build a Monitor

## Goal

Create a streaming watchlist with custom columns for your specific universe.

## Step-by-Step

\`\`\`
Step 1: MON GO                  → Open Monitor / Watchlist
Step 2: Type symbol + Enter     → Add AAPL US Equity, MSFT US Equity, etc.
Step 3: MON+ GO                 → Advanced Monitor Builder (custom columns)
Step 4: FLD GO                  → Find fields to add as columns
                                  (e.g. PE_RATIO, BETA, VOL_30D)
Step 5: Click "Add→MON"         → Adds field as column to active monitor
Step 6: ALRT+ GO                → Set field-based alerts
Step 7: WS mymonitor GO         → Save this monitor as a workspace
\`\`\`

## MON+ — Advanced Monitor Builder

Open \`MON+ GO\`:
- **Symbol input**: comma-separated list of full symbols
- **Field filter**: type to search available fields
- Columns auto-populate from selected field IDs
- **SAVE button**: persists symbols list to localStorage

## Adding Custom Columns via FLD

1. \`FLD GO\` → Search for the field you want (e.g. "dividend yield")
2. Click the **Add→MON** button in the FLD row
3. Return to \`MON GO\` — new column appears automatically

## Setting Alerts from Monitor

From any row in MON:
1. **Right-click** → "Alert on field"
2. Or use \`ALRT+ GO\` directly:
   - Symbol input
   - Field selector (dropdown from FLD catalog)
   - Operator (>, <)
   - Threshold value
   - **CREATE** button

## Keyboard in MON

| Action | Key |
|--------|-----|
| Add symbol | Type in input + Enter |
| Create new list | Click "New List" button |
| Sort by column | Click column header |
| Filter | Type in filter box |
| Switch list | Click list tab |

## Pitfalls

- Symbols must be in Bloomberg format: \`AAPL US Equity\` not just \`AAPL\`
- Custom columns from FLD persist in localStorage per list
- Max 80 symbols in standard mode, 160 in High Density Live Mode
`);

writePage('workflows/alerts.md', `# Workflow: Set & Manage Alerts

## Goal

Configure threshold alerts on any field so you're notified when market conditions change.

## Step-by-Step

\`\`\`
Step 1: ALRT+ GO                → Open Advanced Alerts panel
Step 2: Enter symbol            → e.g. AAPL US Equity
Step 3: Select field            → e.g. PX_LAST
Step 4: Set operator            → > or <
Step 5: Set threshold value     → e.g. 200
Step 6: Click CREATE            → Alert rule is created
Step 7: ALRT GO                 → View all rules + triggered status
Step 8: NOTIF GO                → Notification center for routing
\`\`\`

## Alert Anatomy

\`\`\`
ALERT IF <SYMBOL> <FIELD> <OP> <VALUE>
e.g.: ALERT IF AAPL US Equity PX_LAST > 200
\`\`\`

## Viewing Triggered Alerts

- **ALRT GO** → all rules with triggered/active status
- **System Strip** top bar shows: \`⚠ 2 Alerts\` when triggered
- **ALRT** count in System Strip is clickable → navigates to ALRT panel

## Alert Routing

\`NOTIF GO\` → set routing rules (email, webhook, sound, in-panel badge)  
\`ROUTE GO\` → configure notification routing rules  
\`WEBHOOK GO\` → configure webhook targets for alert events

## Pitfalls

- Alerts evaluate against **simulated streaming data** — may trigger on SIM fluctuations
- Policy blocks (\`ALRT_CREATE\`) prevent creation if user role doesn't have permission
- Check \`ENT GO\` / \`COMP GO\` if creation is blocked
`);

writePage('workflows/orders.md', `# Workflow: Orders & Blotter

## Goal

Submit and track simulated orders, review execution quality.

## Step-by-Step

\`\`\`
Step 1: AAPL US ORD GO          → Open order ticket for AAPL
Step 2: Set BUY or SELL         → Toggle side
Step 3: Set MKT or LMT          → Order type
Step 4: Set quantity            → e.g. 100
Step 5: Set limit price         → (for LMT orders only)
Step 6: Press Enter or SUBMIT   → Submit order
Step 7: BLTR GO                 → View order blotter
Step 8: TCA GO                  → Transaction cost analysis
\`\`\`

## Kill Switch

If you need to halt all order entry immediately:
\`\`\`
KILL GO     → Activate kill switch (disables ORD entry)
COMP GO     → Reset compliance mode to normal
\`\`\`

## Reviewing Execution

| Function | Purpose |
|---------|---------|
| **BLTR** | Streaming order blotter with fill details |
| **TCA** | Transaction cost analysis (slippage, fill rate) |
| **VEN** | Venue map (which execution venue) |
| **IMP** | Market impact model for the order |
| **ANR** | Analytics runtime narrative |

## Pitfalls

- All orders are **simulation only** — no real market connectivity
- KILL switch state persists until reset via COMP
- BLTR data is **session-only** — export with \`GRAB GO\` before reload
`);

writePage('workflows/macro-to-ticker.md', `# Workflow: Macro Context to Ticker Impact

## Goal

Build a research chain from global macro signals down to specific ticker impacts.

## Step-by-Step Chain

\`\`\`
Step 1: WEI GO       → Start at world equity indices (macro overview)
Step 2: IMAP GO      → Sector heatmap (which sectors are moving)
Step 3: FXC GO       → FX cross matrix (currency drivers)
Step 4: ECO GO       → Economic calendar (what releases are upcoming)
Step 5: GC GO        → Yield curve (rates environment)
Step 6: XAS GO       → Cross-asset spread board (risk premium)
Step 7: GEO GO       → Global map (geographic signal)
Step 8: XDRV GO      → Cross-driver dashboard (factor attribution for a security)
Step 9: RV GO        → Relative value vs benchmark
Step 10: RELG GO     → Relationship graph (peer/supply chain transmission)
\`\`\`

## Key Connections

\`\`\`
Macro signal     →  Sector impact  →  Ticker impact
ECO release      →  IMAP sector    →  RELS peers
FX move (FXC)    →  XAS spread     →  DES security
Geo event (GEO)  →  RGN macro      →  SCN supply chain
\`\`\`

## Multi-Pane Setup for Macro Research

\`\`\`
WS:MACRO GO          → Load macro preset (WEI, ECO, GEO.M, XAS, REGI, NQ)
\`\`\`

Or manual:
\`\`\`
Pane 1: WEI GO
Pane 2: ECO GO
Pane 3: IMAP GO
Pane 4: GEO.M GO
\`\`\`

## Related Functions

WEI · IMAP · FXC · GC · ECO · XAS · CORR+ · GEO · GEO.M · XDRV · REGI · BETA.X · RELG · RELT · SHCK · REG
`);

writePage('workflows/global-map.md', `# Workflow: Global Map Intelligence

## The Map Stack

MarketMind Terminal has 10 geo-intelligence functions accessible via the GEO family:

| Code | Title | Opens |
|------|-------|-------|
| **GEO** | Global Intelligence Map | Primary world map — click any country |
| **GEO.N** | Geo News Heat | News intensity overlay by region |
| **GEO.C** | Company Footprint Map | Facility locations + exposure |
| **GEO.R** | Regional Risk Map | Risk score overlay |
| **GEO.M** | Macro Map | Macro signal overlay by country |
| **GEO.X** | Cross-Border Exposure | Cross-border risk map |
| **GEO.S** | Supply Chain Disruption Map | Supply chain risk geography |
| **GEO.E** | Energy & Commodities Map | Energy/commodity production geography |
| **GEO.F** | Freight & Shipping Lanes | Freight route disruption overlay |
| **GEO.A** | Alerted Regions | Regions with active alerts |

## Complete Map Workflow

\`\`\`
Step 1:  GEO GO          → Primary world map, click any country
Step 2:  RGN GO          → Region dossier for clicked country
Step 3:  GEO.N GO        → News intensity — where are stories originating?
Step 4:  NMAP GO         → News map overlay (stories plotted on map)
Step 5:  GEO.R GO        → Risk map (geopolitical/economic risk scores)
Step 6:  GEO.M GO        → Macro signals by country
Step 7:  AAPL US GEO.C GO → Company facility footprint
Step 8:  AAPL US SCN GO  → Supply chain network
Step 9:  GEO.S GO        → Supply chain disruption map
Step 10: SHOCK.G GO      → Geo shock simulator (test regional disruptions)
\`\`\`

## Region Dossier Drill-Down

From **RGN GO**, drill into:
- **RGN.C** → Companies in region
- **RGN.N** → Regional news center
- **RGN.M** → Regional macro monitor
- **RGN.R** → Regional risk register

## From Map to Ticker

\`\`\`
GEO → click US → RGN.C (US companies) → click AAPL → DES
GEO.S → supply disruption signal → SCN → AAPL US SCN → CUST (customers)
\`\`\`

## Pitfalls

- MapLibre requires tile loading from CDN (first load ~2–5 seconds)
- GEO sub-functions work as standalone mnemonics — type them directly
- Country overlays are rendered client-side even without tiles
- NMAP and GEO.N show simulated news intensity, not real geographic data
`);

// ── MNEMONIC PAGES ──────────────────────────────────────────────────────────
console.log('Generating core mnemonic pages...');

for (const m of CORE_MNEMONICS) {
  const safeName = m.code.replace(/[^A-Za-z0-9_\-]/g, '_');
  writePage(`mnemonics/${safeName}.md`, mnemonicPage(m));
}

// ── MNEMONIC INDEX ───────────────────────────────────────────────────────────
console.log('Generating mnemonic index...');

const allSorted = [...ALL_CATALOG].sort((a, b) => a.code.localeCompare(b.code));
const HAND_BUILT_PAGES = new Set(['WEI','DES','HP','GP','GIP','FA','OWN','TOP','ECO','FXC','MON','GEO','RELG','WS','NAVTREE','ALRT','FLD','LINE','TUTOR','PREF','ORD','BLTR','AUD','STAT','CN','DVD','EVT','MGMT','NOTES','IMAP','MKT','PORT']);
const indexRows = allSorted.map(m => {
  const safeName = m.code.replace(/[^A-Za-z0-9_\-]/g, '_');
  const scope = m.requiresSecurity ? '🔒' : '🌍';
  const codeCell = HAND_BUILT_PAGES.has(m.code) ? `[${escape(m.code)}](/mnemonics/${safeName})` : `\`${escape(m.code)}\``;
  return `| ${codeCell} | ${escape(m.title)} | ${escape(m.category)} | ${scope} | ${escape(m.functionType)} |`;
});

writePage('mnemonics/index.md', `# Mnemonic Reference — All Functions

**${ALL_CATALOG.length} total functions** — searchable by code, title, category, keyword.

::: tip Search
Use **Ctrl+K** to search this guide. Or use **NAVTREE GO** in the terminal to browse and launch any function.
:::

## Complete Index (A–Z)

| Code | Title | Category | Scope | Type |
|------|-------|----------|-------|------|
${indexRows.join('\n')}
`);

// ── BY CATEGORY PAGE ────────────────────────────────────────────────────────
const byCat = {};
for (const m of ALL_CATALOG) {
  if (!byCat[m.category]) byCat[m.category] = [];
  byCat[m.category].push(m);
}

const CAT_SLUG = {
  EQUITY: 'equity', FX: 'fx', RATES: 'rates', CREDIT: 'credit',
  DERIVS: 'derivs', MACRO: 'macro', PORTFOLIO: 'portfolio',
  NEWS_DOCS: 'news', OPS_ADMIN: 'ops',
};

writePage('mnemonics/by-category.md', `# Functions by Category

${Object.entries(byCat).map(([cat, items]) => `
## ${cat} (${items.length})

${items.slice(0, 20).map(m => `\`${escape(m.code)}\` `).join(' ')}${items.length > 20 ? ` ... and ${items.length - 20} more → [Full ${cat} list](/mnemonics/catalog-${(CAT_SLUG[cat] ?? cat.toLowerCase().replace(/_/g,'-'))})` : ''}
`).join('\n')}
`);

// ── CATALOG SECTION PAGES ───────────────────────────────────────────────────

for (const [cat, items] of Object.entries(byCat)) {
  const slug = CAT_SLUG[cat] ?? cat.toLowerCase();
  writePage(`mnemonics/catalog-${slug}.md`, catalogSectionPage(cat, items));
}

// ── STUB PAGES FOR REMAINING CORE CODES ─────────────────────────────────────
const CORE_CODES = new Set(CORE_MNEMONICS.map(m => m.code));
const EXTRA_CODES = [
  'GIP','FA','OWN','CN','DVD','EVT','MGMT','NOTES','IMAP','FXC','ECO','MKT',
  'ALRT','BLTR','ORD','WS','MON','MON_PLUS','ALRT_PLUS','AUD','STAT','FLD',
  'LINE','RELG','PORT','NAVTREE','PREF','TUTOR',
];
for (const code of EXTRA_CODES) {
  const safe = code.replace(/[^A-Za-z0-9_\-]/g, '_');
  const cat = ALL_CATALOG.find(m => m.code === code || m.code === code.replace('_PLUS', '+'));
  if (!CORE_CODES.has(code) && !existsSync(join(SRC, `mnemonics/${safe}.md`))) {
    const title = cat?.title ?? code;
    writePage(`mnemonics/${safe}.md`, `# ${code} — ${title}

${cat ? `**Category:** ${cat.category} · **Type:** ${cat.functionType} · **Scope:** ${cat.scope}` : ''}

## Purpose

${cat?.helpMarkdown?.split('\n').slice(0,4).join('\n') ?? `${title} — see full description in the app via \`${code} GO\` then **F1**.`}

## Opening

\`\`\`
${code} GO${cat?.requiresSecurity ? '\n<SECURITY> ' + code + ' GO' : ''}
\`\`\`

## Related Functions

${(cat?.relatedCodes ?? []).map(c => `[\`${c}\`](/mnemonics/${c.replace(/[^A-Za-z0-9_\-]/g,'_')})`).join('  ·  ')}

::: tip
Press **F1** inside the terminal while on \`${code}\` for contextual help.
Press **F2** to see the full related-function MENU.
:::
`);
  }
}

console.log('\n✅ Content generation complete!');
console.log(`   ${ALL_CATALOG.length} catalog mnemonics indexed`);
console.log(`   ${CORE_MNEMONICS.length} core mnemonic pages with full narrative`);
console.log(`   Pages written to docs/user-guide/src/`);
