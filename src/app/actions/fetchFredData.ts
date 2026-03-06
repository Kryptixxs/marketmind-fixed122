'use server';

export interface FredSeries {
  id: string;
  title: string;
  value: number | null;
  date: string;
  units: string;
  frequency: string;
}

const FRED_SERIES: Record<string, { title: string; units: string }> = {
  'GDP': { title: 'Real GDP', units: '%' },
  'CPIAUCSL': { title: 'CPI (All Urban)', units: 'Index' },
  'UNRATE': { title: 'Unemployment Rate', units: '%' },
  'FEDFUNDS': { title: 'Fed Funds Rate', units: '%' },
  'DGS10': { title: '10-Year Treasury', units: '%' },
  'DGS2': { title: '2-Year Treasury', units: '%' },
  'T10Y2Y': { title: '10Y-2Y Spread', units: '%' },
  'DEXUSEU': { title: 'USD/EUR', units: 'Rate' },
  'BAMLH0A0HYM2': { title: 'HY OAS Spread', units: 'bps' },
  'UMCSENT': { title: 'Consumer Sentiment', units: 'Index' },
  'PAYEMS': { title: 'Nonfarm Payrolls', units: 'Thousands' },
  'PCEPI': { title: 'PCE Price Index', units: 'Index' },
  'M2SL': { title: 'M2 Money Supply', units: 'Billions' },
  'WALCL': { title: 'Fed Balance Sheet', units: 'Millions' },
};

const CACHE = new Map<string, { data: FredSeries; ts: number }>();
const CACHE_TTL = 3600_000;

export async function fetchFredSeries(seriesId: string): Promise<FredSeries | null> {
  const cached = CACHE.get(seriesId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return {
      id: seriesId,
      title: FRED_SERIES[seriesId]?.title || seriesId,
      value: null,
      date: '',
      units: FRED_SERIES[seriesId]?.units || '',
      frequency: '',
    };
  }

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const json = await res.json();
    const obs = json.observations?.[0];
    if (!obs) return null;

    const data: FredSeries = {
      id: seriesId,
      title: FRED_SERIES[seriesId]?.title || seriesId,
      value: obs.value !== '.' ? parseFloat(obs.value) : null,
      date: obs.date,
      units: FRED_SERIES[seriesId]?.units || '',
      frequency: json.frequency || '',
    };

    CACHE.set(seriesId, { data, ts: Date.now() });
    return data;
  } catch (e) {
    console.warn(`[FRED] Error fetching ${seriesId}:`, (e as Error).message);
    return null;
  }
}

export async function fetchFredDashboard(): Promise<FredSeries[]> {
  const seriesIds = ['FEDFUNDS', 'DGS10', 'DGS2', 'T10Y2Y', 'UNRATE', 'CPIAUCSL', 'UMCSENT', 'BAMLH0A0HYM2'];
  const results = await Promise.all(seriesIds.map(id => fetchFredSeries(id)));
  return results.filter(Boolean) as FredSeries[];
}
