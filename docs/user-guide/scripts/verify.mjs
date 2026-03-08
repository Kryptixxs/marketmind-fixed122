#!/usr/bin/env node
/**
 * docs:verify — validates docs completeness
 * Checks: every core mnemonic has a page, pages have required sections, screenshots manifest
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC  = join(ROOT, 'src');
const SCREENSHOTS_DIR = join(ROOT, 'assets/screenshots');

// Import catalog
const catalogPath = join(ROOT, '../../src/features/terminal-next/mnemonics/catalog.ts');
const { listCatalogMnemonics } = await import(`file:///${catalogPath.replace(/\\/g, '/')}`);
const ALL_CATALOG = listCatalogMnemonics();

const REQUIRED_CORE_PAGES = [
  'DES', 'HP', 'GP', 'FA', 'OWN', 'CN', 'WEI', 'TOP', 'ECO', 'FXC',
  'MON', 'GEO', 'RELG', 'WS', 'NAVTREE', 'ALRT', 'FLD', 'LINE', 'TUTOR', 'PREF',
];

const REQUIRED_SCREENSHOTS = [
  'home', 'wakeup-quickstart', 'wei-world-indices', 'des-description',
  'gp-price-chart', 'top-news', 'hl-search-overlay', 'navtree-function-catalog', 'pref-settings',
];

let errors = 0;
let warnings = 0;

function error(msg) { console.error(`❌ ERROR: ${msg}`); errors++; }
function warn(msg)  { console.warn(`⚠️  WARN:  ${msg}`); warnings++; }
function ok(msg)    { console.log(`✅ OK:    ${msg}`); }

// 1. Check core mnemonic pages exist
console.log('\n── Checking core mnemonic pages ──');
for (const code of REQUIRED_CORE_PAGES) {
  const safe = code.replace(/[^A-Za-z0-9_\-]/g, '_');
  const path = join(SRC, `mnemonics/${safe}.md`);
  if (existsSync(path)) {
    const content = readFileSync(path, 'utf8');
    if (!content.includes('## Purpose') && !content.includes('purpose') && !content.includes('Purpose')) {
      warn(`${code} page exists but missing ## Purpose section`);
    } else {
      ok(`${code} page exists with content`);
    }
  } else {
    error(`Core mnemonic page missing: mnemonics/${safe}.md`);
  }
}

// 2. Check all catalog mnemonics are indexed
console.log('\n── Checking catalog index ──');
const indexPath = join(SRC, 'mnemonics/index.md');
if (existsSync(indexPath)) {
  const indexContent = readFileSync(indexPath, 'utf8');
  let indexedCount = 0;
  for (const m of ALL_CATALOG) {
    if (indexContent.includes(m.code)) indexedCount++;
  }
  const pct = ((indexedCount / ALL_CATALOG.length) * 100).toFixed(1);
  if (indexedCount === ALL_CATALOG.length) {
    ok(`All ${ALL_CATALOG.length} catalog mnemonics are in the index`);
  } else {
    warn(`${indexedCount}/${ALL_CATALOG.length} (${pct}%) mnemonics indexed`);
  }
} else {
  error('mnemonics/index.md does not exist');
}

// 3. Check category pages
console.log('\n── Checking category catalog pages ──');
const CATS = ['equity', 'fx', 'rates', 'credit', 'derivs', 'macro', 'portfolio', 'news', 'ops'];
for (const cat of CATS) {
  const path = join(SRC, `mnemonics/catalog-${cat}.md`);
  if (existsSync(path)) {
    ok(`catalog-${cat}.md exists`);
  } else {
    error(`catalog-${cat}.md missing`);
  }
}

// 4. Check guide pages
console.log('\n── Checking guide pages ──');
const REQUIRED_GUIDE = [
  'getting-started', 'terminal-os', 'command-line', 'keyboard-reference',
  'drill-intents', 'search', 'data-provenance', 'settings', 'troubleshooting',
  'glossary', 'feature-inventory',
];
for (const page of REQUIRED_GUIDE) {
  const path = join(SRC, `guide/${page}.md`);
  if (existsSync(path)) {
    ok(`guide/${page}.md exists`);
  } else {
    error(`guide/${page}.md missing`);
  }
}

// 5. Check workflow pages
console.log('\n── Checking workflow pages ──');
const REQUIRED_WORKFLOWS = [
  'research-ticker', 'build-monitor', 'alerts', 'orders',
  'macro-to-ticker', 'global-map',
];
for (const wf of REQUIRED_WORKFLOWS) {
  const path = join(SRC, `workflows/${wf}.md`);
  if (existsSync(path)) {
    ok(`workflows/${wf}.md exists`);
  } else {
    error(`workflows/${wf}.md missing`);
  }
}

// 6. Check screenshots (warn only — can't always run browser)
console.log('\n── Checking screenshots ──');
if (existsSync(SCREENSHOTS_DIR)) {
  const manifestPath = join(SCREENSHOTS_DIR, 'manifest.json');
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const ok_shots = manifest.filter(m => m.status === 'ok');
    ok(`Screenshot manifest exists: ${ok_shots.length}/${manifest.length} succeeded`);
  } else {
    warn('screenshots/manifest.json not found — run: npm run docs:screenshots');
  }
  for (const id of REQUIRED_SCREENSHOTS) {
    const png = join(SCREENSHOTS_DIR, `${id}.png`);
    const svg = join(SCREENSHOTS_DIR, `${id}.svg`);
    if (existsSync(png)) {
      ok(`Screenshot: ${id}.png`);
    } else if (existsSync(svg)) {
      warn(`Screenshot ${id}: using SVG placeholder (run docs:screenshots with app running)`);
    } else {
      warn(`Screenshot ${id}: not found — run docs:screenshots`);
    }
  }
} else {
  warn('screenshots/ directory not found — run: npm run docs:screenshots');
}

// 7. Check VitePress config
console.log('\n── Checking VitePress config ──');
const configPath = join(SRC, '.vitepress/config.ts');
const configMtsPath = join(SRC, '.vitepress/config.mts');
if (existsSync(configPath) || existsSync(configMtsPath)) {
  ok('.vitepress/config exists (.ts or .mts)');
} else {
  error('.vitepress/config.ts / .mts missing');
}

// Summary
console.log('\n── Summary ──');
console.log(`Catalog mnemonics: ${ALL_CATALOG.length}`);
if (errors > 0) {
  console.error(`\n❌ ${errors} error(s), ${warnings} warning(s) — docs are incomplete`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠️  0 errors, ${warnings} warning(s) — docs are functional but screenshots may be placeholders`);
  process.exit(0);
} else {
  console.log(`\n✅ All checks passed — docs are complete`);
  process.exit(0);
}
