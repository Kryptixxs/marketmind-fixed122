import type { MarketSector } from '../runtime/panelState';

export type MnemonicCategory =
  | 'EQUITY'
  | 'FX'
  | 'RATES'
  | 'CREDIT'
  | 'DERIVS'
  | 'MACRO'
  | 'PORTFOLIO'
  | 'NEWS_DOCS'
  | 'OPS_ADMIN';

export type MnemonicAssetClass =
  | 'EQUITY'
  | 'ETF'
  | 'INDEX'
  | 'FX'
  | 'RATES'
  | 'CREDIT'
  | 'COMMODITIES'
  | 'DERIVATIVES'
  | 'MACRO'
  | 'PORTFOLIO'
  | 'OPS'
  | 'DOCS'
  | 'COMMS';

export type MnemonicFunctionType =
  | 'REFERENCE'
  | 'MONITOR'
  | 'SCREENER'
  | 'ANALYTICS'
  | 'CHART'
  | 'EVENT'
  | 'WORKFLOW'
  | 'ADMIN';

export type MnemonicScope =
  | 'SECURITY_SCOPED'
  | 'UNIVERSE_SCOPED'
  | 'REGION_SCOPED'
  | 'CROSS_ASSET'
  | 'PORTFOLIO_SCOPED';

export type MnemonicRecipeId =
  | 'MonitorTable'
  | 'ReferenceSheet'
  | 'AnalyticsBoard'
  | 'Screener'
  | 'CurveBoard'
  | 'VolBoard'
  | 'NewsHub'
  | 'RelationshipBoard'
  | 'OpsConsole'
  | 'PortfolioBoard';

export interface CatalogMnemonic {
  code: string;
  title: string;
  category: MnemonicCategory;
  assetClass: MnemonicAssetClass;
  functionType: MnemonicFunctionType;
  scope: MnemonicScope;
  requiresSecurity: boolean;
  requiresUniverse: boolean;
  defaultRecipeId: MnemonicRecipeId;
  defaultLayout: 'table' | 'news' | 'chart' | 'form' | 'kv' | 'composite';
  defaultTimeframe: 'INTRADAY' | '1D' | '1W' | '1M' | '3M' | '1Y' | '5Y';
  purposeSignature: string;
  fieldSet: string[];
  relatedCodes: string[];
  keywords: string[];
  searchSynonyms: string[];
  helpMarkdown: string;
  entityKindsSupported: Array<
    'SECURITY' | 'INDEX' | 'FX' | 'RATE' | 'FUTURE' | 'OPTION' | 'ETF' | 'COMPANY' | 'SECTOR' | 'INDUSTRY' | 'COUNTRY' | 'PERSON' | 'HOLDER' | 'NEWS' | 'EVENT' | 'FIELD' | 'FUNCTION' | 'MONITOR' | 'WORKSPACE' | 'ALERT' | 'ORDER' | 'TRADE'
  >;
}

interface SeedDef {
  code: string;
  title: string;
  category: MnemonicCategory;
  assetClass: MnemonicAssetClass;
  functionType: MnemonicFunctionType;
  scope: MnemonicScope;
  requiresSecurity: boolean;
  keywords: string[];
  synonyms?: string[];
  recipe?: MnemonicRecipeId;
  fieldSet?: string[];
  purpose?: string;
}

const ALL_SECTORS: MarketSector[] = ['EQUITY', 'CORP', 'CURNCY', 'COMDTY', 'INDEX', 'GOVT', 'MUNI', 'MTGE'];
const ALL_ENTITY_KINDS: CatalogMnemonic['entityKindsSupported'] = [
  'SECURITY', 'INDEX', 'FX', 'RATE', 'FUTURE', 'OPTION', 'ETF', 'COMPANY', 'SECTOR', 'INDUSTRY', 'COUNTRY', 'PERSON', 'HOLDER', 'NEWS', 'EVENT', 'FIELD', 'FUNCTION', 'MONITOR', 'WORKSPACE', 'ALERT', 'ORDER', 'TRADE',
];

const CATEGORY_LAYOUT: Record<MnemonicCategory, CatalogMnemonic['defaultLayout']> = {
  EQUITY: 'composite',
  FX: 'table',
  RATES: 'composite',
  CREDIT: 'composite',
  DERIVS: 'composite',
  MACRO: 'composite',
  PORTFOLIO: 'composite',
  NEWS_DOCS: 'news',
  OPS_ADMIN: 'table',
};

const CATEGORY_TIMEFRAME: Record<MnemonicCategory, CatalogMnemonic['defaultTimeframe']> = {
  EQUITY: '1M',
  FX: '1D',
  RATES: '1W',
  CREDIT: '1M',
  DERIVS: '1D',
  MACRO: '3M',
  PORTFOLIO: '1M',
  NEWS_DOCS: '1W',
  OPS_ADMIN: '1D',
};

const CATEGORY_RECIPE: Record<MnemonicCategory, MnemonicRecipeId> = {
  EQUITY: 'ReferenceSheet',
  FX: 'MonitorTable',
  RATES: 'CurveBoard',
  CREDIT: 'AnalyticsBoard',
  DERIVS: 'VolBoard',
  MACRO: 'AnalyticsBoard',
  PORTFOLIO: 'PortfolioBoard',
  NEWS_DOCS: 'NewsHub',
  OPS_ADMIN: 'OpsConsole',
};

const CATEGORY_WORDS: Record<MnemonicCategory, string[]> = {
  EQUITY: ['valuation', 'earnings', 'ownership', 'liquidity', 'event', 'guidance', 'cashflow', 'returns', 'volatility', 'peer', 'segment', 'revision'],
  FX: ['carry', 'basis', 'forwards', 'volatility', 'flow', 'positioning', 'cross', 'implied', 'spot', 'hedge', 'calendar', 'regime'],
  RATES: ['curve', 'fly', 'basis', 'swap', 'spread', 'inflation', 'policy', 'term', 'duration', 'auction', 'positioning', 'surprise'],
  CREDIT: ['spread', 'issuer', 'rating', 'default', 'curve', 'liquidity', 'issuance', 'desk', 'relative', 'screen', 'watch', 'event'],
  DERIVS: ['surface', 'gamma', 'delta', 'vega', 'theta', 'term', 'flow', 'strikes', 'chain', 'hedge', 'smile', 'structure'],
  MACRO: ['calendar', 'surprise', 'inflation', 'labor', 'growth', 'policy', 'nowcast', 'cross-asset', 'event', 'region', 'regime', 'pulse'],
  PORTFOLIO: ['exposure', 'factor', 'attribution', 'stress', 'scenario', 'monitor', 'limits', 'liquidity', 'hedge', 'risk', 'returns', 'budget'],
  NEWS_DOCS: ['news', 'headline', 'narrative', 'theme', 'filings', 'extraction', 'timeline', 'signal', 'sentiment', 'mapping', 'entity', 'region'],
  OPS_ADMIN: ['status', 'latency', 'audit', 'policy', 'entitlement', 'governance', 'diagnostics', 'cache', 'offline', 'routing', 'permissions', 'health'],
};

const CATEGORY_CODES: Record<MnemonicCategory, string[]> = {
  EQUITY: ['DES', 'HP', 'FA', 'OWN', 'DVD', 'CN', 'TOP', 'RELS', 'COMP', 'PEER', 'SCRN', 'RANK', 'EE', 'EST', 'REC', 'PT', 'BETA', 'KPI', 'GUID', 'INS'],
  FX: ['SPOT', 'FWDS', 'DXY', 'CARRY', 'VOLFX', 'CORRFX', 'TOP', 'NREL', 'HP', 'GP', 'FXC', 'CURV', 'NDF', 'XCCY', 'FXMAJ', 'FXEM', 'FXVOL', 'RR', 'BF'],
  RATES: ['CURV', 'YLD', 'FRA', 'SWAP', 'OIS', 'AUCT', 'ECO', 'TOP', 'RGN', 'FLOW1', 'R1', 'M1', 'CURV2Y', 'CUR10Y', 'CURINF', 'GOVT', 'SURP', 'CB'],
  CREDIT: ['BOND', 'ISS', 'RAT', 'CDS', 'SPRD', 'OAS', 'HY', 'IG', 'SCEN', 'VAR', 'R1', 'S1', 'CRIG', 'CRHY', 'CRCDS', 'ATTR', 'LIMIT', 'PNL'],
  DERIVS: ['CHAIN', 'SURF', 'IV', 'RVOL', 'SKEW', 'GEX', 'DEX', 'FLOWO', 'TERM', 'STRAT', 'VOL1', 'CHN1', 'RR', 'BF', 'VOLS', 'BETA', 'HP', 'DES'],
  MACRO: ['ECO', 'CAL', 'CPI', 'NFP', 'PMI', 'CB', 'STIM', 'SURP', 'NOW', 'REG', 'RGN', 'TOP', 'SHCK', 'MACRO', 'CMDEN', 'CMDMET', 'CMDAG', 'XDRV'],
  PORTFOLIO: ['PORT', 'RISK', 'VAR', 'STRESS', 'SCEN', 'FACTR', 'HEDGE', 'PNL', 'ATTR', 'LIMIT', 'MON', 'ALRT+', 'KILL', 'EXP', 'XDRV', 'BETA', 'DES'],
  NEWS_DOCS: ['TOP', 'N', 'CN', 'NMAP', 'NTIM', 'NREL', 'SENT', 'RUMR', 'REGN', 'GEO', 'DOCS', 'CLIP', 'THEME', 'BASK', 'RELG', 'SENTR'],
  OPS_ADMIN: ['STAT', 'LAT', 'ERR', 'AUD', 'ENT', 'POL', 'QLT', 'MAP', 'RPT', 'WS', 'MON', 'IB', 'EXPCTR', 'CLIP', 'KEYMAP', 'NAVTREE'],
};

