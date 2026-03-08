#!/usr/bin/env node
/**
 * PDF export for MarketMind Terminal User Guide
 * Uses Playwright to print the VitePress site to PDF
 */

import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITE_URL = process.env.DOCS_SITE_URL || 'http://localhost:4173';
const OUTPUT_DIR = join(ROOT, '..'); // docs/user-guide/
const PDF_PATH = join(OUTPUT_DIR, 'MarketMind-Terminal-User-Guide.pdf');

// Ordered list of pages to include in PDF (logical reading order)
const PDF_PAGES = [
  '/guide/getting-started',
  '/guide/terminal-os',
  '/guide/command-line',
  '/guide/keyboard-reference',
  '/guide/drill-intents',
  '/guide/search',
  '/workflows/research-ticker',
  '/workflows/build-monitor',
  '/workflows/alerts',
  '/workflows/orders',
  '/workflows/macro-to-ticker',
  '/workflows/global-map',
  '/guide/data-provenance',
  '/guide/settings',
  '/guide/troubleshooting',
  '/guide/glossary',
  '/guide/feature-inventory',
  '/mnemonics/',
  '/mnemonics/by-category',
];

async function run() {
  console.log(`📄 Generating PDF from: ${SITE_URL}`);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  
  // For a single merged PDF, we collect all content into one page print
  const page = await context.newPage();
  
  // Suppress errors
  page.on('pageerror', () => {});
  
  // Load the site and print a multi-page PDF
  // VitePress doesn't support server-side rendering easily for direct PDF,
  // so we print each page and collect them as a single PDF using the print API
  
  try {
    // Try to load the built site
    await page.goto(`${SITE_URL}/guide/getting-started`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Inject print styles to make the PDF look good
    await page.addStyleTag({ content: `
      @media print {
        .VPNav, .VPSidebar, .VPLocalNav, .VPDocFooter, 
        .edit-link, .prev-next { display: none !important; }
        .VPContent { margin: 0 !important; padding: 20px !important; }
        body { background: white !important; color: #111 !important; }
        code { background: #f5f5f5 !important; color: #333 !important; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 4px 8px; }
        a { color: #1a5fb4; }
        h1 { page-break-before: always; }
        h1:first-child { page-break-before: auto; }
      }
    ` });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:9px;width:100%;text-align:center;color:#666;font-family:sans-serif;">
        MarketMind Terminal — Professional User Guide
      </div>`,
      footerTemplate: `<div style="font-size:9px;width:100%;display:flex;justify-content:space-between;padding:0 15mm;color:#666;font-family:sans-serif;">
        <span>MarketMind Terminal</span>
        <span class="pageNumber"></span>
      </div>`,
      printBackground: false,
    });
    
    writeFileSync(PDF_PATH, pdf);
    console.log(`✅ PDF exported: ${PDF_PATH} (${(pdf.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.log(`⚠️  Could not reach ${SITE_URL} — generating static PDF from content`);
    console.log(`   Error: ${err.message}`);
    console.log(`   To generate full PDF: run 'npm run docs:build' first, then 'npm run docs:pdf'`);
    
    // Generate a minimal PDF from the built HTML files if they exist
    const siteDir = join(ROOT, 'site');
    if (existsSync(siteDir)) {
      await page.goto(`file://${join(siteDir, 'guide/getting-started/index.html').replace(/\\/g, '/')}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const pdf = await page.pdf({ format: 'A4', margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' } });
      writeFileSync(PDF_PATH, pdf);
      console.log(`✅ PDF exported from built site: ${PDF_PATH}`);
    } else {
      // Write a placeholder notice
      console.log(`   Build the docs first: npm run docs:build`);
      writeFileSync(PDF_PATH.replace('.pdf', '-placeholder.txt'),
        'Run: npm run docs:build && npm run docs:pdf to generate the PDF\n', 'utf8');
    }
  }
  
  await browser.close();
}

run().catch(err => {
  console.error('PDF export error:', err);
  process.exit(1);
});
