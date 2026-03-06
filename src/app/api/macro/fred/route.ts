import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/server-cache';

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FRED_SERIES: Record<string, { name: string; unit: string }> = {
  'DFF': { name: 'Fed Funds Rate', unit: '%' },
  'CPIAUCSL': { name: 'CPI (All Urban)', unit: 'Index' },
  'UNRATE': { name: 'Unemployment Rate', unit: '%' },
  'GDP': { name: 'Real GDP', unit: 'Billions $' },
  'DGS10': { name: '10-Year Treasury', unit: '%' },
  'DGS2': { name: '2-Year Treasury', unit: '%' },
  'T10Y2Y': { name: '10Y-2Y Spread', unit: '%' },
  'UMCSENT': { name: 'Consumer Sentiment', unit: 'Index' },
  'VIXCLS': { name: 'VIX Close', unit: 'Index' },
  'DTWEXBGS': { name: 'USD Index (Broad)', unit: 'Index' },
  'PAYEMS': { name: 'Nonfarm Payrolls', unit: 'Thousands' },
  'PCEPI': { name: 'PCE Price Index', unit: 'Index' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get('series') || 'DFF';
  const limit = parseInt(searchParams.get('limit') || '30');

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FRED_API_KEY not configured' }, { status: 500 });
  }

  const cacheKey = `fred:${seriesId}:${limit}`;
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const url = `${FRED_BASE}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json({ error: `FRED API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const meta = FRED_SERIES[seriesId] || { name: seriesId, unit: '' };

    const result = {
      seriesId,
      name: meta.name,
      unit: meta.unit,
      observations: (data.observations || []).map((obs: any) => ({
        date: obs.date,
        value: obs.value === '.' ? null : parseFloat(obs.value),
      })),
      lastUpdated: new Date().toISOString(),
    };

    setCache(cacheKey, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[FRED] API call failed:', error);
    return NextResponse.json({ error: 'Failed to fetch FRED data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FRED_API_KEY not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const seriesIds: string[] = body.series || Object.keys(FRED_SERIES);

    const cacheKey = `fred:batch:${seriesIds.sort().join(',')}`;
    const cached = getCached<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const results = await Promise.allSettled(
      seriesIds.map(async (id) => {
        const url = `${FRED_BASE}?series_id=${id}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const obs = data.observations?.[0];
        const meta = FRED_SERIES[id] || { name: id, unit: '' };
        return {
          seriesId: id,
          name: meta.name,
          unit: meta.unit,
          value: obs?.value === '.' ? null : parseFloat(obs?.value),
          date: obs?.date,
        };
      })
    );

    const data = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value != null)
      .map(r => r.value);

    setCache(cacheKey, data, CACHE_TTL);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[FRED] Batch call failed:', error);
    return NextResponse.json({ error: 'Failed to fetch FRED data' }, { status: 500 });
  }
}