const BASE_SEEDS: SeedDef[] = [
  { code: 'DES', title: 'Security Description', category: 'EQUITY', assetClass: 'EQUITY', functionType: 'REFERENCE', scope: 'SECURITY_SCOPED', requiresSecurity: true, keywords: ['description', 'fundamentals'], synonyms: ['describe', 'overview'], recipe: 'ReferenceSheet', fieldSet: ['PX_LAST', 'PE_RATIO', 'DIV_YLD'] },
  { code: 'DVD', title: 'Dividend History', category: 'EQUITY', assetClass: 'EQUITY', functionType: 'REFERENCE', scope: 'SECURITY_SCOPED', requiresSecurity: true, keywords: ['dividend', 'payout'], synonyms: ['dividends'], recipe: 'ReferenceSheet', fieldSet: ['DIV_YLD', 'DIV_FREQ', 'PX_LAST'] },
  { code: 'OWN', title: 'Ownership Analysis', category: 'EQUITY', assetClass: 'EQUITY', functionType: 'ANALYTICS', scope: 'SECURITY_SCOPED', requiresSecurity: true, keywords: ['ownership', 'holders'], synonyms: ['shareholders'], recipe: 'RelationshipBoard', fieldSet: ['INST_OWN', 'FLOAT_SHARES', 'PX_LAST'] },
  { code: 'UNIV', title: 'Universe Builder', category: 'EQUITY', assetClass: 'ETF', functionType: 'SCREENER', scope: 'UNIVERSE_SCOPED', requiresSecurity: false, keywords: ['universe', 'builder'], recipe: 'Screener', fieldSet: ['PX_LAST', 'MKT_CAP', 'VOLUME'] },
  { code: 'SCRN', title: 'Screener', category: 'EQUITY', assetClass: 'EQUITY', functionType: 'SCREENER', scope: 'UNIVERSE_SCOPED', requiresSecurity: false, keywords: ['screen', 'filters'], recipe: 'Screener', fieldSet: ['PX_LAST', 'PE_RATIO', 'BETA'] },
  { code: 'RANK', title: 'Ranking Engine', category: 'EQUITY', assetClass: 'EQUITY', functionType: 'ANALYTICS', scope: 'UNIVERSE_SCOPED', requiresSecurity: false, keywords: ['rank', 'score'], recipe: 'MonitorTable', fieldSet: ['PX_LAST', 'PCT_CHG', 'BETA'] },
  { code: 'CURV', title: 'Yield Curve Workbench', category: 'RATES', assetClass: 'RATES', functionType: 'CHART', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['curve', 'yield'], recipe: 'CurveBoard', fieldSet: ['YLD_2Y', 'YLD_10Y', 'SPREAD_2S10S'] },
  { code: 'CHAIN', title: 'Options Chain', category: 'DERIVS', assetClass: 'DERIVATIVES', functionType: 'REFERENCE', scope: 'SECURITY_SCOPED', requiresSecurity: true, keywords: ['options', 'chain'], synonyms: ['options chain'], recipe: 'VolBoard', fieldSet: ['IV', 'DELTA', 'GAMMA'] },
  { code: 'TOP', title: 'Top News', category: 'NEWS_DOCS', assetClass: 'DOCS', functionType: 'EVENT', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['news', 'headlines'], recipe: 'NewsHub', fieldSet: ['NEWS_SCORE', 'SENTIMENT', 'PX_LAST'] },
  { code: 'N', title: 'News Search', category: 'NEWS_DOCS', assetClass: 'DOCS', functionType: 'REFERENCE', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['news', 'search'], recipe: 'NewsHub', fieldSet: ['NEWS_SCORE', 'SENTIMENT', 'PX_LAST'] },
  { code: 'CN', title: 'Company News', category: 'NEWS_DOCS', assetClass: 'DOCS', functionType: 'EVENT', scope: 'SECURITY_SCOPED', requiresSecurity: true, keywords: ['company news'], recipe: 'NewsHub', fieldSet: ['NEWS_SCORE', 'SENTIMENT', 'PX_LAST'] },
  { code: 'PORT', title: 'Portfolio Monitor', category: 'PORTFOLIO', assetClass: 'PORTFOLIO', functionType: 'MONITOR', scope: 'PORTFOLIO_SCOPED', requiresSecurity: false, keywords: ['portfolio', 'positions'], recipe: 'PortfolioBoard', fieldSet: ['PX_LAST', 'PCT_CHG', 'VAR_1D'] },
  { code: 'MON', title: 'Monitor Watchlist', category: 'OPS_ADMIN', assetClass: 'OPS', functionType: 'MONITOR', scope: 'UNIVERSE_SCOPED', requiresSecurity: false, keywords: ['monitor', 'watchlist'], recipe: 'MonitorTable', fieldSet: ['PX_LAST', 'PCT_CHG', 'VOLUME'] },
  { code: 'FCAT', title: 'Function Catalog', category: 'OPS_ADMIN', assetClass: 'OPS', functionType: 'REFERENCE', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['function catalog', 'taxonomy'], recipe: 'OpsConsole', fieldSet: ['PX_LAST', 'PCT_CHG', 'NEWS_SCORE'] },
  { code: 'RPT', title: 'Report Builder', category: 'OPS_ADMIN', assetClass: 'DOCS', functionType: 'WORKFLOW', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['report', 'export'], recipe: 'OpsConsole', fieldSet: ['PX_LAST', 'PCT_CHG', 'NEWS_SCORE'] },
  { code: 'STAT', title: 'System Status', category: 'OPS_ADMIN', assetClass: 'OPS', functionType: 'ADMIN', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['status', 'latency'], recipe: 'OpsConsole', fieldSet: ['LATENCY_MS', 'FPS', 'DROP_TICKS'] },
];

const TARGET_COUNTS: Record<MnemonicCategory, number> = {
  EQUITY: 1200,
  FX: 600,
  RATES: 600,
  CREDIT: 600,
  DERIVS: 1200,
  MACRO: 600,
  PORTFOLIO: 600,
  NEWS_DOCS: 500,
  OPS_ADMIN: 400,
};

const COUNTRY_CODES = ['US', 'CN', 'JP', 'GB', 'DE', 'FR', 'IN', 'BR', 'AU', 'CA', 'KR', 'SG', 'CH', 'NL', 'SE', 'ZA', 'MX', 'ES', 'IT', 'ID'];
const SECTOR_CODES = ['TECH', 'FIN', 'HLTH', 'IND', 'ENRG', 'CONS', 'UTIL', 'MAT', 'REIT', 'TEL', 'AUTO', 'AERO'];
const INDUSTRY_CODES = ['SEMIS', 'BANKS', 'SOFTW', 'INSUR', 'BIOPH', 'AERO', 'MEDIA', 'CHEM', 'SHIP', 'MINNG', 'RETL', 'AUTO'];

function safeCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
}

function uniq<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function relatedFor(category: MnemonicCategory, code: string, extras: string[] = []): string[] {
  const core = CATEGORY_CODES[category] ?? [];
  // Add cross-category staples so every mnemonic has nav breadth
  const crossCat = ['DES', 'TOP', 'LINE', 'FLD', 'NAV', 'NX', 'MON', 'RPT', 'WS', 'NAVTREE', 'TUTOR', 'PREF'];
  const pool = uniq([code, ...extras, ...core, ...crossCat]);
  return pool.filter((c) => c !== code).slice(0, 16);
}

// ── Per-recipe descriptions for richer help text ──────────────────────────
const RECIPE_DESC: Record<MnemonicRecipeId, string> = {
  MonitorTable: 'Streaming monitor table with sortable columns, movers highlight, and alert strip.',
  ReferenceSheet: 'Key fields grid, fundamentals tiles, peer table, and news/events strip.',
  AnalyticsBoard: 'Small-multiple charts, ranked lists, factor attribution, and evidence panel.',
  Screener: 'Filter panel + results table + ranking export. Drill any row to DES.',
  CurveBoard: 'Term structure chart, spread ladder, regime indicator, and movers.',
  VolBoard: 'Surface slices, skew chart, flow tape, and term structure.',
  NewsHub: 'Headline tape, extracted entities, impact ticker list, and timeline.',
  RelationshipBoard: 'Graph edge table, strength heatmap, evidence trail, and expand controls.',
  OpsConsole: 'Status dashboard, log stream, health metrics, and drill-to-fix actions.',
  PortfolioBoard: 'Position table, exposure chart, scenario drill, and limit monitor.',
};

// ── Per-category purpose verbs ─────────────────────────────────────────────
const CATEGORY_VERB: Record<MnemonicCategory, string> = {
  EQUITY:     'Analyze equity securities',
  FX:         'Monitor FX pairs and flows',
  RATES:      'Explore interest rate curves',
  CREDIT:     'Track credit spreads and issuers',
  DERIVS:     'Inspect derivatives surfaces and flows',
  MACRO:      'Understand macro calendar and signals',
  PORTFOLIO:  'Manage portfolio risk and attribution',
  NEWS_DOCS:  'Browse news, signals, and narratives',
  OPS_ADMIN:  'Operate and configure the terminal',
};

function helpFor(
  code: string,
  title: string,
  category: MnemonicCategory,
  fieldSet: string[],
  relatedCodes: string[],
  recipe: MnemonicRecipeId,
): string {
  const recipeDesc = RECIPE_DESC[recipe] ?? 'Dense multi-tile layout with drilling and provenance.';
  const verb = CATEGORY_VERB[category] ?? 'Analyze market data';
  const topRelated = relatedCodes.slice(0, 10).join(', ');
  return `# ${code} — ${title}

**Purpose:** ${verb}. ${recipeDesc}

**Key fields:** ${fieldSet.slice(0, 5).join(' · ')}
**Recipe:** ${recipe}
**Category:** ${category}

**Keyboard:** Enter GO · Shift+Enter new pane · Alt+Enter Inspect · F2 MENU · F1 HELP · Ctrl+K search
**Related:** ${topRelated}

> Click any row to drill. Shift+Click opens in a new pane. Alt+Click opens the Inspector overlay.`;
}

function makeEntry(seed: SeedDef): CatalogMnemonic {
  const code = safeCode(seed.code);
  const fieldSet = seed.fieldSet && seed.fieldSet.length > 0
    ? seed.fieldSet
    : ['PX_LAST', 'PCT_CHG', 'VOLUME', 'BETA'];
  const relatedCodes = relatedFor(seed.category, code);
  const recipe = seed.recipe ?? CATEGORY_RECIPE[seed.category];
  return {
    code,
    title: seed.title,
    category: seed.category,
    assetClass: seed.assetClass,
    functionType: seed.functionType,
    scope: seed.scope,
    requiresSecurity: seed.requiresSecurity,
    requiresUniverse: !seed.requiresSecurity,
    defaultRecipeId: recipe,
    defaultLayout: CATEGORY_LAYOUT[seed.category],
    defaultTimeframe: CATEGORY_TIMEFRAME[seed.category],
    purposeSignature: seed.purpose ?? `${seed.assetClass}:${seed.functionType}:${seed.scope}:${recipe}`,
    fieldSet,
    relatedCodes,
    keywords: uniq([seed.category.toLowerCase(), seed.functionType.toLowerCase(), seed.scope.toLowerCase(), ...seed.keywords]),
    searchSynonyms: seed.synonyms ?? [],
    helpMarkdown: helpFor(code, seed.title, seed.category, fieldSet, relatedCodes, recipe),
    entityKindsSupported: ALL_ENTITY_KINDS,
  };
}

function pickCategoryFromIndex(i: number): MnemonicCategory {
  const order: MnemonicCategory[] = ['EQUITY', 'FX', 'RATES', 'CREDIT', 'DERIVS', 'MACRO', 'PORTFOLIO', 'NEWS_DOCS', 'OPS_ADMIN'];
  return order[i % order.length]!;
}

function recipeForType(type: MnemonicFunctionType): MnemonicRecipeId {
  if (type === 'REFERENCE') return 'ReferenceSheet';
  if (type === 'MONITOR') return 'MonitorTable';
  if (type === 'SCREENER') return 'Screener';
  if (type === 'CHART') return 'CurveBoard';
  if (type === 'EVENT') return 'NewsHub';
  if (type === 'WORKFLOW' || type === 'ADMIN') return 'OpsConsole';
  return 'AnalyticsBoard';
}

function assetForCategory(category: MnemonicCategory): MnemonicAssetClass {
  if (category === 'EQUITY') return 'EQUITY';
  if (category === 'FX') return 'FX';
  if (category === 'RATES') return 'RATES';
  if (category === 'CREDIT') return 'CREDIT';
  if (category === 'DERIVS') return 'DERIVATIVES';
  if (category === 'MACRO') return 'MACRO';
  if (category === 'PORTFOLIO') return 'PORTFOLIO';
  if (category === 'NEWS_DOCS') return 'DOCS';
  return 'OPS';
}

