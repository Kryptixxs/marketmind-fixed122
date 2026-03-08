'use client';

export type GeoLayer =
  | 'NEWS_INTENSITY'
  | 'COMPANY_DENSITY'
  | 'RISK_FLAGS'
  | 'MACRO'
  | 'SHIPPING'
  | 'ENERGY'
  | 'ALERTS';

export interface GeoRegion {
  id: string;
  name: string;
  iso2: string;
  lat: number;
  lon: number;
  newsIntensity: number;
  sentiment: number;
  riskScore: number;
  policyRate: number;
  inflation: number;
  currencyStrength: number;
  pmi: number;
  topSectors: string[];
  topCompanies: string[];
}

export interface GeoStory {
  id: string;
  ts: number;
  regionId: string;
  headline: string;
  tag: 'POLITICS' | 'SUPPLY' | 'EARNINGS' | 'DISASTER' | 'TRADE' | 'ENERGY';
  tone: 'POS' | 'NEG' | 'NEU';
  entities: string[];
}

export interface GeoFacility {
  id: string;
  company: string;
  kind: 'HQ' | 'FACTORY' | 'MINE' | 'PORT' | 'DATACENTER';
  regionId: string;
  lat: number;
  lon: number;
  criticality: 'LOW' | 'MED' | 'HIGH';
}

export interface GeoRoute {
  id: string;
  fromRegionId: string;
  toRegionId: string;
  flow: number;
  pressure: number;
  commodity: string;
}

export interface GeoDisruption {
  id: string;
  regionId: string;
  title: string;
  severity: 'LOW' | 'MED' | 'HIGH';
  channel: 'PORT' | 'LOGISTICS' | 'POLICY' | 'WEATHER' | 'ENERGY';
  impactedCompanies: string[];
}

const KEY = 'vantage-geo-intel-v1';

interface GeoIntelState {
  selectedRegionId: string;
  selectedLayer: GeoLayer;
  regions: GeoRegion[];
  stories: GeoStory[];
  facilities: GeoFacility[];
  routes: GeoRoute[];
  disruptions: GeoDisruption[];
}

const DEFAULT_REGIONS: GeoRegion[] = [
  { id: 'US', name: 'United States', iso2: 'US', lat: 38, lon: -97, newsIntensity: 86, sentiment: 0.12, riskScore: 37, policyRate: 5.25, inflation: 3.1, currencyStrength: 69, pmi: 52.4, topSectors: ['TECH', 'FIN', 'HEALTH'], topCompanies: ['AAPL US EQUITY', 'MSFT US EQUITY', 'XOM US EQUITY'] },
  { id: 'CN', name: 'China', iso2: 'CN', lat: 35, lon: 103, newsIntensity: 74, sentiment: -0.08, riskScore: 58, policyRate: 2.5, inflation: 0.8, currencyStrength: 44, pmi: 49.7, topSectors: ['INDUSTRIAL', 'TECH', 'MATERIALS'], topCompanies: ['BABA US EQUITY', 'JD US EQUITY', 'NIO US EQUITY'] },
  { id: 'EU', name: 'Eurozone', iso2: 'EU', lat: 51, lon: 10, newsIntensity: 63, sentiment: 0.03, riskScore: 42, policyRate: 4, inflation: 2.7, currencyStrength: 56, pmi: 50.1, topSectors: ['AUTO', 'BANKS', 'LUXURY'], topCompanies: ['SAP GR EQUITY', 'ASML NA EQUITY', 'SIE GR EQUITY'] },
  { id: 'JP', name: 'Japan', iso2: 'JP', lat: 36, lon: 138, newsIntensity: 41, sentiment: 0.1, riskScore: 29, policyRate: 0.1, inflation: 2.1, currencyStrength: 34, pmi: 50.8, topSectors: ['AUTO', 'INDUSTRIAL', 'TECH'], topCompanies: ['7203 JP EQUITY', '6758 JP EQUITY', '9984 JP EQUITY'] },
  { id: 'IN', name: 'India', iso2: 'IN', lat: 22, lon: 78, newsIntensity: 58, sentiment: 0.17, riskScore: 40, policyRate: 6.5, inflation: 5.2, currencyStrength: 48, pmi: 55.9, topSectors: ['BANKS', 'IT', 'ENERGY'], topCompanies: ['INFY IN EQUITY', 'HDB US EQUITY', 'IBN US EQUITY'] },
  { id: 'BR', name: 'Brazil', iso2: 'BR', lat: -10, lon: -55, newsIntensity: 37, sentiment: -0.01, riskScore: 54, policyRate: 10.5, inflation: 4.5, currencyStrength: 39, pmi: 49.4, topSectors: ['MATERIALS', 'ENERGY', 'AGR'], topCompanies: ['VALE US EQUITY', 'PBR US EQUITY', 'ITUB US EQUITY'] },
];

