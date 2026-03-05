'use server';

import { EarningsEvent } from '@/lib/types';

export async function fetchEarnings(dateStr: string): Promise<EarningsEvent[]> {
  try {
    // FIX: Use the exact requested local date string to prevent shifting Friday -> Saturday
    const queryDate = dateStr;

    // Switch to NASDAQ API which is more stable for public access
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

    return json.data.rows.map((row: any, i: number) => {
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
    }).slice(0, 20); // Limit to top 20 to keep the UI clean
  } catch (error) {
    console.error(`Error fetching earnings for ${dateStr}:`, error);
    return [];
  }
}