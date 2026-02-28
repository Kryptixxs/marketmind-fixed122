'use server';

export async function fetchEarnings(dateStr: string) {
  try {
    // dateStr should be YYYY-MM-DD
    const response = await fetch(`https://api.nasdaq.com/api/calendar/earnings?date=${dateStr}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.nasdaq.com',
        'Referer': 'https://www.nasdaq.com/',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      console.error(`Nasdaq API returned ${response.status} for ${dateStr}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data || !data.data || !data.data.rows) {
      return [];
    }
    
    // Format the result
    return data.data.rows.map((item: any) => ({
      ticker: item.symbol || 'N/A',
      name: item.name || 'Unknown',
      time: item.time === 'time-pre-market' ? 'Before Market Open' : item.time === 'time-after-hours' ? 'After Market Close' : 'TBD',
      est: item.epsForecast ? item.epsForecast.replace('$', '') : '-',
      act: item.eps ? item.eps.replace('$', '') : '-',
      impact: Math.floor(Math.random() * 3) + 3 // Mock impact 3-5 since Nasdaq doesn't provide it
    })).slice(0, 15); // Limit to top 15 for UI performance
  } catch (error) {
    console.error(`Error fetching earnings for ${dateStr}:`, error);
    return [];
  }
}