const DEFAULT_STORIES: GeoStory[] = [
  { id: 'g1', ts: Date.now() - 6 * 60_000, regionId: 'US', headline: 'Fed officials signal patience on rate cuts', tag: 'POLITICS', tone: 'NEU', entities: ['DXY CURNCY', '2Y GOVT', 'SPX INDEX'] },
  { id: 'g2', ts: Date.now() - 10 * 60_000, regionId: 'CN', headline: 'Port congestion worsens in Pearl River Delta', tag: 'SUPPLY', tone: 'NEG', entities: ['BDI INDEX', 'AAPL US EQUITY', 'COPPER COMDTY'] },
  { id: 'g3', ts: Date.now() - 14 * 60_000, regionId: 'EU', headline: 'Gas storage drawdown accelerates amid cold snap', tag: 'ENERGY', tone: 'NEG', entities: ['TTF COMDTY', 'LNG COMDTY', 'BAS GR EQUITY'] },
  { id: 'g4', ts: Date.now() - 18 * 60_000, regionId: 'JP', headline: 'BOJ officials discuss gradual policy normalization', tag: 'POLITICS', tone: 'NEU', entities: ['JPY CURNCY', '10Y GOVT', 'NKY INDEX'] },
  { id: 'g5', ts: Date.now() - 26 * 60_000, regionId: 'IN', headline: 'Industrial output beats expectations in latest print', tag: 'EARNINGS', tone: 'POS', entities: ['NIFTY INDEX', 'INFY IN EQUITY', 'BRENT COMDTY'] },
  { id: 'g6', ts: Date.now() - 34 * 60_000, regionId: 'BR', headline: 'Flood risk disrupts soybean export corridor', tag: 'DISASTER', tone: 'NEG', entities: ['SOYBN COMDTY', 'VALE US EQUITY', 'USDBRL CURNCY'] },
];

const DEFAULT_FACILITIES: GeoFacility[] = [
  { id: 'f1', company: 'AAPL US EQUITY', kind: 'HQ', regionId: 'US', lat: 37.33, lon: -122.01, criticality: 'HIGH' },
  { id: 'f2', company: 'AAPL US EQUITY', kind: 'FACTORY', regionId: 'CN', lat: 22.55, lon: 114.05, criticality: 'HIGH' },
  { id: 'f3', company: 'TSM US EQUITY', kind: 'FACTORY', regionId: 'TW', lat: 24.8, lon: 120.99, criticality: 'HIGH' },
  { id: 'f4', company: 'XOM US EQUITY', kind: 'PORT', regionId: 'US', lat: 29.73, lon: -95.26, criticality: 'MED' },
  { id: 'f5', company: 'VALE US EQUITY', kind: 'MINE', regionId: 'BR', lat: -19.9, lon: -43.9, criticality: 'HIGH' },
  { id: 'f6', company: 'MSFT US EQUITY', kind: 'DATACENTER', regionId: 'EU', lat: 52.37, lon: 4.9, criticality: 'MED' },
];

const DEFAULT_ROUTES: GeoRoute[] = [
  { id: 'r1', fromRegionId: 'CN', toRegionId: 'US', flow: 92, pressure: 67, commodity: 'CONTAINERS' },
  { id: 'r2', fromRegionId: 'US', toRegionId: 'EU', flow: 58, pressure: 41, commodity: 'LNG' },
  { id: 'r3', fromRegionId: 'BR', toRegionId: 'CN', flow: 65, pressure: 53, commodity: 'IRON ORE' },
  { id: 'r4', fromRegionId: 'EU', toRegionId: 'IN', flow: 44, pressure: 38, commodity: 'MACHINERY' },
];

const DEFAULT_DISRUPTIONS: GeoDisruption[] = [
  { id: 'd1', regionId: 'CN', title: 'Pearl Delta port congestion', severity: 'HIGH', channel: 'PORT', impactedCompanies: ['AAPL US EQUITY', 'NVDA US EQUITY', 'WMT US EQUITY'] },
  { id: 'd2', regionId: 'EU', title: 'Gas pipeline maintenance window', severity: 'MED', channel: 'ENERGY', impactedCompanies: ['BAS GR EQUITY', 'SIE GR EQUITY'] },
  { id: 'd3', regionId: 'BR', title: 'Flooded export rail corridor', severity: 'HIGH', channel: 'WEATHER', impactedCompanies: ['VALE US EQUITY', 'BUNGE US EQUITY'] },
  { id: 'd4', regionId: 'US', title: 'Labor action at west coast terminal', severity: 'MED', channel: 'LOGISTICS', impactedCompanies: ['TSLA US EQUITY', 'AAPL US EQUITY'] },
];

