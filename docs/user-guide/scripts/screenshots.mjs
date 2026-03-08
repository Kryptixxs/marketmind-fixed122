#!/usr/bin/env node
/**
 * Playwright screenshot pipeline for MarketMind Terminal docs
 * Captures canonical states of the running app and saves to docs/user-guide/assets/screenshots/
 */

import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = join(__dirname, '../assets/screenshots');
const APP_URL = process.env.DOCS_APP_URL || 'http://localhost:3000';

mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Canonical states to capture
const CAPTURES = [
  {
    id: 'home',
    title: 'Home Screen — Panel Ready',
    setup: async (page) => {
      // Navigate to home / wake-up screen
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
    },
  },
  {
    id: 'wakeup-quickstart',
    title: 'WakeUp Screen — Quick Start tab',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
    },
  },
  {
    id: 'wei-world-indices',
    title: 'WEI — World Equity Indices',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      // Type WEI GO in the global command bar
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('WEI GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(1500);
      }
    },
  },
  {
    id: 'des-description',
    title: 'DES — Security Description (AAPL)',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('AAPL US DES GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(1500);
      }
    },
  },
  {
    id: 'gp-price-chart',
    title: 'GP — Price Chart (AAPL)',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('AAPL US GP GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(2000);
      }
    },
  },
  {
    id: 'top-news',
    title: 'TOP — Top News',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('TOP GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(1500);
      }
    },
  },
  {
    id: 'eco-calendar',
    title: 'ECO — Economic Calendar',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('ECO GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(1500);
      }
    },
  },
  {
    id: 'mon-monitor',
    title: 'MON — Monitor / Watchlist',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('MON GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(1500);
      }
    },
  },
  {
    id: 'hl-search-overlay',
    title: 'HL — Search Overlay (Ctrl+K)',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      // Open HL search
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(800);
      const searchInput = page.locator('input[placeholder*="security"]').first();
      if (await searchInput.count()) {
        await searchInput.fill('div');
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: 'navtree-function-catalog',
    title: 'NAVTREE — Function Catalog',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('NAVTREE GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(1500);
      }
    },
  },
  {
    id: 'pref-settings',
    title: 'PREF — Preferences & Settings',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('PREF GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(1200);
      }
    },
  },
  {
    id: 'tutor-walkthrough',
    title: 'TUTOR — Guided Walkthrough',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('TUTOR GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(1200);
      }
    },
  },
  {
    id: 'multi-pane-workspace',
    title: 'Multi-Pane Workspace',
    setup: async (page) => {
      await page.goto(APP_URL);
      await page.waitForTimeout(2000);
      // Load market-wall preset
      const cmdbar = page.locator('input[placeholder*="command"]').first();
      if (await cmdbar.count()) {
        await cmdbar.fill('WS:RESEARCH GO');
        await cmdbar.press('Enter');
        await page.waitForTimeout(2500);
      }
    },
  },
];

async function run() {
  console.log(`📸 Starting screenshot pipeline → ${APP_URL}`);
  console.log(`   Output: ${SCREENSHOTS_DIR}`);
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  
  const manifest = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const capture of CAPTURES) {
    const outPath = join(SCREENSHOTS_DIR, `${capture.id}.png`);
    try {
      console.log(`  📷 Capturing: ${capture.id}...`);
      const page = await context.newPage();
      
      // Suppress console errors
      page.on('console', msg => {
        if (msg.type() === 'error') return;
      });
      page.on('pageerror', () => {});
      
      await capture.setup(page);
      await page.screenshot({ path: outPath, fullPage: false });
      await page.close();
      
      manifest.push({ id: capture.id, title: capture.title, file: `${capture.id}.png`, status: 'ok' });
      successCount++;
      console.log(`    ✅ ${capture.id}.png`);
    } catch (err) {
      failCount++;
      manifest.push({ id: capture.id, title: capture.title, file: null, status: 'failed', error: String(err.message) });
      console.log(`    ❌ ${capture.id} FAILED: ${err.message}`);
      
      // Write a placeholder SVG so the guide doesn't break
      const placeholderSvg = `<svg width="1440" height="900" xmlns="http://www.w3.org/2000/svg">
  <rect width="1440" height="900" fill="#080e14"/>
  <text x="720" y="430" text-anchor="middle" fill="#f5a623" font-size="24" font-family="monospace">${capture.title}</text>
  <text x="720" y="470" text-anchor="middle" fill="#5a7691" font-size="16" font-family="monospace">Screenshot: ${capture.id}</text>
  <text x="720" y="510" text-anchor="middle" fill="#2a3e52" font-size="14" font-family="monospace">Run npm run docs:screenshots with dev server running</text>
</svg>`;
      const svgPath = join(SCREENSHOTS_DIR, `${capture.id}.svg`);
      writeFileSync(svgPath, placeholderSvg, 'utf8');
    }
  }
  
  await browser.close();
  
  // Write manifest
  const manifestPath = join(SCREENSHOTS_DIR, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  
  console.log(`\n📸 Screenshot pipeline complete`);
  console.log(`   ✅ ${successCount} succeeded`);
  if (failCount > 0) console.log(`   ❌ ${failCount} failed (placeholder SVGs generated)`);
  console.log(`   Manifest: ${manifestPath}`);
}

run().catch(err => {
  console.error('Screenshot pipeline error:', err);
  process.exit(1);
});
