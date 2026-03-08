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
  EQUITY: ['DES', 'HP', 'FA', 'OWN', 'DVD', 'CN', 'TOP', 'RELS', 'COMP', 'PEER', 'SCRN', 'RANK'],
  FX: ['SPOT', 'FWDS', 'DXY', 'CARRY', 'VOLFX', 'CORRFX', 'TOP', 'NREL', 'HP', 'GP', 'FXC', 'CURV'],
  RATES: ['CURV', 'YLD', 'FRA', 'SWAP', 'OIS', 'AUCT', 'ECO', 'TOP', 'RGN', 'FLOW1', 'R1', 'M1'],
  CREDIT: ['BOND', 'ISS', 'RAT', 'CDS', 'SPRD', 'OAS', 'HY', 'IG', 'SCEN', 'VAR', 'R1', 'S1'],
  DERIVS: ['CHAIN', 'SURF', 'IV', 'RVOL', 'SKEW', 'GEX', 'DEX', 'FLOWO', 'TERM', 'STRAT', 'VOL1', 'CHN1'],
  MACRO: ['ECO', 'CAL', 'CPI', 'NFP', 'PMI', 'CB', 'STIM', 'SURP', 'NOW', 'REG', 'RGN', 'TOP'],
  PORTFOLIO: ['PORT', 'RISK', 'VAR', 'STRESS', 'SCEN', 'FACTR', 'HEDGE', 'PNL', 'ATTR', 'LIMIT', 'MON', 'ALRT+'],
  NEWS_DOCS: ['TOP', 'N', 'CN', 'NMAP', 'NTIM', 'NREL', 'SENT', 'RUMR', 'REGN', 'GEO', 'DOCS', 'CLIP'],
  OPS_ADMIN: ['STAT', 'LAT', 'ERR', 'AUD', 'ENT', 'POL', 'QLT', 'MAP', 'RPT', 'WS', 'MON', 'IB'],
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
  EQUITY: 520,
  FX: 240,
  RATES: 240,
  CREDIT: 240,
  DERIVS: 540,
  MACRO: 220,
  PORTFOLIO: 240,
  NEWS_DOCS: 220,
  OPS_ADMIN: 180,
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
  const pool = uniq([code, ...extras, ...core, 'DES', 'TOP', 'LINE', 'FLD', 'NAV', 'NX', 'MON', 'RPT', 'WS']);
  return pool.filter((c) => c !== code).slice(0, 12);
}

function helpFor(
  code: string,
  title: string,
  category: MnemonicCategory,
  fieldSet: string[],
  relatedCodes: string[],
  recipe: MnemonicRecipeId,
): string {
  return `# ${code} — ${title}

Purpose: ${category} ${recipe} workflow for dense terminal analysis.

Key fields: ${fieldSet.slice(0, 4).join(', ')}
Shortcuts: Enter GO • Shift+Enter Send • Alt+Enter Inspect • F2 MENU • F1 HELP
Related codes: ${relatedCodes.slice(0, 8).join(', ')}`;
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
    out.push({
      code: `R${i}`,
      title: `Rank Universe Metric ${i}`,
      category,
      assetClass: assetForCategory(category),
      functionType: 'ANALYTICS',
      scope: 'UNIVERSE_SCOPED',
      requiresSecurity: false,
      keywords: ['rank', 'universe', 'metric', `metric-${i}`],
      synonyms: [`ranking ${i}`, `metric rank ${i}`],
      recipe: 'MonitorTable',
      fieldSet: ['PX_LAST', 'PCT_CHG', 'VOLUME', 'BETA'],
      purpose: `RANK:${category}:${i}`,
    });
  }
  for (let i = 1; i <= 500; i += 1) {
    const category = pickCategoryFromIndex(i + 2);
    out.push({
      code: `M${i}`,
      title: `Monitor Universe Set ${i}`,
      category,
      assetClass: assetForCategory(category),
      functionType: 'MONITOR',
      scope: 'UNIVERSE_SCOPED',
      requiresSecurity: false,
      keywords: ['monitor', 'watchlist', 'universe', `set-${i}`],
      synonyms: [`monitor ${i}`, `watchlist ${i}`],
      recipe: 'MonitorTable',
      fieldSet: ['PX_LAST', 'PCT_CHG', 'VOLUME', 'NEWS_SCORE'],
      purpose: `MON:${category}:${i}`,
    });
  }
  for (let i = 1; i <= 300; i += 1) {
    const category = pickCategoryFromIndex(i + 4);
    out.push({
      code: `S${i}`,
      title: `Screener Preset ${i}`,
      category,
      assetClass: assetForCategory(category),
      functionType: 'SCREENER',
      scope: 'UNIVERSE_SCOPED',
      requiresSecurity: false,
      keywords: ['screener', 'preset', 'filters', `preset-${i}`],
      synonyms: [`screen ${i}`, `filter preset ${i}`],
      recipe: 'Screener',
      fieldSet: ['PX_LAST', 'PE_RATIO', 'BETA', 'VOLUME'],
      purpose: `SCR:${category}:${i}`,
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