const DEFAULT_STATE: GeoIntelState = {
  selectedRegionId: 'US',
  selectedLayer: 'NEWS_INTENSITY',
  regions: DEFAULT_REGIONS,
  stories: DEFAULT_STORIES,
  facilities: DEFAULT_FACILITIES,
  routes: DEFAULT_ROUTES,
  disruptions: DEFAULT_DISRUPTIONS,
};

function loadState(): GeoIntelState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<GeoIntelState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: GeoIntelState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Ignore persistence failures.
  }
}

export function getGeoState() {
  return loadState();
}

export function setGeoLayer(layer: GeoLayer) {
  const state = loadState();
  saveState({ ...state, selectedLayer: layer });
}

export function setGeoRegion(regionId: string) {
  const state = loadState();
  saveState({ ...state, selectedRegionId: regionId });
}

export function listRegionStories(regionId: string) {
  return loadState().stories.filter((s) => s.regionId === regionId).sort((a, b) => b.ts - a.ts);
}

export function listGeoHotspots(windowCode: '1H' | '1D' | '1W') {
  const now = Date.now();
  const windowMs = windowCode === '1H' ? 60 * 60 * 1000 : windowCode === '1D' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const state = loadState();
  return state.regions.map((r) => {
    const stories = state.stories.filter((s) => s.regionId === r.id && now - s.ts <= windowMs);
    const sentiment = stories.length ? stories.reduce((acc, x) => acc + (x.tone === 'POS' ? 1 : x.tone === 'NEG' ? -1 : 0), 0) / stories.length : 0;
    return {
      regionId: r.id,
      region: r.name,
      volume: stories.length,
      sentiment: Number(sentiment.toFixed(2)),
      tags: Array.from(new Set(stories.map((s) => s.tag))).slice(0, 4),
      lat: r.lat,
      lon: r.lon,
    };
  }).sort((a, b) => b.volume - a.volume);
}

export function listFacilitiesByCompany(company: string) {
  return loadState().facilities.filter((f) => f.company === company);
}

export function listRoutes() {
  return loadState().routes;
}

export function listDisruptions(regionId?: string) {
  const rows = loadState().disruptions;
  if (!regionId) return rows;
  return rows.filter((d) => d.regionId === regionId);
}

export function listCompanyFootprint(company?: string) {
  const state = loadState();
  const facilities = company ? state.facilities.filter((f) => f.company === company) : state.facilities;
  const regionCounts = facilities.reduce<Record<string, number>>((acc, f) => {
    acc[f.regionId] = (acc[f.regionId] ?? 0) + 1;
    return acc;
  }, {});
  const revenueSplit = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([regionId, count]) => {
      const total = Math.max(1, facilities.length);
      return { regionId, pct: Math.round((count / total) * 100) };
    });
  return { facilities, revenueSplit };
}

export function listRouteExposureLedger(routeId: string) {
  const state = loadState();
  const route = state.routes.find((r) => r.id === routeId);
  if (!route) return [];
  const from = state.regions.find((r) => r.id === route.fromRegionId);
  const to = state.regions.find((r) => r.id === route.toRegionId);
  const companies = Array.from(new Set([...(from?.topCompanies ?? []), ...(to?.topCompanies ?? [])]));
  return companies.slice(0, 8).map((company, idx) => ({
    company,
    corridor: `${route.fromRegionId}→${route.toRegionId}`,
    commodity: route.commodity,
    sensitivity: Number((0.35 + idx * 0.06 + route.pressure / 500).toFixed(2)),
    shippingPressure: route.pressure,
  }));
}

export function listMostExposedCompanies(regionId: string) {
  const state = loadState();
  const region = state.regions.find((r) => r.id === regionId);
  if (!region) return [];
  const disruptions = state.disruptions.filter((d) => d.regionId === regionId);
  const impactSet = new Set(disruptions.flatMap((d) => d.impactedCompanies));
  const universe = Array.from(new Set([...(region.topCompanies ?? []), ...Array.from(impactSet)]));
  return universe.map((company, idx) => ({
    company,
    regionId,
    exposureScore: Math.max(0, 85 - idx * 9 + (impactSet.has(company) ? 8 : 0)),
    reasons: [
      idx % 2 === 0 ? 'revenue-share' : 'supply-link',
      impactSet.has(company) ? 'active-disruption' : 'route-pressure',
    ],
  })).sort((a, b) => b.exposureScore - a.exposureScore);
}
