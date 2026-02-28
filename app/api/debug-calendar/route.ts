import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export async function GET() {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'No FMP_API_KEY', count: 0 });
  }

  const from = '2025-02-22';
  const to = '2025-03-02';
  const url = `https://financialmodelingprep.com/api/v3/economic_calendar?from=${from}&to=${to}&apikey=${apiKey}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const body = await res.json();

    const isArray = Array.isArray(body);
    const data = isArray ? body : (body?.data ?? body?.economicCalendar ?? []);
    const count = Array.isArray(data) ? data.length : 0;
    const sampleKeys = count > 0 && typeof data[0] === 'object' ? Object.keys(data[0]) : [];

    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      bodyIsArray: isArray,
      count,
      sampleKeys,
      firstItemSample: count > 0 ? (data[0] as Record<string, unknown>) : null,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), count: 0 });
  }
}