function genericGeneratedSeed(category: MnemonicCategory, idx: number): SeedDef {
  const words = CATEGORY_WORDS[category];
  const w1 = words[(idx * 3) % words.length]!;
  const w2 = words[(idx * 7 + 2) % words.length]!;
  const functionType: MnemonicFunctionType = (['REFERENCE', 'MONITOR', 'SCREENER', 'ANALYTICS', 'CHART', 'EVENT', 'WORKFLOW', 'ADMIN'] as const)[idx % 8]!;
  const scope: MnemonicScope = (['SECURITY_SCOPED', 'UNIVERSE_SCOPED', 'REGION_SCOPED', 'CROSS_ASSET', 'PORTFOLIO_SCOPED'] as const)[idx % 5]!;
  const codePrefix = { EQUITY: 'EQ', FX: 'FX', RATES: 'RT', CREDIT: 'CR', DERIVS: 'DV', MACRO: 'MC', PORTFOLIO: 'PF', NEWS_DOCS: 'ND', OPS_ADMIN: 'OP' }[category];
  return {
    code: `${codePrefix}${String(idx + 1).padStart(4, '0')}`,
    title: `${category.replace('_', ' ')} ${w1} ${w2} ${functionType}`,
    category,
    assetClass: assetForCategory(category),
    functionType,
    scope,
    requiresSecurity: scope === 'SECURITY_SCOPED',
    keywords: [w1, w2, functionType.toLowerCase(), scope.toLowerCase()],
    synonyms: [`${w1} ${w2}`, `${category.toLowerCase()} ${functionType.toLowerCase()}`],
    recipe: recipeForType(functionType),
    fieldSet: ['PX_LAST', 'PCT_CHG', 'VOLUME', 'BETA', 'NEWS_SCORE'],
    purpose: `${category}:${functionType}:${w1}:${w2}`,
  };
}

function familySeeds(): SeedDef[] {
  const out: SeedDef[] = [];

  for (let i = 1; i <= 500; i += 1) {
    const category = pickCategoryFromIndex(i);
    // Each rank family has a distinct field based on modulo
    const RANK_FIELDS: Array<[string, string, string, string]> = [
      ['PCT_CHG', 'VOLUME', 'MKT_CAP', 'BETA'],
      ['PE_RATIO', 'EV_EBITDA', 'PB_RATIO', 'PS_RATIO'],
      ['EPS_GROWTH', 'REV_GROWTH', 'FCF_MARGIN', 'ROE'],
      ['VOL_30D', 'VAR_1D', 'DD_MAX', 'BETA'],
      ['DIV_YLD', 'BUYB_YLD', 'FCF_YLD', 'EARN_YLD'],
      ['IV', 'RVOL', 'SKEW_25D', 'GEX'],
      ['SPREAD_OAS', 'CDS_5Y', 'RAT_SCORE', 'DEBT_RATIO'],
      ['NEWS_SCORE', 'SENTIMENT', 'FLOW_NET', 'SIGNAL_STR'],
    ];
    const fields = RANK_FIELDS[i % RANK_FIELDS.length]!;
    const RANK_TITLES = ['Momentum', 'Value', 'Quality', 'Risk-Adj Return', 'Dividend Yield', 'Vol Surface', 'Credit Score', 'Sentiment'];
    const rankTitle = RANK_TITLES[i % RANK_TITLES.length]!;
    out.push({
      code: `R${i}`,
      title: `Rank by ${rankTitle} — Universe ${Math.ceil(i / 8)}`,
      category,
      assetClass: assetForCategory(category),
      functionType: 'ANALYTICS',
      scope: 'UNIVERSE_SCOPED',
      requiresSecurity: false,
      keywords: ['rank', 'universe', rankTitle.toLowerCase(), `metric-${i}`, 'scoring'],
      synonyms: [`ranking ${rankTitle.toLowerCase()}`, `sort by ${rankTitle.toLowerCase()}`],
      recipe: 'MonitorTable',
      fieldSet: Array.from(fields),
      purpose: `RANK:${category}:${rankTitle}:${i}`,
    });
  }
  for (let i = 1; i <= 500; i += 1) {
    const category = pickCategoryFromIndex(i + 2);
    const MON_FIELDS: Array<[string, string, string, string]> = [
      ['PX_LAST', 'PCT_CHG', 'VOLUME', 'NEWS_SCORE'],
      ['PX_LAST', 'BID_ASK_SPREAD', 'VWAP', 'VOL_30D'],
      ['PX_LAST', 'PCT_CHG_1W', 'PCT_CHG_1M', 'YTD_PCT'],
      ['PE_RATIO', 'PB_RATIO', 'PS_RATIO', 'MKT_CAP'],
      ['DIV_YLD', 'BUYB_YLD', 'FCF_YLD', 'PAYOUT_RATIO'],
      ['BETA', 'CORR_SPX', 'VAR_1D', 'VOL_60D'],
      ['IV', 'RVOL', 'IV_RANK', 'SKEW_25D'],
      ['SPREAD_OAS', 'YLD_TO_WORST', 'DURATION', 'CONVEXITY'],
    ];
    const fields = MON_FIELDS[i % MON_FIELDS.length]!;
    const MON_UNIVERSE = ['Large Cap', 'Mid Cap', 'Small Cap', 'Tech Sector', 'Financials', 'Healthcare', 'Energy', 'Global EM'];
    const universe = MON_UNIVERSE[i % MON_UNIVERSE.length]!;
    out.push({
      code: `M${i}`,
      title: `Monitor — ${universe} Set ${Math.ceil(i / 8)}`,
      category,
      assetClass: assetForCategory(category),
      functionType: 'MONITOR',
      scope: 'UNIVERSE_SCOPED',
      requiresSecurity: false,
      keywords: ['monitor', 'watchlist', universe.toLowerCase(), `set-${i}`, 'streaming'],
      synonyms: [`${universe.toLowerCase()} monitor`, `watchlist ${i}`],
      recipe: 'MonitorTable',
      fieldSet: Array.from(fields),
      purpose: `MON:${category}:${universe}:${i}`,
    });
  }
  for (let i = 1; i <= 300; i += 1) {
    const category = pickCategoryFromIndex(i + 4);
    const SCR_FILTERS: Array<[string, string, string, string]> = [
      ['PX_LAST', 'PE_RATIO', 'BETA', 'VOLUME'],
      ['MKT_CAP', 'EPS_GROWTH', 'ROE', 'FCF_MARGIN'],
      ['DIV_YLD', 'PAYOUT_RATIO', 'DEBT_EQUITY', 'CURRENT_RATIO'],
      ['VOL_30D', 'VAR_1D', 'BETA', 'MAX_DD'],
      ['REV_GROWTH', 'EBITDA_MARGIN', 'NET_MARGIN', 'ASSET_TURNOVER'],
      ['IV', 'RVOL', 'SKEW_25D', 'GAMMA'],
      ['SPREAD_OAS', 'DURATION', 'YTM', 'CDS_5Y'],
      ['PCT_CHG_1M', 'PCT_CHG_3M', 'MOMENTUM_SCORE', 'VOLUME_RATIO'],
    ];
    const fields = SCR_FILTERS[i % SCR_FILTERS.length]!;
    const SCR_THEMES = ['Value', 'Growth', 'Dividend', 'Low Volatility', 'Quality', 'Options', 'Credit', 'Momentum'];
    const theme = SCR_THEMES[i % SCR_THEMES.length]!;
    out.push({
      code: `S${i}`,
      title: `Screener — ${theme} Filter ${Math.ceil(i / 8)}`,
      category,
      assetClass: assetForCategory(category),
      functionType: 'SCREENER',
      scope: 'UNIVERSE_SCOPED',
      requiresSecurity: false,
      keywords: ['screener', theme.toLowerCase(), 'filter', `preset-${i}`, 'screen'],
      synonyms: [`${theme.toLowerCase()} screen`, `filter ${theme.toLowerCase()}`],
      recipe: 'Screener',
      fieldSet: Array.from(fields),
      purpose: `SCR:${category}:${theme}:${i}`,
    });
  }
  for (const cc of COUNTRY_CODES) {
    out.push({
      code: `CTY${cc}`,
      title: `${cc} Country Dossier`,
      category: 'MACRO',
      assetClass: 'MACRO',
      functionType: 'REFERENCE',
      scope: 'REGION_SCOPED',
      requiresSecurity: false,
      keywords: ['country', 'dossier', cc.toLowerCase()],
      synonyms: [`country ${cc}`, `${cc} macro`],
      recipe: 'AnalyticsBoard',
      fieldSet: ['GDP_GROWTH', 'CPI_YOY', 'YLD_10Y', 'FX_SPOT'],
      purpose: `COUNTRY:${cc}`,
    });
  }
  for (const s of SECTOR_CODES) {
    out.push({
      code: `SEC${s}`.slice(0, 6),
      title: `${s} Sector Dossier`,
      category: 'EQUITY',
      assetClass: 'EQUITY',
      functionType: 'REFERENCE',
      scope: 'UNIVERSE_SCOPED',
      requiresSecurity: false,
      keywords: ['sector', s.toLowerCase(), 'dossier'],
      synonyms: [`sector ${s}`, `${s} equities`],
      recipe: 'ReferenceSheet',
      fieldSet: ['PX_LAST', 'PCT_CHG', 'MKT_CAP', 'PE_RATIO'],
      purpose: `SECTOR:${s}`,
    });
  }
  for (const i of INDUSTRY_CODES) {
    out.push({
      code: `IND${i}`.slice(0, 6),
      title: `${i} Industry Dossier`,
      category: 'EQUITY',
      assetClass: 'EQUITY',
      functionType: 'REFERENCE',
      scope: 'UNIVERSE_SCOPED',
      requiresSecurity: false,
      keywords: ['industry', i.toLowerCase(), 'dossier'],
      synonyms: [`industry ${i}`, `${i} peers`],
      recipe: 'RelationshipBoard',
      fieldSet: ['PX_LAST', 'PCT_CHG', 'EV_EBITDA', 'VOLUME'],
      purpose: `INDUSTRY:${i}`,
    });
  }

  out.push({ code: 'DESP', title: 'Security Description Plus', category: 'EQUITY', assetClass: 'EQUITY', functionType: 'REFERENCE', scope: 'SECURITY_SCOPED', requiresSecurity: true, keywords: ['description', 'plus'], synonyms: ['des+'], recipe: 'ReferenceSheet', fieldSet: ['PX_LAST', 'PE_RATIO', 'BETA'], purpose: 'DES:plus' });
  out.push({ code: 'DES2', title: 'Security Description Valuation', category: 'EQUITY', assetClass: 'EQUITY', functionType: 'REFERENCE', scope: 'SECURITY_SCOPED', requiresSecurity: true, keywords: ['description', 'valuation'], recipe: 'ReferenceSheet', fieldSet: ['PE_RATIO', 'EV_EBITDA', 'PX_LAST'], purpose: 'DES:valuation' });
  out.push({ code: 'DESG', title: 'Security Description Growth', category: 'EQUITY', assetClass: 'EQUITY', functionType: 'REFERENCE', scope: 'SECURITY_SCOPED', requiresSecurity: true, keywords: ['description', 'growth'], recipe: 'ReferenceSheet', fieldSet: ['REV_GROWTH', 'EPS_GROWTH', 'PX_LAST'], purpose: 'DES:growth' });
  out.push({ code: 'DESR', title: 'Security Description Risk', category: 'EQUITY', assetClass: 'EQUITY', functionType: 'REFERENCE', scope: 'SECURITY_SCOPED', requiresSecurity: true, keywords: ['description', 'risk'], recipe: 'ReferenceSheet', fieldSet: ['BETA', 'VOL_30D', 'VAR_1D'], purpose: 'DES:risk' });
  for (let i = 1; i <= 10; i += 1) {
    out.push({
      code: `HP${i}`,
      title: `History Lens ${i}`,
      category: 'EQUITY',
      assetClass: 'EQUITY',
      functionType: 'CHART',
      scope: 'SECURITY_SCOPED',
      requiresSecurity: true,
      keywords: ['history', 'returns', 'drawdown', `lens-${i}`],
      synonyms: [`history ${i}`, `returns view ${i}`],
      recipe: 'AnalyticsBoard',
      fieldSet: ['PX_LAST', 'PCT_CHG', 'VOL_30D', 'DD_MAX'],
      purpose: `HP:${i}`,
    });
    out.push({
      code: `FA${i}`,
      title: `Financial Lens ${i}`,
      category: 'EQUITY',
      assetClass: 'EQUITY',
      functionType: 'ANALYTICS',
      scope: 'SECURITY_SCOPED',
      requiresSecurity: true,
      keywords: ['financial analysis', `lens-${i}`],
      synonyms: [`financial ${i}`, `fa ${i}`],
      recipe: 'AnalyticsBoard',
      fieldSet: ['REV_GROWTH', 'EPS_GROWTH', 'FCF_MARGIN', 'ROE'],
      purpose: `FA:${i}`,
    });
  }

  const cross: SeedDef[] = [
    { code: 'CURV2Y', title: '2Y Curve Monitor', category: 'RATES', assetClass: 'RATES', functionType: 'CHART', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['curve', '2y'], recipe: 'CurveBoard', fieldSet: ['YLD_2Y', 'SPREAD_2S10S', 'CPI_YOY'], purpose: 'curve:2y' },
    { code: 'CUR10Y', title: '10Y Curve Monitor', category: 'RATES', assetClass: 'RATES', functionType: 'CHART', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['curve', '10y'], synonyms: ['curv10y'], recipe: 'CurveBoard', fieldSet: ['YLD_10Y', 'SPREAD_2S10S', 'TERM_PREM'], purpose: 'curve:10y' },
    { code: 'CURINF', title: 'Inflation Curve Monitor', category: 'RATES', assetClass: 'RATES', functionType: 'CHART', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['curve', 'inflation'], recipe: 'CurveBoard', fieldSet: ['BREAKEVEN_5Y', 'BREAKEVEN_10Y', 'CPI_YOY'], purpose: 'curve:inflation' },
    { code: 'FXMAJ', title: 'FX Majors Board', category: 'FX', assetClass: 'FX', functionType: 'MONITOR', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['fx majors'], recipe: 'MonitorTable', fieldSet: ['FX_SPOT', 'PCT_CHG', 'VOL_30D'], purpose: 'fx:majors' },
    { code: 'FXEM', title: 'FX EM Board', category: 'FX', assetClass: 'FX', functionType: 'MONITOR', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['fx em'], recipe: 'MonitorTable', fieldSet: ['FX_SPOT', 'PCT_CHG', 'CARRY'], purpose: 'fx:em' },
    { code: 'FXVOL', title: 'FX Volatility Board', category: 'FX', assetClass: 'FX', functionType: 'ANALYTICS', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['fx vol'], recipe: 'VolBoard', fieldSet: ['IV', 'RVOL', 'VOL_TERM'], purpose: 'fx:vol' },
    { code: 'CRIG', title: 'Credit IG Monitor', category: 'CREDIT', assetClass: 'CREDIT', functionType: 'MONITOR', scope: 'UNIVERSE_SCOPED', requiresSecurity: false, keywords: ['credit ig'], recipe: 'MonitorTable', fieldSet: ['SPREAD_IG', 'PX_LAST', 'PCT_CHG'], purpose: 'credit:ig' },
    { code: 'CRHY', title: 'Credit HY Monitor', category: 'CREDIT', assetClass: 'CREDIT', functionType: 'MONITOR', scope: 'UNIVERSE_SCOPED', requiresSecurity: false, keywords: ['credit hy'], recipe: 'MonitorTable', fieldSet: ['SPREAD_HY', 'PX_LAST', 'PCT_CHG'], purpose: 'credit:hy' },
    { code: 'CRCDS', title: 'Credit CDS Board', category: 'CREDIT', assetClass: 'CREDIT', functionType: 'ANALYTICS', scope: 'UNIVERSE_SCOPED', requiresSecurity: false, keywords: ['credit cds'], recipe: 'AnalyticsBoard', fieldSet: ['CDS_5Y', 'CDS_CHG', 'VOL_30D'], purpose: 'credit:cds' },
    { code: 'CMDEN', title: 'Commodities Energy Board', category: 'MACRO', assetClass: 'COMMODITIES', functionType: 'MONITOR', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['commodities energy'], recipe: 'MonitorTable', fieldSet: ['PX_LAST', 'PCT_CHG', 'ROLL_YIELD'], purpose: 'cmd:energy' },
    { code: 'CMDMET', title: 'Commodities Metals Board', category: 'MACRO', assetClass: 'COMMODITIES', functionType: 'MONITOR', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['commodities metals'], recipe: 'MonitorTable', fieldSet: ['PX_LAST', 'PCT_CHG', 'ROLL_YIELD'], purpose: 'cmd:metals' },
    { code: 'CMDAG', title: 'Commodities Agriculture Board', category: 'MACRO', assetClass: 'COMMODITIES', functionType: 'MONITOR', scope: 'CROSS_ASSET', requiresSecurity: false, keywords: ['commodities agriculture'], recipe: 'MonitorTable', fieldSet: ['PX_LAST', 'PCT_CHG', 'ROLL_YIELD'], purpose: 'cmd:agri' },
  ];
  out.push(...cross);

  for (let i = 1; i <= 200; i += 1) {
    out.push({
      code: `CHN${i}`,
      title: `Option Chain Slice ${i}`,
      category: 'DERIVS',
      assetClass: 'DERIVATIVES',
      functionType: 'REFERENCE',
      scope: 'SECURITY_SCOPED',
      requiresSecurity: true,
      keywords: ['chain', 'options', `slice-${i}`],
      synonyms: [`option chain ${i}`, `expiry slice ${i}`],
      recipe: 'VolBoard',
      fieldSet: ['IV', 'DELTA', 'GAMMA', 'OPEN_INT'],
      purpose: `chain:${i}`,
    });
    out.push({
      code: `VOL${i}`,
      title: `Volatility Surface Slice ${i}`,
      category: 'DERIVS',
      assetClass: 'DERIVATIVES',
      functionType: 'ANALYTICS',
      scope: 'SECURITY_SCOPED',
      requiresSecurity: true,
      keywords: ['volatility', 'surface', `slice-${i}`],
      synonyms: [`vol surface ${i}`, `skew ${i}`],
      recipe: 'VolBoard',
      fieldSet: ['IV', 'RVOL', 'SKEW_25D', 'TERM_SLOPE'],
      purpose: `vol:${i}`,
    });
    out.push({
      code: `FLOW${i}`,
      title: `Derivatives Flow Bucket ${i}`,
      category: 'DERIVS',
      assetClass: 'DERIVATIVES',
      functionType: 'EVENT',
      scope: 'UNIVERSE_SCOPED',
      requiresSecurity: false,
      keywords: ['flow', 'options', `bucket-${i}`],
      synonyms: [`flow ${i}`, `options flow ${i}`],
      recipe: 'VolBoard',
      fieldSet: ['FLOW_NET', 'DELTA', 'GAMMA', 'VOLUME'],
      purpose: `flow:${i}`,
    });
  }

  return out;
}

