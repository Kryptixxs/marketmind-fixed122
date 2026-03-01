'use server';

export async function fetchEarnings(dateStr: string) {
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
      return {
        ticker: attr.slug ? attr.slug.toUpperCase() : 'N/A',
        name: attr.name || 'Unknown',
        time: formatReleaseTime(attr.release_time),
        est: attr.eps_estimate !== null && attr.eps_estimate !== undefined ? String(attr.eps_estimate) : '-',
        act: attr.eps_actual !== null && attr.eps_actual !== undefined ? String(attr.eps_actual) : '-',
        // Use revenue estimate as a proxy for "impact" or just random if not available
        // For now we keep a default impact as SA doesn't give a 1-5 rating directly
        impact: 3
      };
    }).slice(0, 20); // Limit to top 20 for UI performance
  } catch (error) {
    console.error(`Error fetching earnings for ${dateStr}:`, error);
    return [];
  }
}

function formatReleaseTime(raw: string): string {
  if (raw === 'pre_market') return 'Before Market Open';
  if (raw === 'post_market') return 'After Market Close';
  if (raw === 'intra_day') return 'During Market';
  return 'TBD';
}