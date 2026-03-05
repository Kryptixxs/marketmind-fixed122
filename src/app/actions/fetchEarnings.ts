'use server';

import { EarningsEvent } from '@/lib/types';

export async function fetchEarnings(dateStr: string): Promise<EarningsEvent[]> {
  try {
    const queryDate = dateStr;
    const url = `https://api.nasdaq.com/api/calendar/earnings?date=${queryDate}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.nasdaq.com',
        'Referer': 'https://www.nasdaq.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 } // Cache NASDAQ API response for 1 hour
    });

    if (!response.ok) {
      console.warn(`NASDAQ API error: ${response.status} for ${queryDate}`);
      return [];
    }

    const json = await response.json();
    
    if (!json.data || !json.data.rows || !Array.isArray(json.data.rows)) {
      return [];
    }

    const mapped = json.data.rows.map((row: any, i: number) => {
      const safeFloat = (val: string | undefined): number | null => {
        if (!val) return null;
        const cleaned = val.toString().replace(/[$,%]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      };

      const epsEst = safeFloat(row.epsForecast);
      const epsAct = safeFloat(row.eps);
      const marketCap = row.marketCap || '-';

      let time: 'bmo' | 'amc' | 'tbd' = 'tbd';
      if (row.time?.toLowerCase().includes('after')) time = 'amc';
      else if (row.time?.toLowerCase().includes('before') || row.time?.toLowerCase().includes('pre')) time = 'bmo';

      const surprise = safeFloat(row.percentSurprise);
      
      return {
        id: `${dateStr}-${row.symbol}-${i}`,
        ticker: row.symbol?.toUpperCase() || 'N/A',
        name: row.name || 'Unknown',
        date: dateStr,
        time,
        epsEst,
        epsAct,
        revEst: null, 
        revAct: null,
        surprise,
        sector: 'Unknown',
        marketCap,
      };
    });

    // CRITICAL FIX: Sort by Market Cap descending before slicing
    // This ensures massive companies like TSLA/NVDA are never omitted on busy earnings days
    mapped.sort((a: any, b: any) => {
      const parseCap = (cap: string) => {
        if (!cap || cap === '-' || cap === 'N/A') return 0;
        let val = parseFloat(cap.replace(/[^0-9.]/g, ''));
        if (cap.toUpperCase().includes('T')) val *= 1000000000000;
        else if (cap.toUpperCase().includes('B')) val *= 1000000000;
        else if (cap.toUpperCase().includes('M')) val *= 1000000;
        return isNaN(val) ? 0 : val;
      };
      return parseCap(b.marketCap) - parseCap(a.marketCap);
    });

    return mapped.slice(0, 60); // Safely return top 60 companies by value
  } catch (error) {
    console.error(`Error fetching earnings for ${dateStr}:`, error);
    return [];
  }
}