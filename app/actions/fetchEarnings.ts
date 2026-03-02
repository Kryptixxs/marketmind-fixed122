'use server';

import { EarningsEvent } from '@/lib/types';

export async function fetchEarnings(dateStr: string): Promise<EarningsEvent[]> {
  try {
    // Using Seeking Alpha API
    // dateStr format: YYYY-MM-DD
    const url = `https://seekingalpha.com/api/v3/earnings_calendar/tickers?filter[selected_date]=${dateStr}&filter[currency]=USD`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Referer': 'https://seekingalpha.com/earnings/earnings-calendar',
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      console.warn(`Seeking Alpha API returned ${response.status} for ${dateStr}`);
      return [];
    }
    
    const json = await response.json();
    
    if (!json.data || !Array.isArray(json.data)) {
      return [];
    }
    
    // Map Seeking Alpha format to our app format
    return json.data.map((item: any) => {
      const attr = item.attributes;
      
      const epsEst = attr.eps_estimate;
      const epsAct = attr.eps_actual;
      const revEst = attr.revenue_estimate ? attr.revenue_estimate / 1000000000 : null; // Convert to Billions
      const revAct = attr.revenue_actual ? attr.revenue_actual / 1000000000 : null;

      let surprise = null;
      if (epsAct !== null && epsEst !== null && epsEst !== 0) {
        surprise = ((epsAct - epsEst) / Math.abs(epsEst)) * 100;
      }

      return {
        id: item.id,
        ticker: attr.slug ? attr.slug.toUpperCase() : 'N/A',
        name: attr.name || 'Unknown',
        date: dateStr,
        time: formatReleaseTime(attr.release_time),
        epsEst: epsEst !== null ? parseFloat(epsEst.toFixed(2)) : null,
        epsAct: epsAct !== null ? parseFloat(epsAct.toFixed(2)) : null,
        revEst: revEst !== null ? parseFloat(revEst.toFixed(2)) : null,
        revAct: revAct !== null ? parseFloat(revAct.toFixed(2)) : null,
        surprise: surprise !== null ? parseFloat(surprise.toFixed(2)) : null,
        sector: 'Unknown', // API doesn't provide this in this endpoint easily
        marketCap: '-' // API doesn't provide this
      };
    }).slice(0, 20); // Limit to top 20 for UI performance
  } catch (error) {
    console.error(`Error fetching earnings for ${dateStr}:`, error);
    return [];
  }
}

function formatReleaseTime(raw: string): 'bmo' | 'amc' | 'tbd' {
  if (raw === 'pre_market') return 'bmo';
  if (raw === 'post_market') return 'amc';
  return 'tbd';
}