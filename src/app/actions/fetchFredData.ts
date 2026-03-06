'use server';

export interface FredSeries {
  id: string;
  title: string;
  value: number | null;
  date: string;
  units: string;
  frequency: string;
}

const SERIES: Record<string, { title: string; units: string; base: number }> = {
  FEDFUNDS: { title: 'Fed Funds Rate', units: '%', base: 5.25 },
  DGS10: { title: '10-Year Treasury', units: '%', base: 4.23 },
  DGS2: { title: '2-Year Treasury', units: '%', base: 4.61 },
  T10Y2Y: { title: '10Y-2Y Spread', units: '%', base: -0.38 },
  UNRATE: { title: 'Unemployment Rate', units: '%', base: 3.9 },
  CPIAUCSL: { title: 'CPI (All Urban)', units: 'Index', base: 313.2 },
  UMCSENT: { title: 'Consumer Sentiment', units: 'Index', base: 78.4 },
  BAMLH0A0HYM2: { title: 'HY OAS Spread', units: 'bps', base: 364 },
};

function mockValue(id: string): number {
  const base = SERIES[id]?.base ?? 100;
  const t = Date.now() / 1000;
  const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Number((base * (1 + Math.sin(t / 12000 + seed) * 0.01)).toFixed(2));
}

export async function fetchFredSeries(seriesId: string): Promise<FredSeries | null> {
  const id = seriesId.toUpperCase();
  return {
    id,
    title: SERIES[id]?.title || id,
    value: mockValue(id),
    date: new Date().toISOString().slice(0, 10),
    units: SERIES[id]?.units || '',
    frequency: 'Daily',
  };
}

export async function fetchFredDashboard(): Promise<FredSeries[]> {
  const ids = Object.keys(SERIES);
  const rows = await Promise.all(ids.map((id) => fetchFredSeries(id)));
  return rows.filter(Boolean) as FredSeries[];
}