// ── Extended named family seeds (country/sector/industry/DES/HP/FA/curve variants) ──
function extendedFamilySeeds(): SeedDef[] {
  const out: SeedDef[] = [];

  const EXTENDED_COUNTRIES: Array<[string, string, string[]]> = [
    ['US','United States',['SPX_INDEX','USD_DXY','UST_10Y','CPI_YOY']],
    ['CN','China',['CSI300','USDCNY','CHIBOR_7D','PMI_MFG']],
    ['JP','Japan',['NKY225','USDJPY','JGB_10Y','BOJ_RATE']],
    ['GB','United Kingdom',['UKX100','GBPUSD','GILT_10Y','CPI_YOY']],
    ['DE','Germany',['DAX40','EURUSD','BUND_10Y','PMI_MFG']],
    ['FR','France',['CAC40','EURUSD','OAT_10Y','CPI_YOY']],
    ['IN','India',['SENSEX','USDINR','INDGOV_10Y','CPI_YOY']],
    ['BR','Brazil',['IBOV','USDBRL','BNDU_10Y','IPCA']],
    ['AU','Australia',['ASX200','AUDUSD','AUSGOV_10Y','RBA_RATE']],
    ['CA','Canada',['SPTSX','USDCAD','CANGOV_10Y','BOC_RATE']],
    ['KR','South Korea',['KOSPI','USDKRW','KRGOV_10Y','CPI_YOY']],
    ['SG','Singapore',['STI','USDSGD','SGS_10Y','MAS_RATE']],
    ['CH','Switzerland',['SMI','USDCHF','CHGOV_10Y','SNB_RATE']],
    ['NL','Netherlands',['AEX','EURUSD','NLGOV_10Y','PMI_MFG']],
    ['SE','Sweden',['OMX30','USDSEK','SWEGOV_10Y','RIKSBANK']],
    ['ZA','South Africa',['JSE40','USDZAR','ZAGOV_10Y','SARB_RATE']],
    ['MX','Mexico',['IPC','USDMXN','MBONO_10Y','BANXICO']],
    ['ES','Spain',['IBEX35','EURUSD','BONO_10Y','CPI_YOY']],
    ['IT','Italy',['FTSEMIB','EURUSD','BTP_10Y','CPI_YOY']],
    ['ID','Indonesia',['JCI','USDIDR','INDGOV_10Y','BI_RATE']],
    ['TW','Taiwan',['TWSE','USDTWD','TWGOV_10Y','CBC_RATE']],
    ['HK','Hong Kong',['HSI','USDHKD','HKGOV_10Y','HKMA_RATE']],
    ['NO','Norway',['OSEBX','USDNOK','NORGOV_10Y','NORGES_RATE']],
    ['PL','Poland',['WIG20','USDPLN','POLGOV_10Y','NBP_RATE']],
    ['TR','Turkey',['XU100','USDTRY','TRGOV_10Y','TCMB_RATE']],
    ['SA','Saudi Arabia',['TASI','USDSAR','SAGOV_10Y','SAMA_RATE']],
    ['AE','UAE',['DFM','USDAED','UAEGOV_10Y','CBUAE_RATE']],
    ['AR','Argentina',['MERVAL','USDARS','ARGOV_10Y','BCRA_RATE']],
    ['CL','Chile',['IPSA','USDCLP','CLGOV_10Y','BCT_RATE']],
  ];

  for (const [cc, name, fields] of EXTENDED_COUNTRIES) {
    // Country macro dossier
    out.push({ code:`CTY${cc}`, title:`${name} Country Dossier`, category:'MACRO', assetClass:'MACRO', functionType:'REFERENCE', scope:'REGION_SCOPED', requiresSecurity:false, keywords:['country','dossier',cc.toLowerCase(),name.toLowerCase(),'macro'], synonyms:[`${cc} macro`,`${name.toLowerCase()} overview`], recipe:'AnalyticsBoard', fieldSet:fields, purpose:`COUNTRY:${cc}` });
    // Country equity monitor
    out.push({ code:`EQ${cc}`.slice(0,6), title:`${name} Equity Monitor`, category:'EQUITY', assetClass:'EQUITY', functionType:'MONITOR', scope:'REGION_SCOPED', requiresSecurity:false, keywords:['equity',cc.toLowerCase(),name.toLowerCase(),'stocks'], synonyms:[`${cc} stocks`,`${name.toLowerCase()} equities`], recipe:'MonitorTable', fieldSet:['PX_LAST','PCT_CHG','VOLUME','MKT_CAP'], purpose:`EQUITY:${cc}` });
    // Country rates curve
    out.push({ code:`RT${cc}`.slice(0,6), title:`${name} Rates Monitor`, category:'RATES', assetClass:'RATES', functionType:'CHART', scope:'REGION_SCOPED', requiresSecurity:false, keywords:['rates',cc.toLowerCase(),name.toLowerCase(),'bonds','yield'], synonyms:[`${cc} bonds`,`${name.toLowerCase()} rates`], recipe:'CurveBoard', fieldSet:fields.slice(2,4), purpose:`RATES:${cc}` });
    // Country FX
    out.push({ code:`FX${cc}`.slice(0,6), title:`${name} FX & Flows`, category:'FX', assetClass:'FX', functionType:'MONITOR', scope:'REGION_SCOPED', requiresSecurity:false, keywords:['fx',cc.toLowerCase(),name.toLowerCase(),'currency'], synonyms:[`${cc} fx`,`${name.toLowerCase()} currency`], recipe:'MonitorTable', fieldSet:['FX_SPOT','PCT_CHG','CARRY_YLD','VOL_30D'], purpose:`FX:${cc}` });
    // Country news dossier
    out.push({ code:`NWS${cc}`.slice(0,7), title:`${name} News & Intelligence`, category:'NEWS_DOCS', assetClass:'DOCS', functionType:'EVENT', scope:'REGION_SCOPED', requiresSecurity:false, keywords:['news',cc.toLowerCase(),name.toLowerCase(),'headlines'], synonyms:[`${cc} news`,`${name.toLowerCase()} headlines`], recipe:'NewsHub', fieldSet:['NEWS_SCORE','SENTIMENT','IMPACT'], purpose:`NEWS:${cc}` });
  }

  const EXTENDED_SECTORS: Array<[string, string, string[]]> = [
    ['TECH','Technology',['PX_LAST','PE_RATIO','REV_GROWTH','RD_INTENSITY']],
    ['FIN','Financials',['PX_LAST','PB_RATIO','ROE','NIM']],
    ['HLTH','Healthcare',['PX_LAST','PE_RATIO','PIPELINE_SCORE','FDA_RISK']],
    ['IND','Industrials',['PX_LAST','EV_EBITDA','CAPEX_YLD','ORDER_BOOK']],
    ['ENRG','Energy',['PX_LAST','EV_EBITDA','PROD_GROWTH','BREAKEVEN_PX']],
    ['CONS','Consumer',['PX_LAST','PE_RATIO','SAME_STORE','MARGIN_TREND']],
    ['UTIL','Utilities',['PX_LAST','DIV_YLD','RATE_BASE','REG_RISK']],
    ['MAT','Materials',['PX_LAST','EV_EBITDA','COMMODITY_BETA','CYCLE_POS']],
    ['REIT','Real Estate',['PX_LAST','FFO_YLD','NAV_DISC','OCCUPANCY']],
    ['TEL','Telecom',['PX_LAST','EV_EBITDA','ARPU','CHURN_RATE']],
    ['AUTO','Automotive',['PX_LAST','EV_EBITDA','UNIT_SALES','EV_PENETR']],
    ['AERO','Aerospace Defense',['PX_LAST','EV_EBITDA','BACKLOG','GOVT_CONT']],
    ['SEMI','Semiconductors',['PX_LAST','PE_RATIO','BOOK_BILL','INV_DAYS']],
    ['SOFT','Software',['PX_LAST','EV_SALES','ARR_GROWTH','RULE_OF_40']],
    ['BANK','Banks',['PX_LAST','PB_RATIO','ROE','TIER1_RATIO']],
    ['INSUR','Insurance',['PX_LAST','PB_RATIO','COMBINED_RATIO','ROE']],
    ['BIOPH','Biopharma',['PX_LAST','EV_SALES','PIPELINE_VALUE','PATENT_LIFE']],
    ['MEDIA','Media & Entertainment',['PX_LAST','EV_EBITDA','SUBS_GROWTH','ARPU']],
    ['CHEM','Chemicals',['PX_LAST','EV_EBITDA','FEEDSTOCK_SPREAD','CAPEX_CYCLE']],
    ['SHIP','Shipping & Logistics',['PX_LAST','EV_EBITDA','BDI','UTILIZ']],
    ['CLOUD','Cloud Infra',['PX_LAST','EV_SALES','ARR_GROWTH','GROSS_MARGIN']],
    ['FINTECH','Fintech & Payments',['PX_LAST','EV_SALES','TPV_GROWTH','TAKE_RATE']],
    ['BIOTECH','Biotechnology',['PX_LAST','CASH_RUNWAY','TRIAL_PHASE','BURN_RATE']],
    ['OIL','Oil & Gas E&P',['PX_LAST','EV_EBITDA','PROD_GROWTH','RESERVE_LIFE']],
    ['REFIN','Oil Refining',['PX_LAST','EV_EBITDA','CRACK_SPREAD','UTILIZ']],
    ['POWER','Electric Utilities',['PX_LAST','DIV_YLD','RATE_BASE_GR','REG_RISK']],
    ['TELCO','Telecom Carriers',['PX_LAST','EV_EBITDA','ARPU','FCF_YLD']],
    ['RETL','Retail',['PX_LAST','EV_EBITDA','SAME_STORE','INVENTORY_TURNS']],
    ['MINING','Mining & Metals',['PX_LAST','EV_EBITDA','ORE_GRADE','AISC']],
    ['AGRI','Agribusiness',['PX_LAST','EV_EBITDA','HARVEST_YLD','INPUT_COST']],
  ];

  for (const [code, name, fields] of EXTENDED_SECTORS) {
    const safeC = `SEC${code}`.slice(0,7);
    out.push({ code:safeC, title:`${name} Sector Dossier`, category:'EQUITY', assetClass:'EQUITY', functionType:'REFERENCE', scope:'UNIVERSE_SCOPED', requiresSecurity:false, keywords:['sector',code.toLowerCase(),name.toLowerCase(),'dossier'], synonyms:[`${name.toLowerCase()} sector`,`${code.toLowerCase()} equities`], recipe:'ReferenceSheet', fieldSet:fields, purpose:`SECTOR:${code}` });
    out.push({ code:`SCP${code}`.slice(0,7), title:`${name} Peer Comps`, category:'EQUITY', assetClass:'EQUITY', functionType:'ANALYTICS', scope:'UNIVERSE_SCOPED', requiresSecurity:false, keywords:['peer comparison',code.toLowerCase(),name.toLowerCase(),'comps'], synonyms:[`${name.toLowerCase()} comps`], recipe:'AnalyticsBoard', fieldSet:fields, purpose:`PEER:${code}` });
    out.push({ code:`SCM${code}`.slice(0,7), title:`${name} Momentum Monitor`, category:'EQUITY', assetClass:'EQUITY', functionType:'MONITOR', scope:'UNIVERSE_SCOPED', requiresSecurity:false, keywords:['momentum',code.toLowerCase(),name.toLowerCase(),'ranking'], synonyms:[`${name.toLowerCase()} momentum`], recipe:'MonitorTable', fieldSet:['PX_LAST','PCT_CHG_1M','PCT_CHG_3M','MOMENTUM_SCORE'], purpose:`MOMENTUM:${code}` });
  }

  const EXTENDED_INDUSTRIES: Array<[string, string, string[]]> = [
    ['SEMIS','Semiconductors',['BOOK_BILL','WAFER_DEMAND','IV','PE_RATIO']],
    ['BANKS','Commercial Banks',['NIM','TIER1_RATIO','NPL_RATIO','ROE']],
    ['SOFTW','Enterprise Software',['ARR_GROWTH','NRR','RULE_OF_40','EV_SALES']],
    ['PNCI','P&C Insurance',['COMBINED_RATIO','RESERVE_ADEQ','CAT_LOSS','ROE']],
    ['BIOPH','Biopharmaceuticals',['PIPELINE_SCORE','PATENT_LIFE','TRIAL_PHASE','BURN']],
    ['AERON','Aerospace Defense',['BACKLOG_RATIO','DEFENSE_REV','SPACE_REV','CAPEX']],
    ['STREA','Streaming Media',['SUBSCRIBER_COUNT','CHURN_RATE','ARPU','CONTENT_SPEND']],
    ['SPCHE','Specialty Chemicals',['FEEDSTOCK_SPREAD','EBITDA_MARGIN','CAPEX','VOLUME']],
    ['MARIN','Marine Shipping',['BDI','VLCC_RATE','UTILIZATION','ORDER_BOOK']],
    ['MINING','Mining & Metals',['ORE_GRADE','AISC','RESERVE_LIFE','COMMOD_BETA']],
    ['ECOMM','E-Commerce Retail',['GMV_GROWTH','TAKE_RATE','MARGIN_TREND','ACTIVE_USERS']],
    ['AUTOM','Auto Manufacturers',['UNIT_SALES','EV_PENETR','INVENTORY_DAYS','CAPEX']],
    ['CLOUD','Cloud Infrastructure',['ARR_GROWTH','GROSS_MARGIN','CAPEX_INT','USAGE_GR']],
    ['FINPA','Fintech Payments',['PAYMENT_VOL','TAKE_RATE','TPV_GROWTH','CUSTOMER_CT']],
    ['BIOTECH','Biotechnology',['CASH_RUNWAY','TRIAL_PHASE','PARTNR_VALUE','BURN_RATE']],
    ['REITS','REITs',['FFO_YLD','NAV_DISC','OCCUPANCY','LEASE_DUR']],
    ['OILEP','Oil E&P',['PROD_GROWTH','RESERVE_REPL','BREAKEVEN_PX','FCF_YLD']],
    ['REFNG','Oil Refining',['CRACK_SPREAD','UTILIZ','NELSON_COMPLEXITY','CAPEX']],
    ['PWRUT','Electric Utilities',['RATE_BASE_GR','CAPEX','DIV_YLD','REG_RISK']],
    ['TLCOS','Telecom Carriers',['ARPU','CHURN_RATE','CAPEX_INT','FCF_YLD']],
    ['AGRIBZ','Agribusiness',['YIELD_ACRE','INPUT_COST_TON','EXPORT_VOL','WEATHER_RISK']],
    ['GAMNG','Gaming & Esports',['MAU','ARPU','BOOKINGS_GROWTH','CHURN']],
    ['CYBSEC','Cybersecurity',['ARR_GROWTH','NRR','GROSS_MARGIN','LOGO_COUNT']],
    ['LOGIS','Supply Chain Logistics',['VOLUME_GROWTH','YIELD_PER_UNIT','UTILIZ','FUEL_COST']],
    ['HLTHIT','Health IT',['ARR_GROWTH','GROSS_MARGIN','CUSTOMER_UPSELL','CHURN']],
    ['SPACET','Space Tech',['LAUNCH_BACKLOG','GOV_CONTRACTS','REUSE_RATE','CAPEX']],
    ['CLEAN','Clean Energy',['CAPACITY_MW','LEVELIZED_COST','CAPEX','IRR']],
    ['WASTE','Waste & Recycling',['VOLUME_GROWTH','TIPPING_FEE','CAPEX','REG_RISK']],
    ['WATUT','Water Utilities',['RATE_BASE_GR','CAPEX','DIV_YLD','QUALITY_SCORE']],
    ['PREMED','Precision Medicine',['TRIAL_PHASE','GENOMIC_SCORE','PIPELINE_VALUE','CASH_RUNWAY']],
  ];

  for (const [code, name, fields] of EXTENDED_INDUSTRIES) {
    out.push({ code:`IND${code}`.slice(0,8), title:`${name} Industry Dossier`, category:'EQUITY', assetClass:'EQUITY', functionType:'REFERENCE', scope:'UNIVERSE_SCOPED', requiresSecurity:false, keywords:['industry',code.toLowerCase(),name.toLowerCase(),'dossier','peers'], synonyms:[`${name.toLowerCase()} industry`], recipe:'RelationshipBoard', fieldSet:fields, purpose:`INDUSTRY:${code}` });
  }

  // DES variants
  const DES_VARIANTS: Array<[string,string,string,string[]]> = [
    ['DES2','Security Valuation Sheet','valuation multiples',['PE_RATIO','EV_EBITDA','PB_RATIO','PS_RATIO','FCF_YLD']],
    ['DESG','Security Growth Profile','growth revenue earnings',['REV_GROWTH','EPS_GROWTH','FCF_GROWTH','ARR_GROWTH','TOPLINE_ACCEL']],
    ['DESR','Security Risk Dashboard','risk volatility var beta',['BETA','VOL_30D','VAR_1D','DD_MAX','CORR_SPX']],
    ['DESQ','Security Quality Metrics','quality roe profitability margins',['ROE','ROA','ROIC','NET_MARGIN','FCF_CONV']],
    ['DESF','Security Financial Summary','financials income balance',['REVENUE','EBITDA','NET_INCOME','FCF','TOTAL_DEBT']],
    ['DESM','Security Macro Sensitivity','macro factor sensitivity',['RATES_BETA','COMMOD_BETA','FX_BETA','CREDIT_BETA','GROWTH_BETA']],
    ['DESP','Security Description Plus','comprehensive overview',['PX_LAST','PE_RATIO','BETA','MKT_CAP','DIV_YLD']],
    ['DESID','Security Identifier Sheet','identifiers sedol isin ticker',['ISIN','SEDOL','CUSIP','FIGI','LEI']],
    ['DESE','Security ESG Profile','esg environment governance',['ESG_SCORE','ENV_SCORE','SOC_SCORE','GOV_SCORE','CARBON_INT']],
    ['DESTS','Security Technical Summary','technical momentum rsi',['RSI_14','MACD','BB_PCT','ADX_14','TREND_SIGNAL']],
  ];
  for (const [code, title, kwStr, fields] of DES_VARIANTS) {
    out.push({ code, title, category:'EQUITY', assetClass:'EQUITY', functionType:'REFERENCE', scope:'SECURITY_SCOPED', requiresSecurity:true, keywords:['description',title.toLowerCase(),...kwStr.split(' ')], synonyms:[title.toLowerCase()], recipe:'ReferenceSheet', fieldSet:fields, purpose:`DES:${code}` });
  }

  // HP variants
  const HP_LENSES: Array<[string,string,string,string[]]> = [
    ['HP1','Price Returns History','price returns history',['PX_LAST','PCT_CHG','VOL_30D','HIGH_52W']],
    ['HP2','Total Return History','total return dividends reinvested',['TOTAL_RETURN','PRICE_RETURN','DIV_RETURN','TR_INDEX']],
    ['HP3','Drawdown History','drawdown peak trough recovery',['DD_PCT','PEAK_PRICE','TROUGH_PRICE','RECOVERY_DAYS']],
    ['HP4','Volatility History','volatility realized historical',['VOL_10D','VOL_30D','VOL_60D','VOL_252D']],
    ['HP5','Correlation History','correlation beta market',['CORR_SPX','CORR_SECTOR','CORR_BOND','BETA_30D']],
    ['HP6','Volume & Liquidity History','volume liquidity turnover',['VOLUME','ADV_30D','TURNOVER_RATIO','BID_ASK']],
    ['HP7','Earnings Event History','earnings surprise guidance',['EPS_SURPRISE','REV_SURPRISE','POST_EARN_MOVE','GUIDANCE_CHG']],
    ['HP8','Dividend History Timeline','dividend payout exdate',['DIV_AMT','DIV_YLD','PAYOUT_RATIO','EX_DATE_DAYS']],
    ['HP9','Seasonality History','seasonality monthly quarterly',['MONTH_RETURN','SEASONAL_FACTOR','YOY_PCT','QOQ_PCT']],
    ['HP10','Technical Indicator History','technical rsi macd bollinger',['RSI_14','MACD','BB_PCT','ADX_14']],
  ];
  for (const [code, title, kwStr, fields] of HP_LENSES) {
    out.push({ code, title, category:'EQUITY', assetClass:'EQUITY', functionType:'CHART', scope:'SECURITY_SCOPED', requiresSecurity:true, keywords:['history',...kwStr.split(' ')], synonyms:[title.toLowerCase()], recipe:'AnalyticsBoard', fieldSet:fields, purpose:`HP:${code}` });
  }

  // FA variants
  const FA_LENSES: Array<[string,string,string,string[]]> = [
    ['FA1','Income Statement Analysis','income revenue ebitda earnings',['REVENUE','GROSS_PROFIT','EBITDA','NET_INCOME','EPS']],
    ['FA2','Balance Sheet Analysis','balance sheet debt assets equity',['TOTAL_ASSETS','TOTAL_DEBT','EQUITY','BOOK_VALUE','CURRENT_RATIO']],
    ['FA3','Cash Flow Analysis','cash flow capex free cash',['CFO','FCF','CAPEX','FCF_MARGIN','FCF_YIELD']],
    ['FA4','Margin Analysis','margins gross ebitda net',['GROSS_MARGIN','EBITDA_MARGIN','NET_MARGIN','FCF_MARGIN','RD_MARGIN']],
    ['FA5','Growth Rate Analysis','growth revenue eps fcf',['REV_GROWTH_1Y','REV_GROWTH_3Y','EPS_GROWTH_1Y','FCF_GROWTH_3Y']],
    ['FA6','Return Metrics','return roe roa roic',['ROE','ROA','ROIC','ROCE','FCF_ROIC']],
    ['FA7','Leverage & Debt','leverage debt interest coverage',['NET_DEBT','NET_LEVERAGE','INT_COVERAGE','DEBT_TO_EBITDA']],
    ['FA8','Segment Revenue Analysis','segment revenue geographic mix',['SEG_REV_1','SEG_REV_2','GEO_MIX_INT','GEO_MIX_DOM']],
    ['FA9','Working Capital Analysis','working capital cash cycle',['AR_DAYS','AP_DAYS','INVENTORY_DAYS','CASH_CYCLE']],
    ['FA10','Earnings Quality Analysis','earnings quality accrual',['ACCRUAL_RATIO','CFO_TO_NI','REV_RECOG','BACKLOG_RATIO']],
  ];
  for (const [code, title, kwStr, fields] of FA_LENSES) {
    out.push({ code, title, category:'EQUITY', assetClass:'EQUITY', functionType:'ANALYTICS', scope:'SECURITY_SCOPED', requiresSecurity:true, keywords:['financial analysis',...kwStr.split(' ')], synonyms:[title.toLowerCase()], recipe:'AnalyticsBoard', fieldSet:fields, purpose:`FA:${code}` });
  }

  // Curve variants
  const CURVE_VARIANTS: Array<[string,string,string,string[]]> = [
    ['CURVUS','US Treasury Yield Curve','us treasury yield curve',['UST_2Y','UST_5Y','UST_10Y','UST_30Y','SPREAD_2S10S']],
    ['CURVEU','Euro Area Swap Curve','euro swap ecb bund',['ESTR_SWAP','EUR_SW_2Y','EUR_SW_10Y','BUND_10Y','ECB_RATE']],
    ['CURVJP','Japan JGB Curve','japan jgb boj yield',['JGB_2Y','JGB_5Y','JGB_10Y','JGB_30Y','BOJ_RATE']],
    ['CURVGB','UK Gilt Curve','uk gilt boe yield',['GILT_2Y','GILT_5Y','GILT_10Y','GILT_30Y','BOE_RATE']],
    ['CURVBR','Brazil Yield Curve','brazil di curve selic',['DI_2Y','DI_5Y','DI_10Y','DI_30Y','SELIC']],
    ['CURVCN','China Yield Curve','china cgy yield',['CGY_2Y','CGY_5Y','CGY_10Y','PBOC_RATE']],
    ['CURVIN','India Yield Curve','india gsec yield rbi',['GSEC_5Y','GSEC_10Y','GSEC_30Y','RBI_REPO']],
    ['CURVAAA','AAA Corporate Curve','corporate aaa curve',['AAA_2Y','AAA_5Y','AAA_10Y','SPREAD_AAA_UST']],
    ['CURVBBB','BBB Corporate Curve','corporate bbb investment grade',['BBB_2Y','BBB_5Y','BBB_10Y','SPREAD_BBB_UST']],
    ['CURVHY','High Yield Curve','high yield hy curve',['HY_2Y','HY_5Y','HY_10Y','SPREAD_HY_UST']],
    ['CURVEM','EM Sovereign Curve','em sovereign yield',['EM_2Y','EM_5Y','EM_10Y','EMBI_SPREAD']],
    ['CURVSWAP','Swap Curve Global','swap rate ois libor sofr',['SOFR_1Y','SOFR_5Y','SOFR_10Y','OIS_10Y']],
    ['CURVREAL','Real Yield Curve','real yield tips inflation',['TIPS_5Y','TIPS_10Y','TIPS_30Y','BE_10Y']],
    ['CURVFWD','Forward Rate Curve','forward rates fra',['FWD_1Y1Y','FWD_2Y1Y','FWD_5Y5Y','FWD_10Y10Y']],
    ['CURVFLY','Butterfly Spread','butterfly 2s5s10s fly',['FLY_2S5S','FLY_5S10S','FLY_10S30S','TWIST_2S10S']],
  ];
  for (const [code, title, kwStr, fields] of CURVE_VARIANTS) {
    out.push({ code, title, category:'RATES', assetClass:'RATES', functionType:'CHART', scope:'CROSS_ASSET', requiresSecurity:false, keywords:['curve',title.toLowerCase(),...kwStr.split(' ')], synonyms:[title.toLowerCase()], recipe:'CurveBoard', fieldSet:fields, purpose:`CURVE:${code}` });
  }

  // Credit variants
  const CREDIT_VARIANTS: Array<[string,string,string,string[]]> = [
    ['CRUSS','US IG Spread Monitor','us ig investment grade spread',['SPREAD_IG','OAS','DURATION','RATING_DIST']],
    ['CRHYS','US HY Spread Monitor','us hy high yield spread',['SPREAD_HY','OAS','RECOVERY','DIST_TO_DEF']],
    ['CREMS','EM Sovereign Spread','em sovereign embi spread',['EMBI_SPREAD','CDS_5Y','YTM','DURATION']],
    ['CRCORP','IG Corporate Spread','corporate spread ig',['CORP_SPREAD','OAS','DURATION','RATING']],
    ['CRCOV','Covenant Quality Monitor','covenant quality leverage',['COV_SCORE','LEVERAGE','ICR','LTV']],
    ['CRRAT','Rating Migration Monitor','rating migration upgrade downgrade',['UPGRDS_PCT','DOWNGRDS_PCT','WATCH_NEG','WATCH_POS']],
    ['CRISS','Issuance Calendar','issuance new issue calendar',['ISSUANCE_VOL','COUPON','MATURITY','RATING']],
    ['CRLIQ','Credit Liquidity Monitor','bid-ask spread liquidity',['BID_ASK_BPS','TURNOVER','TRADE_COUNT','DEPTH']],
    ['CRDEF','Default Rate Monitor','default distress recovery',['DEFAULT_RATE','DIST_RATIO','RECOVERY_RATE','PD_1Y']],
    ['CRCLIM','Climate Credit Risk','green bond climate transition',['GREEN_BOND_YLD','CARBON_RISK_SCORE','TRANSITION_COST']],
  ];
  for (const [code, title, kwStr, fields] of CREDIT_VARIANTS) {
    out.push({ code, title, category:'CREDIT', assetClass:'CREDIT', functionType:'MONITOR', scope:'UNIVERSE_SCOPED', requiresSecurity:false, keywords:['credit',title.toLowerCase(),...kwStr.split(' ')], synonyms:[title.toLowerCase()], recipe:'AnalyticsBoard', fieldSet:fields, purpose:`CREDIT:${code}` });
  }

  // Macro calendar / theme variants
  const MACRO_VARIANTS: Array<[string,string,string,string[]]> = [
    ['CPIUS','US CPI & Inflation','us cpi inflation breakeven',['CPI_YOY','CPI_CORE_YOY','BE_10Y','REAL_YLD_10Y']],
    ['CPIEU','Euro Area CPI','euro inflation ecb target',['HICP_YOY','HICP_CORE','ECB_TARGET','BE_5Y5Y']],
    ['NFPUS','US Payrolls Monitor','nfp jobs unemployment payroll',['NFP_MOM','UNEMP_RATE','WAGES_YOY','PART_RATE']],
    ['PMIGBL','Global PMI Dashboard','pmi manufacturing services global',['PMI_MFG_US','PMI_MFG_EU','PMI_MFG_CN','PMI_SVCS_US']],
    ['CBWATCH','Central Bank Watch','central bank rate policy',['FED_RATE','ECB_RATE','BOJ_RATE','BOE_RATE','PBoC_RATE']],
    ['RGLOBAL','Global Regime Monitor','regime risk on off macro',['REGIME_SCORE','RISK_APPETITE','CREDIT_IMPULSE','GROWTH_DIFF']],
    ['GROWTH','Global Growth Tracker','gdp growth nowcast real',['GDP_US_NOW','GDP_EU_NOW','GDP_CN_NOW','GLOBAL_PMI']],
    ['LTRADE','Trade & Tariff Monitor','trade tariff global supply',['TRADE_BALANCE','TARIFF_INDEX','SUPPLY_STRESS','PMI_NExports']],
    ['GEOPOL','Geopolitical Risk Monitor','geopolitics risk war sanctions',['GPR_INDEX','VIX','CDS_EM','COMMODITY_STRESS']],
    ['CLIMATE','Climate Risk Dashboard','climate transition carbon',['CARBON_PRICE','CLEAN_ENERGY_IX','TRANSITION_RISK','TEMP_ANOMALY']],
    ['CBDC','Digital Currency Monitor','cbdc digital currency crypto',['BITCOIN_PX','ETH_PX','CBDC_INDEX','STABLECOIN_CAP']],
    ['FISCAL','Fiscal Policy Monitor','fiscal deficit spending debt',['FISCAL_BALANCE','DEBT_GDP','PRIMARY_SURPLUS','BOND_ISSUANCE']],
  ];
  for (const [code, title, kwStr, fields] of MACRO_VARIANTS) {
    out.push({ code, title, category:'MACRO', assetClass:'MACRO', functionType:'ANALYTICS', scope:'CROSS_ASSET', requiresSecurity:false, keywords:['macro',title.toLowerCase(),...kwStr.split(' ')], synonyms:[title.toLowerCase()], recipe:'AnalyticsBoard', fieldSet:fields, purpose:`MACRO:${code}` });
  }

  // Portfolio risk variants
  const PORT_VARIANTS: Array<[string,string,string,string[]]> = [
    ['PORTFAC','Factor Exposure Dashboard','factor risk style exposure',['MKTBETA','SIZE_EXP','VALUE_EXP','QUALITY_EXP','MOM_EXP']],
    ['PORTATTR','Attribution Analysis','attribution performance alpha',['ALPHA','TRACKING_ERR','INFO_RATIO','SHARPE']],
    ['PORTVAR','VaR Decomposition','var risk value at risk',['VaR_95','VaR_99','ES_95','COMPONENT_VAR']],
    ['PORTSCEN','Scenario Analysis Dashboard','scenario stress shock',['SCEN_LOSS_2008','SCEN_LOSS_COVID','CUSTOM_SCEN_1','CUSTOM_SCEN_2']],
    ['PORTHM','Heat Map Exposure','heat map sector country exposure',['EQ_EXP','RATES_EXP','CREDIT_EXP','FX_EXP']],
    ['PORTLIQ','Liquidity Risk Monitor','liquidity risk trading position',['DAYS_TO_LIQ','ADV_PCT','MKTIMPACT','SPREAD_COST']],
    ['PORTCURR','Currency Exposure','fx currency hedge position',['USD_EXP','EUR_EXP','JPY_EXP','EM_FX_EXP']],
    ['PORTCONC','Concentration Monitor','concentration top holdings risk',['TOP10_PCT','SINGLE_NAME_MAX','SECTOR_CONC','GEO_CONC']],
    ['PORTBUDG','Risk Budget Monitor','risk budget limit usage',['VaR_BUDGET_PCT','ACTIVE_RISK','LEVERAGE_LIMIT','TURNOVER']],
    ['PORTDRILLDOWN','Position Drill Down','position level detail drill',['POS_MV','POS_PCT','POS_PNL','POS_BETA_CONTRIB']],
  ];
  for (const [code, title, kwStr, fields] of PORT_VARIANTS) {
    out.push({ code, title, category:'PORTFOLIO', assetClass:'PORTFOLIO', functionType:'ANALYTICS', scope:'PORTFOLIO_SCOPED', requiresSecurity:false, keywords:['portfolio',title.toLowerCase(),...kwStr.split(' ')], synonyms:[title.toLowerCase()], recipe:'PortfolioBoard', fieldSet:fields, purpose:`PORTFOLIO:${code}` });
  }

  // News / docs variants
  const NEWS_VARIANTS: Array<[string,string,string,string[]]> = [
    ['NWSENT','News Sentiment Monitor','sentiment positive negative news',['SENT_SCORE','POS_RATIO','NEG_RATIO','TOPIC_DIST']],
    ['NWGEO','Geospatial News Monitor','geo geographic news map region',['GEO_INTENSITY','COUNTRY_COUNT','REGION_SIGNAL','CONFLICT_INDEX']],
    ['NWFLOW','News Flow Dashboard','news flow volume frequency',['HEADLINE_COUNT','STORY_VOLUME','UNIQUE_SOURCES','FRESHNESS']],
    ['NWSUPPLY','Supply Chain News','supply chain disruption logistics',['DISRUPTION_SCORE','DELAY_SIGNAL','PORT_CONGESTION','INVENTORY_ALERT']],
    ['NWCORP','Corporate Action News','corporate action earnings dividend spinoff',['CORP_ACTIONS','DEAL_FLOW','GUIDANCE_CHANGES','MGMT_CHANGES']],
    ['NWREG','Regulatory News','regulatory policy compliance government',['REG_FILINGS','POLICY_CHANGE','SANCTION_NEWS','APPROVAL_NEWS']],
    ['NWEARNINGS','Earnings Season Tracker','earnings season results beats',['BEATS_PCT','SURPRISE_PCT','GUIDANCE_RAISE','YOY_COMP']],
    ['NWTHEME','Thematic News Tracker','theme narrative trend signal',['THEME_STRENGTH','ENTITY_COUNT','PRICE_IMPACT','MOMENTUM_SCORE']],
    ['NWRISK','Risk Intelligence Feed','risk intelligence geopolitical macro',['RISK_SCORE','TAIL_SIGNAL','STRESS_NEWS','CONTAGION_RISK']],
    ['NWAI','AI & Tech News Monitor','ai machine learning tech disruption',['AI_NEWS_FLOW','ADOPTION_SIGNAL','PATENT_FILINGS','DEAL_COUNT']],
  ];
  for (const [code, title, kwStr, fields] of NEWS_VARIANTS) {
    out.push({ code, title, category:'NEWS_DOCS', assetClass:'DOCS', functionType:'EVENT', scope:'CROSS_ASSET', requiresSecurity:false, keywords:['news',title.toLowerCase(),...kwStr.split(' ')], synonyms:[title.toLowerCase()], recipe:'NewsHub', fieldSet:fields, purpose:`NEWS:${code}` });
  }

  return out;
}

