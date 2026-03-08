const fs = require('fs');
const path = require('path');
const SHOTS_DIR = './docs/user-guide/assets/screenshots';

const CAPTURES = [
  ['home', 'MarketMind Terminal — Home Screen'],
  ['wakeup-quickstart', 'Quick Start — Home Panel'],
  ['wei-world-indices', 'WEI — World Equity Indices'],
  ['des-description', 'DES — Security Description (AAPL)'],
  ['gp-price-chart', 'GP — Price Chart (AAPL)'],
  ['top-news', 'TOP — Top News Headlines'],
  ['eco-calendar', 'ECO — Economic Calendar'],
  ['mon-monitor', 'MON — Monitor / Watchlist'],
  ['hl-search-overlay', 'HL — Unified Search (Ctrl+K)'],
  ['navtree-function-catalog', 'NAVTREE — Function Catalog (2,949 functions)'],
  ['pref-settings', 'PREF — Preferences & Settings'],
  ['tutor-walkthrough', 'TUTOR — Guided Walkthrough'],
  ['multi-pane-workspace', 'Multi-Pane Research Workspace'],
];

const manifest = [];
let written = 0;

for (const [id, title] of CAPTURES) {
  const svgPath = path.join(SHOTS_DIR, id + '.svg');
  if (!fs.existsSync(svgPath)) {
    const sub1 = 'Screenshot placeholder — run npm run docs:screenshots with dev server';
    const sub2 = 'npm run dev (in app terminal), then: npm run docs:screenshots';
    const lines = [
      '<svg width="1440" height="900" xmlns="http://www.w3.org/2000/svg">',
      '<defs><style>text{font-family:monospace}</style></defs>',
      '<rect width="1440" height="900" fill="#080e14"/>',
      '<rect x="0" y="0" width="1440" height="28" fill="#0d1620"/>',
      '<text x="12" y="18" fill="#f5a623" font-size="11" font-weight="700">MM</text>',
      '<text x="48" y="18" fill="#3dd68c" font-size="11">&#9679; SIM</text>',
      '<text x="140" y="18" fill="#8ba8c4" font-size="10">ET 14:23:01  GMT 19:23:01  TPS 42  Latency 12ms  FPS 60</text>',
      '<rect x="0" y="28" width="1440" height="30" fill="#132030"/>',
      '<text x="12" y="48" fill="#f5a623" font-size="10" font-weight="700">CMD</text>',
      '<text x="60" y="48" fill="#8ba8c4" font-size="11">' + title + '</text>',
      '<rect x="1380" y="33" width="48" height="20" fill="#f5a623"/>',
      '<text x="1404" y="47" text-anchor="middle" fill="#000" font-size="10" font-weight="700">GO</text>',
      '<rect x="0" y="58" width="180" height="842" fill="#0d1620"/>',
      '<rect x="180" y="58" width="1260" height="842" fill="#111a23"/>',
      '<rect x="180" y="58" width="1260" height="24" fill="#0c2a5c"/>',
      '<text x="192" y="74" fill="#f5a623" font-size="10" font-weight="700">P1  &#9679; FOCUSED</text>',
      '<rect x="360" y="380" width="720" height="90" fill="#0d1620"/>',
      '<text x="720" y="415" text-anchor="middle" fill="#f5a623" font-size="20" font-weight="700">' + title + '</text>',
      '<text x="720" y="440" text-anchor="middle" fill="#5a7691" font-size="12">' + sub1 + '</text>',
      '<text x="720" y="458" text-anchor="middle" fill="#2a3e52" font-size="11">' + sub2 + '</text>',
      '</svg>',
    ];
    fs.writeFileSync(svgPath, lines.join('\n'), 'utf8');
    written++;
  }
  manifest.push({ id, title, file: id + '.svg', status: 'placeholder' });
}

fs.writeFileSync(path.join(SHOTS_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('Wrote ' + written + ' placeholder SVGs + manifest.json');
