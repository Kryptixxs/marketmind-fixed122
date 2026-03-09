#!/usr/bin/env node
/**
 * Generates a single self-contained HTML user guide at public/user-guide/index.html
 * that works offline and is downloadable from the app.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT = join(ROOT, 'public/user-guide/index.html');

mkdirSync(join(ROOT, 'public/user-guide'), { recursive: true });

// Import catalog
const catalogPath = join(ROOT, 'src/features/terminal-next/mnemonics/catalog.ts');
const { listCatalogMnemonics } = await import(`file:///${catalogPath.replace(/\\/g, '/')}`);
const ALL = listCatalogMnemonics();
const FUNCTION_COUNT = ALL.length.toLocaleString('en-US');

const CORE_MNEMONICS = [
  { code: 'WEI',     title: 'World Equity Indices',         cat: 'Market Monitors',  scoped: false,
    purpose: 'Real-time overview of all global equity indices. Shows level, change, %change, YTD, and region tags.',
    example: 'WEI GO',  related: 'IMAP · TOP · ECO · FXC · RFCM · GMOV',
    tips: ['Click any index row → opens DES for that index', 'Column header click → sort', 'Shift+Click → opens in a new pane'] },
  { code: 'DES',     title: 'Security Description',         cat: 'Equity Reference', scoped: true,
    purpose: 'Comprehensive reference sheet: fundamentals (P/E, EPS, Div Yield, Market Cap, Beta), trading stats, business summary, peers, ownership, and events.',
    example: 'AAPL US DES GO',  related: 'HP · FA · OWN · CN · EVT · RELS · MGMT · DVD',
    tips: ['Always include market suffix: AAPL US not just AAPL', 'Alt+Click any numeric value → Inspector with field lineage', 'F2 → MENU shows all related functions'] },
  { code: 'HP',      title: 'Historical Pricing',           cat: 'Equity Reference', scoped: true,
    purpose: 'Day-by-day OHLCV table. Sortable columns. Supports 1M, 3M, 1Y, 5Y timeframes.',
    example: 'MSFT US HP GO  |  MSFT US HP 1Y GO',  related: 'GP · GIP · DES · DVD',
    tips: ['Add timeframe: AAPL US HP 1Y GO', 'PageDown → next page', 'Click column header → sort'] },
  { code: 'GP',      title: 'Price Chart',                  cat: 'Charts',           scoped: true,
    purpose: 'Canvas candlestick/line chart with volume bars, OHLC crosshair, and related ticker chips.',
    example: 'AAPL US GP GO  |  EURUSD Curncy GP 1Y GO',  related: 'GIP · HP · RV · DES',
    tips: ['Hover over chart → shows OHLC values', 'Click ticker chip → opens GP for that ticker', 'Add timeframe: 5D, 1M, 3M, 1Y, 5Y'] },
  { code: 'FA',      title: 'Financial Analysis',           cat: 'Equity Reference', scoped: true,
    purpose: 'Three-tab financial statements viewer: Income Statement, Balance Sheet, Cash Flow. Multi-period columns.',
    example: 'NVDA US FA GO',  related: 'DES · HP · DVD',
    tips: ['Click IS / BS / CF tabs to switch statements', 'Click any line item value → LINE lineage viewer'] },
  { code: 'OWN',     title: 'Institutional Ownership',      cat: 'Equity Reference', scoped: true,
    purpose: 'Ranked institutional holders with stake %, shares held, value, and recent changes.',
    example: 'MSFT US OWN GO',  related: 'DES · MGMT · RELS · RELG',
    tips: ['Click holder row → CMPY dossier for that institution', 'Stake % and changes are SIM-sourced'] },
  { code: 'TOP',     title: 'Top News / News Hub',          cat: 'News',             scoped: false,
    purpose: 'Global top news feed with headline tape, extracted entities, impacted tickers, and theme tags.',
    example: 'TOP GO  |  AAPL US CN GO',  related: 'CN · N · NMAP · NREL · NTIM · SENT',
    tips: ['Click headline → NTIM (news timeline with price reaction)', 'Click ticker chip → DES', 'Right-click → context menu with "Open NREL"'] },
  { code: 'ECO',     title: 'Economic Calendar',            cat: 'Macro',            scoped: false,
    purpose: 'Upcoming macro releases with country, importance, consensus, prior, and actual (post-release).',
    example: 'ECO GO',  related: 'WEI · TOP · CAL24 · FXC',
    tips: ['Click country → CTY country dossier', 'Click event row → drill to the relevant macro function'] },
  { code: 'FXC',     title: 'FX Cross Matrix',              cat: 'FX',               scoped: false,
    purpose: 'N×N matrix of spot FX rates for all major pairs.',
    example: 'FXC GO',  related: 'DES · GP · ECO · CORR+',
    tips: ['Click any cell → DES for that FX pair', 'Right-click → GP chart options'] },
  { code: 'GEO',     title: 'Global Intelligence Map',      cat: 'Geo Intelligence', scoped: false,
    purpose: 'Interactive world map (MapLibre GL). Click any country to drill into region dossiers, news overlays, and supply chain signals.',
    example: 'GEO GO',  related: 'GEO.N · GEO.C · GEO.R · GEO.M · RGN · NMAP · SCN',
    tips: ['Click country → RGN region dossier', 'Shift+Click → opens in new pane', 'Use GEO.N / GEO.C / GEO.R / GEO.M / GEO.S / GEO.E / GEO.F / GEO.A for overlays'] },
  { code: 'MON',     title: 'Monitor / Watchlist',          cat: 'Monitors',         scoped: false,
    purpose: 'Streaming watchlist with custom columns from the Field Catalog. Multiple lists, sorting, filtering.',
    example: 'MON GO',  related: 'MON+ · FLD · ALRT+ · ALRT · WS',
    tips: ['Type symbol + Enter to add', 'Use MON+ for advanced column builder', 'Symbols need full format: AAPL US Equity'] },
  { code: 'ALRT',    title: 'Alerts Monitor',               cat: 'Monitors',         scoped: false,
    purpose: 'Shows all alert rules with triggered/inactive status. Drill into triggered alerts for evidence.',
    example: 'ALRT GO  |  ALRT+ GO',  related: 'ALRT+ · MON · MON+ · NOTIF',
    tips: ['ALRT+ GO → create field-based threshold alerts', 'System strip top bar shows alert count badge', 'Alerts evaluate against simulated streaming data'] },
  { code: 'RELG',    title: 'Relationship Graph',           cat: 'Relationships',    scoped: true,
    purpose: 'Visual relationship graph: peer / supply-chain / ownership / correlation links for any security.',
    example: 'AAPL US RELG GO',  related: 'RELT · EVID · PATH · SCN · CUST · OUT',
    tips: ['Click node → DES of related company', 'Click edge → EVID evidence panel', 'Enter key → expand selected node'] },
  { code: 'WS',      title: 'Workspace Manager',            cat: 'Platform',         scoped: false,
    purpose: 'Save and restore complete workspace states: pane layouts, panel content, command histories, pin strip.',
    example: 'WS GO  |  WS myname GO  |  WS DEL myname GO',  related: 'DOCK · FLOAT · LAYOUT · SNAP',
    tips: ['WS myname GO → saves OR loads (uses existing if found)', 'WS:MARKET-WALL / NEWSROOM / RESEARCH / TRADING → load presets', 'Workspaces stored in localStorage — export before clearing browser'] },
  { code: 'NAVTREE', title: 'Function Catalog',             cat: 'Platform',         scoped: false,
    purpose: 'Browse, filter, and launch all functions at catalog scale. Category filters, taxonomy grouping, favorites/recent.',
    example: 'NAVTREE GO',  related: 'TUTOR · PREF · KEYMAP · NX',
    tips: ['Type to filter instantly', 'Category dropdown → filter by asset class', 'Click any row → opens that function'] },
  { code: 'FLD',     title: 'Field Catalog',                cat: 'Data & Lineage',   scoped: false,
    purpose: 'Searchable registry of all data fields with definitions, units, cadence, and asset class availability.',
    example: 'FLD GO',  related: 'LINE · MAP · QLT · MON+',
    tips: ['Search by keyword, field ID, or definition', 'Click Add→MON to add as a monitor column', 'Click Lineage → opens LINE for that field'] },
  { code: 'LINE',    title: 'Data Lineage Viewer',          cat: 'Data & Lineage',   scoped: false,
    purpose: 'Visual lineage trace: source → normalization transforms → displayed value. Shows SIM/LIVE/STALE provenance.',
    example: 'LINE GO  |  LINE PX_LAST GO',  related: 'FLD · MAP · QLT · SRC',
    tips: ['Click any numeric value in DES/WEI/HP → auto-opens LINE', 'Alt+Click → Inspector shows field provenance in FIELDS section'] },
  { code: 'PREF',    title: 'Preferences & Settings',       cat: 'Platform',         scoped: false,
    purpose: 'User settings: contrast mode, density, font size, update flash, and time display.',
    example: 'PREF GO',  related: 'KEYMAP · GRIDCFG · THEMEPRO · FORMAT',
    tips: ['Density changes persist across sessions via localStorage', 'Live Mode increases streaming rate for all panels'] },
  { code: 'TUTOR',   title: 'Guided Tutorial',              cat: 'Platform',         scoped: false,
    purpose: '3-track guided walkthrough. Core Workflow, Global Map Stack, Platform & Admin. Click any row to open that function.',
    example: 'TUTOR GO  |  HELP GO',  related: 'NAVTREE · PREF · KEYMAP · DOCS',
    tips: ['Use "Other Pane" mode to keep TUTOR open while exploring', 'HELP GO and TUTOR GO both open this screen', 'F1 inside any panel → contextual help for that panel'] },
  { code: 'AUD',     title: 'Command Audit Log',            cat: 'Governance',       scoped: false,
    purpose: 'Chronological log of all user actions: GO commands, drills, alerts, exports, policy blocks.',
    example: 'AUD GO',  related: 'AUDIT · TRAIL · NAV · COMP · POL',
    tips: ['Filter by type: GO, DRILL, ALERT_CREATE, EXPORT, POLICY_BLOCK', 'Export before clearing browser data — log persists in localStorage'] },
];

const KEYBOARD_SHORTCUTS = [
  ['Ctrl+K', 'Open unified search (HL)'],
  ['Ctrl+L', 'Focus command line of focused panel'],
  ['Ctrl+B', 'Navigate back in panel history'],
  ['Ctrl+Shift+B', 'Navigate forward in panel history'],
  ['Ctrl+`', 'Cycle panel focus to next pane'],
  ['Ctrl+Shift+`', 'Switch workspace A ↔ B (2-up mode)'],
  ['Alt+1 … Alt+9', 'Focus pane 1–9 directly'],
  ['F1', 'Help for current panel (double-tap = Help Desk)'],
  ['F2', 'MENU overlay — related functions + next actions'],
  ['Enter', 'Execute command / drill selected row'],
  ['Shift+Enter', 'Open selection in new pane'],
  ['Alt+Enter', 'Open Inspector overlay'],
  ['Right-click', 'Context menu on any entity'],
  ['Tab', 'Accept top autocomplete suggestion'],
  ['↑↓', 'Navigate table rows / autocomplete suggestions'],
  ['PageUp / PageDown', 'Scroll table by one viewport'],
  ['Esc', 'Close overlay / clear command input'],
];

const GLOSSARY = [
  ['Mnemonic', 'A short code (2–6 chars) identifying a terminal function. E.g. DES, WEI, GP.'],
  ['GO', 'Command execution keyword. Append to any command to run it.'],
  ['HL', 'Unified search overlay (Help & Lookup). Open with Ctrl+K or HL GO.'],
  ['Entity', 'Any typed, drillable data object: security, field, news, holder, function, etc.'],
  ['Drill', 'Navigate from one entity to a deeper related view.'],
  ['Pane', 'An individual panel window within the workspace.'],
  ['Workspace', 'Named snapshot of the full layout and panel states.'],
  ['Provenance', 'Origin and freshness metadata for a data value (SIM / LIVE / STALE).'],
  ['SIM', 'Simulated data generated by the built-in market simulator.'],
  ['LIVE', 'Real-time streaming data (when live mode is active).'],
  ['STALE', 'Data that has exceeded its expected refresh cadence.'],
  ['Inspector', 'Panel-local overlay showing deep metadata for any entity (Alt+Click).'],
  ['Monitor', 'User-defined streaming watchlist table (MON / MON+).'],
  ['B-PIPE', 'MarketMind\'s internal simulated data feed.'],
  ['MENU', 'The F2 overlay showing related functions, next actions, and tools.'],
  ['Lineage', 'Data flow trace from source to display for a specific field value.'],
  ['Field Catalog', 'Registry of all available data fields with metadata (FLD).'],
];

const catCounts = {};
for (const m of ALL) catCounts[m.category] = (catCounts[m.category] || 0) + 1;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>MarketMind Terminal — Complete User Guide</title>
<style>
:root{
  --bg:#080e14; --bg2:#0d1620; --bg3:#132030;
  --amber:#f5a623; --cyan:#4dbdff; --green:#3dd68c; --red:#f25373;
  --text:#dce8f4; --text2:#8ba8c4; --dim:#5a7691;
  --border:#2a3e52; --grid:#1a2a38;
  --font:'Cascadia Mono','JetBrains Mono','Consolas','Courier New',monospace;
}
*{box-sizing:border-box;margin:0;padding:0;}
html{background:var(--bg);color:var(--text);font-family:var(--font);font-size:13px;line-height:1.5;scroll-behavior:smooth;}
body{display:flex;min-height:100vh;}
nav{width:220px;min-width:220px;background:var(--bg2);border-right:1px solid var(--border);position:sticky;top:0;height:100vh;overflow-y:auto;padding:12px 0;flex-shrink:0;}
nav h1{padding:0 12px 10px;font-size:11px;color:var(--amber);letter-spacing:0.12em;font-weight:700;border-bottom:1px solid var(--border);margin-bottom:8px;}
nav a{display:block;padding:3px 12px;font-size:11px;color:var(--text2);text-decoration:none;border-left:2px solid transparent;}
nav a:hover{color:var(--text);border-left-color:var(--amber);}
nav .nav-section{padding:6px 12px 2px;font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:0.08em;margin-top:4px;}
main{flex:1;padding:24px 32px;max-width:1000px;}
h1{font-size:22px;color:var(--amber);margin-bottom:8px;letter-spacing:0.06em;}
h2{font-size:16px;color:var(--text);margin:28px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--border);}
h3{font-size:13px;color:var(--cyan);margin:18px 0 6px;}
p{margin-bottom:8px;color:var(--text2);}
a{color:var(--cyan);text-decoration:none;}
a:hover{text-decoration:underline;}
code{background:var(--bg3);color:var(--amber);padding:1px 5px;font-family:var(--font);font-size:12px;}
pre{background:var(--bg2);border:1px solid var(--border);padding:12px 16px;overflow-x:auto;font-family:var(--font);font-size:12px;color:var(--text);margin:10px 0;}
table{width:100%;border-collapse:collapse;margin:10px 0;font-size:12px;}
th{background:var(--bg2);color:var(--amber);padding:5px 8px;text-align:left;border:1px solid var(--border);font-weight:700;}
td{padding:4px 8px;border:1px solid var(--grid);color:var(--text2);}
tr:nth-child(even) td{background:var(--bg2);}
tr:hover td{background:var(--bg3);}
.badge{display:inline-block;padding:1px 7px;font-size:11px;font-weight:700;font-family:var(--font);}
.badge-amber{background:var(--amber);color:#000;}
.badge-cyan{background:transparent;border:1px solid var(--cyan);color:var(--cyan);}
.badge-global{background:transparent;border:1px solid var(--green);color:var(--green);}
.badge-scoped{background:transparent;border:1px solid var(--dim);color:var(--dim);}
.tip{background:var(--bg3);border-left:3px solid var(--cyan);padding:8px 12px;margin:10px 0;font-size:12px;color:var(--text2);}
.tip strong{color:var(--cyan);}
.warning{background:var(--bg3);border-left:3px solid var(--amber);padding:8px 12px;margin:10px 0;font-size:12px;color:var(--text2);}
.mnemonic-card{background:var(--bg2);border:1px solid var(--border);margin:14px 0;padding:14px 16px;}
.mnemonic-card h3{margin-top:0;}
.download-bar{background:var(--bg2);border:1px solid var(--cyan);padding:10px 14px;margin-bottom:24px;display:flex;align-items:center;gap:12px;}
.download-bar a{background:var(--cyan);color:#000;padding:4px 14px;font-weight:700;font-size:12px;text-decoration:none;}
.download-bar span{color:var(--text2);font-size:12px;}
.section-header{background:var(--bg2);padding:16px 0 12px;margin-bottom:16px;border-bottom:2px solid var(--amber);}
.steps li{margin:6px 0;color:var(--text2);font-size:12px;}
.steps li code{font-size:12px;}
.tips-list{padding-left:16px;}
.tips-list li{margin:3px 0;color:var(--dim);font-size:12px;}
.cat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0;}
.cat-card{background:var(--bg2);border:1px solid var(--border);padding:8px 12px;}
.cat-card .count{font-size:22px;color:var(--amber);font-weight:700;}
.cat-card .label{font-size:11px;color:var(--dim);margin-top:2px;}
@media(max-width:700px){nav{display:none;}main{padding:14px;}}
@media print{nav{display:none;}main{max-width:none;padding:0;}}
</style>
</head>
<body>
<nav>
  <h1>MM TERMINAL GUIDE</h1>
  <a class="nav-section">Getting Started</a>
  <a href="#quick-start">Quick Start (5 min)</a>
  <a href="#command-grammar">Command Grammar</a>
  <a href="#navigation">Navigation</a>
  <a class="nav-section">Terminal OS</a>
  <a href="#terminal-os">Workspace Model</a>
  <a href="#keyboard">Keyboard Reference</a>
  <a href="#drill-intents">Drill Intents</a>
  <a href="#search">Search (HL)</a>
  <a class="nav-section">Workflows</a>
  <a href="#workflow-research">Research a Ticker</a>
  <a href="#workflow-monitor">Build a Monitor</a>
  <a href="#workflow-alerts">Set Alerts</a>
  <a href="#workflow-map">Global Map</a>
  <a href="#workflow-macro">Macro → Ticker</a>
  <a class="nav-section">Mnemonic Reference</a>
${CORE_MNEMONICS.map(m => `  <a href="#mn-${m.code.replace(/[^A-Za-z0-9]/g,'_')}">${m.code} — ${m.title}</a>`).join('\n')}
  <a class="nav-section">Full Catalog</a>
  <a href="#catalog-index">All ${FUNCTION_COUNT} Functions</a>
  <a class="nav-section">Reference</a>
  <a href="#data-provenance">Data &amp; Provenance</a>
  <a href="#settings">Settings</a>
  <a href="#troubleshooting">Troubleshooting</a>
  <a href="#glossary">Glossary</a>
</nav>
<main>

<div class="section-header">
  <h1>MarketMind Terminal<br/>Complete User Guide</h1>
  <p style="color:var(--text2);font-size:12px;">${FUNCTION_COUNT} functions · Bloomberg-style terminal OS · Professional market intelligence platform</p>
</div>

<div class="download-bar">
  <span>📖 This guide is available offline:</span>
  <a href="/user-guide/index.html" download="MarketMind-Terminal-User-Guide.html">⬇ Download HTML Guide</a>
  <span style="color:var(--dim)">Self-contained · works offline · all content included</span>
</div>

<h2 id="quick-start">⚡ Quick Start — 5 Minutes to Productivity</h2>
<p>Type any of these in the <strong>Global Command Bar</strong> at the top of the screen, then press <strong>Enter</strong> or click <strong>GO</strong>:</p>
<pre>AAPL US DES GO          → Apple description screen
MSFT US HP GO           → Microsoft historical prices
EURUSD Curncy GP GO     → EUR/USD daily price chart
WEI GO                  → World equity indices monitor
TOP GO                  → Top news headlines
GEO GO                  → Global intelligence map
NAVTREE GO              → Browse all functions in catalog
TUTOR GO                → This guided walkthrough</pre>

<h2 id="command-grammar">Command Grammar</h2>
<pre>&lt;TICKER&gt; &lt;MARKET&gt; &lt;MNEMONIC&gt; GO</pre>
<table>
<tr><th>Part</th><th>Example</th><th>Meaning</th></tr>
<tr><td><code>TICKER</code></td><td>AAPL</td><td>The symbol</td></tr>
<tr><td><code>MARKET</code></td><td>US / Curncy / Index / Corp / Comdty</td><td>Asset class suffix</td></tr>
<tr><td><code>MNEMONIC</code></td><td>DES / HP / GP / FA</td><td>The function to run</td></tr>
<tr><td><code>GO</code></td><td>GO</td><td>Executes the command</td></tr>
<tr><td><code>TIMEFRAME</code></td><td>5D / 1M / 3M / 1Y / 5Y</td><td>Optional — for charts/history</td></tr>
</table>
<div class="tip"><strong>Typo correction:</strong> The command parser uses fuzzy matching. Typing <code>WEL</code> resolves to <code>WEI</code>. Close-enough always works.</div>

<h2 id="navigation">Navigation Basics</h2>
<table>
<tr><th>Action</th><th>How</th></tr>
<tr><td>Drill into a row</td><td>Click it or press <code>Enter</code></td></tr>
<tr><td>Open in new pane</td><td><code>Shift+Click</code> or <code>Shift+Enter</code></td></tr>
<tr><td>Open Inspector overlay</td><td><code>Alt+Click</code> or <code>Alt+Enter</code></td></tr>
<tr><td>Context menu</td><td>Right-click any entity</td></tr>
<tr><td>Navigate back</td><td><code>Ctrl+B</code></td></tr>
<tr><td>Navigate forward</td><td><code>Ctrl+Shift+B</code></td></tr>
<tr><td>Search everything</td><td><code>Ctrl+K</code></td></tr>
<tr><td>Related functions</td><td><code>F2</code> (MENU overlay)</td></tr>
<tr><td>Help for current panel</td><td><code>F1</code></td></tr>
</table>

<h2 id="terminal-os">🖥️ Terminal OS — Workspace &amp; Pane Model</h2>
<pre>┌───────────────────────────────────────────────────────────┐
│  SYSTEM STRIP     MM ● SIM  ET 14:23  GMT 19:23  FPS 60   │
│  GLOBAL CMD BAR   P1 &gt; AAPL US DES GO            [GO]     │
├──────────────────────────────┬────────────────────────────┤
│  PANEL 1   DES  AAPL  ●FOCUS │  PANEL 2   WEI   Global    │
│  ◀ ▶ MENU  HELP  HL  RECENT  │  ◀ ▶ MENU  HELP  HL        │
│  EQUITY › US › AAPL › DES   │  Global › Indices           │
│  Next: HP  GP  CN  OWN  FA   │  Next: IMAP  TOP  ECO       │
│  ─────────────────────────── │  ──────────────────────────│
│  [PANEL CONTENT]             │  [PANEL CONTENT]            │
│  P1 &gt; AAPL US DES GO [GO]   │  P2 &gt;              [GO]   │
└──────────────────────────────┴────────────────────────────┘</pre>
<p>Each <strong>panel (pane)</strong> is independent with its own active security, navigation history, and command line.</p>
<h3>Pane Controls</h3>
<table>
<tr><th>Command</th><th>Effect</th></tr>
<tr><td><code>NP GO</code></td><td>New tab pane</td></tr>
<tr><td><code>NP H GO</code></td><td>Split current pane horizontally</td></tr>
<tr><td><code>NP V GO</code></td><td>Split current pane vertically</td></tr>
<tr><td><code>Alt+1…Alt+9</code></td><td>Focus pane 1–9</td></tr>
<tr><td><code>Ctrl+\`</code></td><td>Cycle pane focus</td></tr>
<tr><td><code>WS:MARKET-WALL GO</code></td><td>Load 8-pane market wall preset</td></tr>
<tr><td><code>WS:RESEARCH GO</code></td><td>Load research preset</td></tr>
<tr><td><code>WS:NEWSROOM GO</code></td><td>Load newsroom preset</td></tr>
<tr><td><code>WS:TRADING GO</code></td><td>Load trading preset</td></tr>
</table>

<h2 id="keyboard">⌨️ Complete Keyboard Reference</h2>
<table>
<tr><th>Key</th><th>Action</th></tr>
${KEYBOARD_SHORTCUTS.map(([k,v]) => `<tr><td><code>${k}</code></td><td>${v}</td></tr>`).join('\n')}
</table>

<h2 id="drill-intents">🖱️ Drill Intents &amp; Mouse Semantics</h2>
<table>
<tr><th>Mouse Action</th><th>Behavior</th></tr>
<tr><td><strong>Click</strong></td><td>Open entity in current pane (OPEN_IN_PLACE)</td></tr>
<tr><td><strong>Shift+Click</strong></td><td>Open entity in new pane (OPEN_IN_NEW_PANE)</td></tr>
<tr><td><strong>Alt+Click</strong></td><td>Open Inspector overlay (INSPECT_OVERLAY)</td></tr>
<tr><td><strong>Right-click</strong></td><td>Context menu: Open, Send to pane, Inspect, Add to monitor, Alert on field, Copy ID</td></tr>
</table>
<p>Every visible entity is typed (SECURITY, FIELD, NEWS, HOLDER, FUNCTION…). All 22 entity kinds support the same drill semantics.</p>

<h2 id="search">🔍 Search — HL / Ctrl+K</h2>
<p>Open with <code>Ctrl+K</code>, <code>HL GO</code>, or the HL button in the panel toolbar.</p>
<p>Searches across: <strong>Functions</strong> (${FUNCTION_COUNT} mnemonics) · <strong>Securities</strong> · <strong>Fields</strong> · <strong>Monitors</strong> · <strong>Workspaces</strong> · <strong>News</strong></p>
<div class="tip"><strong>Examples:</strong> Type <code>div</code> → finds DVD (Dividend History). Type <code>ownership</code> → finds OWN. Type <code>options chain</code> → finds CHAIN.</div>

<!-- WORKFLOWS -->
<h2 id="workflow-research">🎯 Workflow: Research a Ticker</h2>
<pre>AAPL US DES GO         → 1. Open description screen
AAPL US CN GO          → 2. Company news (what's driving it)
AAPL US HP 1Y GO       → 3. One-year price history table
AAPL US GP GO          → 4. Price chart (visual)
AAPL US FA GO          → 5. Financial statements
AAPL US RELS GO        → 6. Related securities (peers)
AAPL US OWN GO         → 7. Institutional ownership
AAPL US EVT GO         → 8. Corporate events
AAPL US MGMT GO        → 9. Management team</pre>
<div class="tip"><strong>Quick path:</strong> Open DES → press <code>F2</code> → MENU shows HP, GP, CN, OWN, RELS, FA as next actions.</div>

<h2 id="workflow-monitor">📊 Workflow: Build a Monitor</h2>
<ol class="steps">
<li><code>MON GO</code> → Open Monitor / Watchlist</li>
<li>Type symbol + Enter → Add <code>AAPL US Equity</code>, <code>MSFT US Equity</code>, etc.</li>
<li><code>MON+ GO</code> → Advanced Monitor Builder (custom columns)</li>
<li><code>FLD GO</code> → Find fields → click <strong>Add→MON</strong> to add as column</li>
<li><code>ALRT+ GO</code> → Set field-based alerts for watchlist symbols</li>
<li><code>WS mymonitor GO</code> → Save as named workspace</li>
</ol>

<h2 id="workflow-alerts">🔔 Workflow: Set &amp; Manage Alerts</h2>
<ol class="steps">
<li><code>ALRT+ GO</code> → Open Advanced Alerts</li>
<li>Enter symbol (e.g. <code>AAPL US Equity</code>)</li>
<li>Select field (e.g. <code>PX_LAST</code>), operator (<code>&gt;</code> or <code>&lt;</code>), threshold</li>
<li>Click <strong>CREATE</strong></li>
<li><code>ALRT GO</code> → View all rules + triggered status</li>
</ol>
<div class="warning"><strong>Note:</strong> Alerts evaluate against simulated streaming data. System strip badge shows triggered count.</div>

<h2 id="workflow-map">🗺️ Workflow: Global Map Intelligence</h2>
<table>
<tr><th>Code</th><th>What it shows</th></tr>
<tr><td><code>GEO GO</code></td><td>Primary world map — click any country</td></tr>
<tr><td><code>GEO.N GO</code></td><td>News intensity overlay by region</td></tr>
<tr><td><code>GEO.C GO</code></td><td>Company facility footprint map</td></tr>
<tr><td><code>GEO.R GO</code></td><td>Regional risk score map</td></tr>
<tr><td><code>GEO.M GO</code></td><td>Macro signals by country</td></tr>
<tr><td><code>GEO.S GO</code></td><td>Supply chain disruption map</td></tr>
<tr><td><code>GEO.E GO</code></td><td>Energy &amp; commodities map</td></tr>
<tr><td><code>GEO.F GO</code></td><td>Freight &amp; shipping lanes</td></tr>
<tr><td><code>GEO.A GO</code></td><td>Alerted regions overlay</td></tr>
<tr><td><code>RGN GO</code></td><td>Region dossier (companies, news, macro, risk)</td></tr>
<tr><td><code>NMAP GO</code></td><td>News stories plotted on map</td></tr>
<tr><td><code>SCN GO</code></td><td>Supply chain network</td></tr>
</table>

<h2 id="workflow-macro">📈 Workflow: Macro Context → Ticker Impact</h2>
<pre>WEI GO    → World indices overview
IMAP GO   → Sector heatmap (which sectors moving)
FXC GO    → FX cross matrix (currency drivers)
ECO GO    → Economic calendar (upcoming releases)
GC GO     → Yield curve (rates environment)
XAS GO    → Cross-asset spread board
GEO.M GO  → Macro signals by geography
XDRV GO   → Cross-driver dashboard for a security</pre>
<div class="tip">Load the macro preset: <code>WS:MACRO GO</code> → opens WEI, ECO, GEO.M, XAS, REGI, NQ in one layout.</div>

<!-- MNEMONIC REFERENCE -->
<h2>📋 Mnemonic Reference — Core Functions</h2>
${CORE_MNEMONICS.map(m => `
<div class="mnemonic-card" id="mn-${m.code.replace(/[^A-Za-z0-9]/g,'_')}">
<h3>
  <span class="badge badge-amber">${m.code}</span>
  &nbsp;${m.title}
  &nbsp;<span class="badge ${m.scoped ? 'badge-scoped' : 'badge-global'}">${m.scoped ? '🔒 Security Scoped' : '🌍 Global'}</span>
  &nbsp;<span class="badge badge-cyan">${m.cat}</span>
</h3>
<p><strong>Purpose:</strong> ${m.purpose}</p>
<p><strong>Open with:</strong> <code>${m.example}</code></p>
<p><strong>Related:</strong> ${m.related}</p>
<ul class="tips-list">
${m.tips.map(t => `<li>${t}</li>`).join('\n')}
</ul>
</div>`).join('\n')}

<!-- FULL CATALOG INDEX -->
<h2 id="catalog-index">📡 Full Function Catalog (${ALL.length} functions)</h2>
<div class="cat-grid">
${Object.entries(catCounts).map(([cat,count]) => `<div class="cat-card"><div class="count">${count}</div><div class="label">${cat}</div></div>`).join('\n')}
</div>
<table>
<tr><th>Code</th><th>Title</th><th>Category</th><th>Scope</th><th>Type</th></tr>
${ALL.map(m => `<tr><td><code>${m.code}</code></td><td>${m.title}</td><td>${m.category}</td><td>${m.requiresSecurity ? '🔒' : '🌍'}</td><td>${m.functionType}</td></tr>`).join('\n')}
</table>

<!-- DATA & PROVENANCE -->
<h2 id="data-provenance">📊 Data &amp; Provenance</h2>
<table>
<tr><th>Badge</th><th>Meaning</th></tr>
<tr><td><strong>SIM</strong></td><td>Simulated data — realistic ranges and patterns, not live market data</td></tr>
<tr><td><strong>LIVE</strong></td><td>Real-time streaming value (when High Density Live Mode is enabled)</td></tr>
<tr><td><strong>STALE</strong></td><td>Value's age exceeds the expected refresh cadence for that field type</td></tr>
<tr><td><strong>CALC</strong></td><td>Derived by calculation from other fields, not directly sourced</td></tr>
</table>
<p>Click any numeric value in DES / WEI / HP → auto-opens <strong>LINE</strong> (lineage viewer) showing the data flow.</p>

<!-- SETTINGS -->
<h2 id="settings">⚙️ Settings &amp; Personalization</h2>
<p>Open with <code>PREF GO</code>, <code>SET GO</code>, or <code>SETTINGS GO</code>.</p>
<table>
<tr><th>Setting</th><th>Options</th><th>Effect</th></tr>
<tr><td>Contrast Mode</td><td>Normal / High</td><td>Improves readability and separation</td></tr>
<tr><td>Density</td><td>Compact / Standard</td><td>Controls row height and panel packing</td></tr>
<tr><td>Font Size</td><td>S / M / L</td><td>Scales UI typography for legibility</td></tr>
<tr><td>Update Flash</td><td>Off / On</td><td>Flashes cells only when displayed value changes</td></tr>
<tr><td>Time Display</td><td>ET / Local / GMT</td><td>Controls system strip clock mode</td></tr>
</table>
<h3>Workspace Commands</h3>
<pre>WS myname GO         → Save or load workspace by name
WS DEL myname GO     → Delete workspace
WS:MARKET-WALL GO    → Load 8-pane market wall preset
WS:NEWSROOM GO       → Load newsroom preset
WS:RESEARCH GO       → Load research layout
WS:TRADING GO        → Load trading layout</pre>

<!-- TROUBLESHOOTING -->
<h2 id="troubleshooting">🔧 Troubleshooting &amp; FAQ</h2>
<table>
<tr><th>Issue</th><th>Solution</th></tr>
<tr><td>Panel is empty / shows home screen</td><td>Type any command + GO. E.g. <code>WEI GO</code></td></tr>
<tr><td>Data shows SIM or STALE</td><td>All data is simulated by design. Enable Live Mode in PREF for more updates.</td></tr>
<tr><td>Can't access a function (policy block)</td><td>Check <code>COMP GO</code> → compliance mode. Check <code>POL GO</code> → policy rules.</td></tr>
<tr><td>Drill not working</td><td>Right-click the row to see context menu. Alt+Click for Inspector overlay.</td></tr>
<tr><td>Monitor has no data</td><td>Add symbols in MON: type <code>AAPL US Equity</code> + Enter. Full format required.</td></tr>
<tr><td>Workspace not loading</td><td>Type <code>WS GO</code> to see all saved workspaces and their exact names.</td></tr>
<tr><td>Map (GEO) not loading tiles</td><td>Requires internet for MapLibre tiles. Country overlays still work offline.</td></tr>
<tr><td>Performance is slow</td><td>Disable Live Mode in PREF. Reduce pane count. Use Compact density. Check DIAG GO.</td></tr>
<tr><td>Order entry is blocked</td><td>Check <code>KILL GO</code> — kill switch may be active. Reset via <code>COMP GO</code>.</td></tr>
</table>

<!-- GLOSSARY -->
<h2 id="glossary">📖 Glossary</h2>
<table>
<tr><th>Term</th><th>Definition</th></tr>
${GLOSSARY.map(([t,d]) => `<tr><td><strong>${t}</strong></td><td>${d}</td></tr>`).join('\n')}
</table>

<hr style="border-color:var(--border);margin:32px 0 16px;"/>
<p style="color:var(--dim);font-size:11px;text-align:center;">MarketMind Terminal User Guide — ${ALL.length} functions documented · Generated from live codebase</p>
<p style="color:var(--dim);font-size:11px;text-align:center;margin-top:4px;">
  <a href="#quick-start">Back to top ↑</a> &nbsp;·&nbsp;
  <a href="/user-guide/index.html" download="MarketMind-Terminal-User-Guide.html">Download this guide</a>
</p>

</main>
</body>
</html>`;

writeFileSync(OUT, html, 'utf8');
const sizeKb = Math.round(html.length / 1024);
console.log(`✅ Generated: public/user-guide/index.html (${sizeKb} KB, ${ALL.length} catalog functions)`);