function buildCatalog(): CatalogMnemonic[] {
  const out: CatalogMnemonic[] = [];
  const seen = new Set<string>();
  const addSeed = (seed: SeedDef) => {
    const code = safeCode(seed.code);
    if (!code || seen.has(code)) return;
    seen.add(code);
    out.push(makeEntry({ ...seed, code }));
  };

  for (const s of BASE_SEEDS) addSeed(s);
  for (const s of familySeeds()) addSeed(s);
  for (const s of extendedFamilySeeds()) addSeed(s);

  (Object.keys(TARGET_COUNTS) as MnemonicCategory[]).forEach((category) => {
    let idx = 1;
    while (out.filter((x) => x.category === category).length < TARGET_COUNTS[category]) {
      addSeed(genericGeneratedSeed(category, idx));
      idx += 1;
    }
  });

  // Backfill starter mnemonics explicitly requested by user list.
  const mustHave = ['QUO', 'BQ', 'EE', 'EST', 'REC', 'PT', 'TRNS', 'FIL', 'INS', 'SPLT', 'BUYB', 'CAP', 'GUID', 'KPI', 'PRC', 'DD', 'BETA', 'FACT', 'PEER', 'COMP', 'THEM', 'SECT', 'INDY', 'CTY', 'CITY', 'MAPS', 'YLD', 'FRA', 'SWAP', 'OIS', 'BOND', 'ISS', 'RAT', 'CDS', 'SPRD', 'OAS', 'HY', 'IG', 'GOVT', 'AUCT', 'FXC', 'SPOT', 'FWDS', 'NDF', 'XCCY', 'DXY', 'CARRY', 'VOLFX', 'CORRFX', 'SURF', 'SKEW', 'RR', 'BF', 'IV', 'RVOL', 'VOLS', 'GEX', 'DEX', 'FLOWO', 'TERM', 'STRAT', 'ECO', 'CAL', 'CPI', 'NFP', 'PMI', 'CB', 'STIM', 'MACRO', 'REG', 'SHCK', 'SURP', 'NOW', 'RISK', 'VAR', 'STRESS', 'SCEN', 'EXP', 'FACTR', 'HEDGE', 'PNL', 'ATTR', 'LIMIT', 'KILL', 'NMAP', 'NTIM', 'NREL', 'THEME', 'SENT', 'GEO', 'RUMR', 'REGN', 'LAT', 'ERR', 'AUD', 'ENT', 'POL', 'QLT', 'MAP', 'EXPCTR', 'CLIP', 'WS', 'MON', 'IB'];
  for (const code of mustHave) {
    if (seen.has(code)) continue;
    const category = pickCategoryFromIndex(code.length);
    addSeed({
      code,
      title: `${code} Terminal Function`,
      category,
      assetClass: assetForCategory(category),
      functionType: 'ANALYTICS',
      scope: 'CROSS_ASSET',
      requiresSecurity: category === 'EQUITY' || category === 'DERIVS' || category === 'CREDIT',
      keywords: [code.toLowerCase(), category.toLowerCase()],
      recipe: CATEGORY_RECIPE[category],
    });
  }

  return out.sort((a, b) => a.code.localeCompare(b.code));
}

