import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'MarketMind Terminal',
  description: 'Complete User Guide — Professional Bloomberg-style Terminal',
  lang: 'en-US',
  base: '/',
  outDir: '../site',
  ignoreDeadLinks: true,
  
  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['style', {}, `
      :root {
        --vp-c-brand: #f5a623;
        --vp-c-brand-dark: #e09310;
        --vp-c-brand-light: #f7c06a;
        --vp-c-bg: #080e14;
        --vp-c-bg-soft: #0d1620;
        --vp-c-bg-mute: #132030;
        --vp-c-text-1: #dce8f4;
        --vp-c-text-2: #8ba8c4;
        --vp-c-text-3: #5a7691;
        --vp-c-divider: #2a3e52;
        --vp-c-border: #2a3e52;
        --vp-font-family-base: 'Cascadia Mono','JetBrains Mono','Consolas','Courier New',monospace;
        --vp-font-family-mono: 'Cascadia Mono','JetBrains Mono','Consolas','Courier New',monospace;
      }
      .vp-doc code { background: #132030; color: #f5a623; }
      .vp-doc table th { background: #0d1620; color: #f5a623; }
      .vp-doc table td { border-color: #2a3e52; }
      .vp-doc table tr:nth-child(even) { background: #080e14; }
      .mnemonic-badge {
        display:inline-block; padding:1px 6px; background:#f5a623; color:#000;
        font-weight:700; font-size:11px; font-family:monospace; margin-right:4px;
      }
      .scope-badge {
        display:inline-block; padding:1px 5px; font-size:10px; font-family:monospace;
        border:1px solid #2a3e52; color:#8ba8c4;
      }
    `],
  ],

  themeConfig: {
    logo: { text: 'MM' },
    siteTitle: 'MarketMind Terminal',

    search: { provider: 'local' },

    nav: [
      { text: 'Getting Started', link: '/guide/getting-started' },
      { text: 'Terminal OS', link: '/guide/terminal-os' },
      { text: 'Workflows', link: '/workflows/research-ticker' },
      { text: 'Mnemonic Reference', link: '/mnemonics/' },
      { text: 'Settings', link: '/guide/settings' },
      { text: 'Appendix', link: '/guide/keyboard-reference' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: '🚀 Getting Started',
          collapsed: false,
          items: [
            { text: 'Quick Start (5 min)', link: '/guide/getting-started' },
            { text: 'Loading Securities', link: '/guide/loading-securities' },
            { text: 'Running Mnemonics', link: '/guide/running-mnemonics' },
            { text: 'If You Get Lost', link: '/guide/recovery' },
          ]
        },
        {
          text: '🖥️ Terminal OS',
          collapsed: false,
          items: [
            { text: 'Workspace & Pane Model', link: '/guide/terminal-os' },
            { text: 'Command Line & GO', link: '/guide/command-line' },
            { text: 'MENU / HELP / CANCEL', link: '/guide/menu-help' },
            { text: 'Keyboard Reference', link: '/guide/keyboard-reference' },
            { text: 'Inspector Overlay', link: '/guide/inspector' },
            { text: 'Context Menu', link: '/guide/context-menu' },
            { text: 'Drill Intents', link: '/guide/drill-intents' },
            { text: 'Search — HL / Ctrl+K', link: '/guide/search' },
          ]
        },
        {
          text: '📊 Data & Provenance',
          items: [
            { text: 'SIM vs LIVE vs STALE', link: '/guide/data-provenance' },
            { text: 'Field Catalog', link: '/guide/field-catalog' },
            { text: 'Lineage & Evidence', link: '/guide/lineage' },
          ]
        },
        {
          text: '⚙️ Settings',
          items: [
            { text: 'Preferences (PREF)', link: '/guide/settings' },
            { text: 'Density & Display', link: '/guide/density' },
            { text: 'Workspace Save/Restore', link: '/guide/workspaces' },
            { text: 'Exports & Reports', link: '/guide/exports' },
            { text: 'Admin & Entitlements', link: '/guide/admin' },
          ]
        },
        {
          text: '🔧 Troubleshooting',
          items: [
            { text: 'FAQ & Common Issues', link: '/guide/troubleshooting' },
            { text: 'Performance Guide', link: '/guide/performance' },
          ]
        },
        {
          text: '📖 Appendix',
          items: [
            { text: 'Full Shortcut Table', link: '/guide/keyboard-reference' },
            { text: 'Glossary', link: '/guide/glossary' },
            { text: 'Feature Inventory', link: '/guide/feature-inventory' },
          ]
        },
      ],

      '/workflows/': [
        {
          text: '🎯 Core Workflows',
          items: [
            { text: 'Research a Ticker', link: '/workflows/research-ticker' },
            { text: 'Build a Monitor', link: '/workflows/build-monitor' },
            { text: 'Set & Manage Alerts', link: '/workflows/alerts' },
            { text: 'Orders & Blotter', link: '/workflows/orders' },
            { text: 'Macro → Ticker Impact', link: '/workflows/macro-to-ticker' },
            { text: 'Global Map Intelligence', link: '/workflows/global-map' },
          ]
        }
      ],

      '/mnemonics/': [
        {
          text: '📋 Mnemonic Index',
          items: [
            { text: 'All Mnemonics (A–Z)', link: '/mnemonics/' },
            { text: 'By Category', link: '/mnemonics/by-category' },
          ]
        },
        {
          text: '📈 Equity & Reference',
          items: [
            { text: 'DES — Description', link: '/mnemonics/DES' },
            { text: 'HP — Historical Pricing', link: '/mnemonics/HP' },
            { text: 'GP — Price Chart', link: '/mnemonics/GP' },
            { text: 'GIP — Intraday Chart', link: '/mnemonics/GIP' },
            { text: 'FA — Financial Analysis', link: '/mnemonics/FA' },
            { text: 'OWN — Ownership', link: '/mnemonics/OWN' },
            { text: 'RELS — Related Securities', link: '/mnemonics/RELS' },
            { text: 'CN — Company News', link: '/mnemonics/CN' },
            { text: 'DVD — Dividends', link: '/mnemonics/DVD' },
            { text: 'EVT — Corporate Events', link: '/mnemonics/EVT' },
            { text: 'MGMT — Management', link: '/mnemonics/MGMT' },
            { text: 'NOTES — Security Notes', link: '/mnemonics/NOTES' },
          ]
        },
        {
          text: '🌍 Market Monitors',
          items: [
            { text: 'WEI — World Indices', link: '/mnemonics/WEI' },
            { text: 'TOP — Top News', link: '/mnemonics/TOP' },
            { text: 'ECO — Economic Calendar', link: '/mnemonics/ECO' },
            { text: 'FXC — FX Cross Matrix', link: '/mnemonics/FXC' },
            { text: 'IMAP — Sector Heatmap', link: '/mnemonics/IMAP' },
            { text: 'MKT — Market Context', link: '/mnemonics/MKT' },
            { text: 'GMOV — Global Movers', link: '/mnemonics/GMOV' },
          ]
        },
        {
          text: '🗺️ Geo Intelligence',
          items: [
            { text: 'GEO — Global Map', link: '/mnemonics/GEO' },
            { text: 'RGN — Region Dossier', link: '/mnemonics/RGN' },
            { text: 'CTY — Country Dossier', link: '/mnemonics/CTY' },
            { text: 'NMAP — News Map', link: '/mnemonics/NMAP' },
            { text: 'SCN — Supply Chain', link: '/mnemonics/SCN' },
          ]
        },
        {
          text: '🔗 Relationships & Risk',
          items: [
            { text: 'RELG — Relationship Graph', link: '/mnemonics/RELG' },
            { text: 'RELT — Relationship Table', link: '/mnemonics/RELT' },
            { text: 'XAS — Cross-Asset Board', link: '/mnemonics/XAS' },
            { text: 'CORR+ — Correlation', link: '/mnemonics/CORR' },
            { text: 'XDRV — Cross-Driver', link: '/mnemonics/XDRV' },
          ]
        },
        {
          text: '📋 Portfolio & Risk',
          items: [
            { text: 'MON — Monitor', link: '/mnemonics/MON' },
            { text: 'ALRT — Alerts', link: '/mnemonics/ALRT' },
            { text: 'MON+ — Monitor Builder', link: '/mnemonics/MON_PLUS' },
            { text: 'ALRT+ — Advanced Alerts', link: '/mnemonics/ALRT_PLUS' },
            { text: 'PORT — Portfolio', link: '/mnemonics/PORT' },
            { text: 'ORD — Order Ticket', link: '/mnemonics/ORD' },
            { text: 'BLTR — Blotter', link: '/mnemonics/BLTR' },
          ]
        },
        {
          text: '⚙️ Platform & Admin',
          items: [
            { text: 'WS — Workspace Manager', link: '/mnemonics/WS' },
            { text: 'NAVTREE — Function Navigator', link: '/mnemonics/NAVTREE' },
            { text: 'FLD — Field Catalog', link: '/mnemonics/FLD' },
            { text: 'LINE — Lineage Viewer', link: '/mnemonics/LINE' },
            { text: 'AUD — Audit Log', link: '/mnemonics/AUD' },
            { text: 'PREF — Preferences', link: '/mnemonics/PREF' },
            { text: 'STAT — System Status', link: '/mnemonics/STAT' },
            { text: 'TUTOR — Tutorial', link: '/mnemonics/TUTOR' },
          ]
        },
        {
          text: '📡 Full Catalog (2,949)',
          items: [
            { text: 'EQUITY (520)', link: '/mnemonics/catalog-equity' },
            { text: 'FX (240)', link: '/mnemonics/catalog-fx' },
            { text: 'RATES (240)', link: '/mnemonics/catalog-rates' },
            { text: 'CREDIT (240)', link: '/mnemonics/catalog-credit' },
            { text: 'DERIVS (540)', link: '/mnemonics/catalog-derivs' },
            { text: 'MACRO (220)', link: '/mnemonics/catalog-macro' },
            { text: 'PORTFOLIO (240)', link: '/mnemonics/catalog-portfolio' },
            { text: 'NEWS & DOCS (220)', link: '/mnemonics/catalog-news' },
            { text: 'OPS & ADMIN (180)', link: '/mnemonics/catalog-ops' },
          ]
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Kryptixxs/marketmind-fixed122' }
    ],

    footer: {
      message: 'MarketMind Terminal — Professional Market Intelligence Platform',
      copyright: 'MarketMind Terminal User Guide'
    },

    editLink: {
      pattern: 'https://github.com/Kryptixxs/marketmind-fixed122/edit/main/docs/user-guide/src/:path',
      text: 'Edit this page'
    },
  },

  markdown: {
    theme: { dark: 'tokyo-night', light: 'tokyo-night' },
    lineNumbers: false,
  },
})
