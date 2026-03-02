'use server';

import { EarningsEvent } from '@/lib/types';

export async function fetchEarnings(dateStr: string): Promise<EarningsEvent[]> {
  try {
    // Switch to NASDAQ API which is more stable for public access
    const url = `https://api.nasdaq.com/api/calendar/earnings?date=${dateStr}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://www.nasdaq.com',
        'Referer': 'https://www.nasdaq.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.warn(`NASDAQ API error: ${response.status} for ${dateStr}`);
      return [];
    }

    const json = await response.json();
    
    // NASDAQ structure: data.rows[]
    if (!json.data || !json.data.rows || !Array.isArray(json.data.rows)) {
      return [];
    }

    return json.data.rows.map((row: any, i: number) => {
      // Clean up string values
      const epsEst = parseFloat(row.epsForecast?.replace('$', '') || '0');
      const epsAct = row.eps?.length ? parseFloat(row.eps.replace('$', '')) : null;
      
      // NASDAQ provides Market Cap in the row usually
      const marketCap = row.marketCap || '-';

      // Time is usually "Time Not Supplied" or "After Market Close"
      let time: 'bmo' | 'amc' | 'tbd' = 'tbd';
      if (row.time?.toLowerCase().includes('after')) time = 'amc';
      else if (row.time?.toLowerCase().includes('before') || row.time?.toLowerCase().includes('pre')) time = 'bmo';

      // Surprise is in %Surprise column
      const surprise = parseFloat(row.percentSurprise?.replace('%', '')) || null;
      
      return {
        id: `${dateStr}-${row.symbol}-${i}`,
        ticker: row.symbol?.toUpperCase() || 'N/A',
        name: row.name || 'Unknown',
        date: dateStr,
        time,
        epsEst,
        epsAct,
        revEst: null, // NASDAQ API doesn't provide revenue estimate in this endpoint easily
        revAct: null,
        surprise,
        sector: 'Unknown',
        marketCap,
      };
    }).slice(0, 20); // Limit to top 20
  } catch (error) {
    console.error(`Error fetching earnings for ${dateStr}:`, error);
    return [];
  }
}