export const MNEMONIC_CATALOG: CatalogMnemonic[] = buildCatalog();
export const MNEMONIC_CATALOG_BY_CODE: Record<string, CatalogMnemonic> = Object.fromEntries(
  MNEMONIC_CATALOG.map((m) => [m.code.toUpperCase(), m]),
);

export function getCatalogMnemonic(code: string): CatalogMnemonic | undefined {
  return MNEMONIC_CATALOG_BY_CODE[code.toUpperCase()];
}

export function listCatalogMnemonics(): CatalogMnemonic[] {
  return MNEMONIC_CATALOG;
}

export function listCatalogByTaxonomy(): Record<string, CatalogMnemonic[]> {
  const groups: Record<string, CatalogMnemonic[]> = {};
  for (const m of MNEMONIC_CATALOG) {
    const key = `${m.assetClass}:${m.functionType}:${m.scope}`;
    if (!groups[key]) groups[key] = [];
    groups[key]!.push(m);
  }
  return groups;
}

function fuzzyContains(haystack: string, q: string): boolean {
  let j = 0;
  for (let i = 0; i < haystack.length && j < q.length; i += 1) {
    if (haystack[i] === q[j]) j += 1;
  }
  return j === q.length;
}

export function searchMnemonicCatalog(query: string, category?: MnemonicCategory): CatalogMnemonic[] {
  const q = query.trim().toUpperCase();
  const base = category ? MNEMONIC_CATALOG.filter((m) => m.category === category) : MNEMONIC_CATALOG;
  if (!q) return base;
  return base
    .map((m) => {
      const hay = `${m.code} ${m.title} ${m.keywords.join(' ')} ${m.searchSynonyms.join(' ')} ${m.category} ${m.assetClass} ${m.functionType} ${m.scope} ${m.defaultRecipeId}`.toUpperCase();
      let score = 0;
      if (m.code === q) score += 140;
      if (m.code.startsWith(q)) score += 95;
      if (m.title.toUpperCase().includes(q)) score += 60;
      if (hay.includes(q)) score += 35;
      if (fuzzyContains(m.code, q) || fuzzyContains(m.title.toUpperCase(), q)) score += 15;
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
}

function uniqueCodesInOrder(codes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of codes) {
    const key = c.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function taxonomyAdjacentMnemonics(code: string, limit = 12): CatalogMnemonic[] {
  const base = getCatalogMnemonic(code);
  if (!base) return [];
  const scored = MNEMONIC_CATALOG
    .filter((m) => m.code !== base.code)
    .map((m) => {
      let score = 0;
      if (m.category === base.category) score += 40;
      if (m.functionType === base.functionType) score += 28;
      if (m.scope === base.scope) score += 18;
      if (m.assetClass === base.assetClass) score += 14;
      const keywordOverlap = m.keywords.filter((k) => base.keywords.includes(k)).length;
      score += keywordOverlap * 5;
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.m.code.localeCompare(b.m.code))
    .slice(0, Math.max(0, limit))
    .map((x) => x.m);
  return scored;
}

type EntityKindHint =
  | 'SECURITY' | 'INDEX' | 'FX' | 'RATE' | 'FUTURE' | 'OPTION' | 'ETF' | 'COMPANY'
  | 'SECTOR' | 'INDUSTRY' | 'COUNTRY' | 'PERSON' | 'HOLDER' | 'NEWS' | 'EVENT'
  | 'FIELD' | 'FUNCTION' | 'MONITOR' | 'WORKSPACE' | 'ALERT' | 'ORDER' | 'TRADE';

const ENTITY_HINTS: Record<EntityKindHint, { categories: MnemonicCategory[]; keywords: string[]; functionTypes: MnemonicFunctionType[] }> = {
  SECURITY:  { categories: ['EQUITY', 'CREDIT', 'DERIVS'], keywords: ['security', 'description', 'fundamentals', 'reference'], functionTypes: ['REFERENCE', 'ANALYTICS'] },
  INDEX:     { categories: ['EQUITY', 'MACRO'], keywords: ['index', 'benchmark', 'market'], functionTypes: ['REFERENCE', 'CHART'] },
  FX:        { categories: ['FX', 'MACRO'], keywords: ['fx', 'pair', 'cross', 'currency'], functionTypes: ['MONITOR', 'ANALYTICS'] },
  RATE:      { categories: ['RATES', 'MACRO'], keywords: ['yield', 'curve', 'rates', 'term'], functionTypes: ['CHART', 'ANALYTICS'] },
  FUTURE:    { categories: ['DERIVS', 'MACRO'], keywords: ['future', 'term', 'curve', 'contract'], functionTypes: ['REFERENCE', 'MONITOR'] },
  OPTION:    { categories: ['DERIVS'], keywords: ['option', 'chain', 'volatility', 'surface'], functionTypes: ['REFERENCE', 'ANALYTICS'] },
  ETF:       { categories: ['EQUITY', 'PORTFOLIO'], keywords: ['etf', 'holding', 'basket', 'flows'], functionTypes: ['REFERENCE', 'MONITOR'] },
  COMPANY:   { categories: ['EQUITY', 'NEWS_DOCS'], keywords: ['company', 'fundamentals', 'news', 'ownership'], functionTypes: ['REFERENCE', 'EVENT'] },
  SECTOR:    { categories: ['EQUITY', 'MACRO'], keywords: ['sector', 'heatmap', 'relative'], functionTypes: ['ANALYTICS', 'MONITOR'] },
  INDUSTRY:  { categories: ['EQUITY'], keywords: ['industry', 'peer', 'comparable'], functionTypes: ['REFERENCE', 'ANALYTICS'] },
  COUNTRY:   { categories: ['MACRO', 'NEWS_DOCS', 'RATES'], keywords: ['country', 'region', 'macro', 'geo'], functionTypes: ['REFERENCE', 'ANALYTICS'] },
  PERSON:    { categories: ['EQUITY', 'NEWS_DOCS'], keywords: ['management', 'executive', 'insider'], functionTypes: ['REFERENCE', 'EVENT'] },
  HOLDER:    { categories: ['EQUITY', 'PORTFOLIO'], keywords: ['ownership', 'holder', 'stake'], functionTypes: ['ANALYTICS', 'REFERENCE'] },
  NEWS:      { categories: ['NEWS_DOCS', 'MACRO'], keywords: ['news', 'headline', 'narrative', 'impact'], functionTypes: ['EVENT', 'REFERENCE'] },
  EVENT:     { categories: ['NEWS_DOCS', 'MACRO'], keywords: ['event', 'calendar', 'timeline'], functionTypes: ['EVENT', 'ANALYTICS'] },
  FIELD:     { categories: ['OPS_ADMIN', 'PORTFOLIO'], keywords: ['field', 'lineage', 'provenance', 'catalog'], functionTypes: ['REFERENCE', 'ADMIN'] },
  FUNCTION:  { categories: ['OPS_ADMIN'], keywords: ['function', 'catalog', 'navigation'], functionTypes: ['REFERENCE', 'WORKFLOW'] },
  MONITOR:   { categories: ['PORTFOLIO', 'OPS_ADMIN', 'EQUITY'], keywords: ['monitor', 'watchlist', 'worksheet'], functionTypes: ['MONITOR', 'WORKFLOW'] },
  WORKSPACE: { categories: ['OPS_ADMIN'], keywords: ['workspace', 'layout', 'dock'], functionTypes: ['WORKFLOW', 'ADMIN'] },
  ALERT:     { categories: ['OPS_ADMIN', 'PORTFOLIO'], keywords: ['alert', 'rule', 'notification'], functionTypes: ['WORKFLOW', 'ADMIN'] },
  ORDER:     { categories: ['PORTFOLIO', 'OPS_ADMIN'], keywords: ['order', 'execution', 'blotter'], functionTypes: ['WORKFLOW', 'MONITOR'] },
  TRADE:     { categories: ['PORTFOLIO', 'OPS_ADMIN'], keywords: ['trade', 'execution', 'cost'], functionTypes: ['WORKFLOW', 'ANALYTICS'] },
};

export function suggestMnemonicsForEntityKind(kind: EntityKindHint, limit = 12): CatalogMnemonic[] {
  const hint = ENTITY_HINTS[kind];
  if (!hint) return [];
  const scored = MNEMONIC_CATALOG
    .map((m) => {
      let score = 0;
      if (hint.categories.includes(m.category)) score += 35;
      if (hint.functionTypes.includes(m.functionType)) score += 20;
      if (kind === 'SECURITY' || kind === 'OPTION' || kind === 'FUTURE' || kind === 'COMPANY') {
        if (m.requiresSecurity) score += 10;
      } else if (!m.requiresSecurity) {
        score += 5;
      }
      const hay = `${m.code} ${m.title} ${m.keywords.join(' ')} ${m.searchSynonyms.join(' ')}`.toUpperCase();
      for (const kw of hint.keywords) {
        if (hay.includes(kw.toUpperCase())) score += 8;
      }
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.m.code.localeCompare(b.m.code))
    .slice(0, Math.max(0, limit))
    .map((x) => x.m);
  return scored;
}

export function buildIntegratedRelatedCodes(code: string, limit = 16): string[] {
  const base = getCatalogMnemonic(code);
  const direct = base?.relatedCodes ?? [];
  const adjacent = taxonomyAdjacentMnemonics(code, limit).map((m) => m.code);
  const merged = uniqueCodesInOrder([...direct, ...adjacent]);
  return merged.filter((c) => c !== code.toUpperCase()).slice(0, limit);
}

export function catalogToMnemonicRegistryDef(m: CatalogMnemonic): {
  code: string;
  title: string;
  requiresSecurity: boolean;
  supportedSectors: MarketSector[];
  layoutType: 'table' | 'news' | 'chart' | 'form' | 'kv' | 'composite';
  relatedCodes: string[];
} {
  return {
    code: m.code,
    title: m.title,
    requiresSecurity: m.requiresSecurity,
    supportedSectors: ALL_SECTORS,
    layoutType: m.defaultLayout === 'kv' ? 'kv' : m.defaultLayout === 'news' ? 'news' : m.defaultLayout === 'chart' ? 'chart' : m.defaultLayout === 'form' ? 'form' : m.defaultLayout === 'composite' ? 'composite' : 'table',
    relatedCodes: m.relatedCodes,
  };
}
