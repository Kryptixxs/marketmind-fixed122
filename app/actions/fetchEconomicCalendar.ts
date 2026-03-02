'use server';

import { EconomicEvent } from '@/lib/types';

// Mock data generator for robustness when external APIs fail or are rate-limited
// In a real prod env, this would connect to a paid Bloomberg/Refinitiv API
function generateMockEvents(dateStr: string): EconomicEvent[] {
  const events = [
    { title: 'Non-Farm Payrolls', country: 'USA', impact: 'High', currency: 'USD' },
    { title: 'Unemployment Rate', country: 'USA', impact: 'High', currency: 'USD' },
    { title: 'CPI YoY', country: 'USA', impact: 'High', currency: 'USD' },
    { title: 'GDP Growth Rate', country: 'USA', impact: 'High', currency: 'USD' },
    { title: 'Interest Rate Decision', country: 'USA', impact: 'High', currency: 'USD' },
    { title: 'Retail Sales MoM', country: 'USA', impact: 'Medium', currency: 'USD' },
    { title: 'PPI MoM', country: 'USA', impact: 'Medium', currency: 'USD' },
    { title: 'Initial Jobless Claims', country: 'USA', impact: 'Medium', currency: 'USD' },
    { title: 'Consumer Confidence', country: 'USA', impact: 'Medium', currency: 'USD' },
    { title: 'ISM Manufacturing PMI', country: 'USA', impact: 'High', currency: 'USD' },
    { title: 'ECB Interest Rate Decision', country: 'Euro Zone', impact: 'High', currency: 'EUR' },
    { title: 'BoE Interest Rate Decision', country: 'UK', impact: 'High', currency: 'GBP' },
    { title: 'German CPI MoM', country: 'Germany', impact: 'Medium', currency: 'EUR' },
    { title: 'Canadian GDP MoM', country: 'Canada', impact: 'High', currency: 'CAD' },
  ];

  // Deterministic random based on date
  const seed = dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const count = 5 + (seed % 10);
  
  return Array.from({ length: count }).map((_, i) => {
    const template = events[(seed + i) % events.length];
    const hour = 8 + (seed % 9); // 08:00 to 16:00
    const minute = (i * 15) % 60;
    
    // Generate realistic figures
    const forecastVal = (seed % 100) / 10 + (i % 5);
    const actualVal = Math.random() > 0.3 ? forecastVal + (Math.random() - 0.5) * 2 : null; // 70% chance of having actual data if "past"
    
    // Surprise calc
    let surprise = null;
    if (actualVal !== null) {
      surprise = ((actualVal - forecastVal) / Math.abs(forecastVal)) * 100;
    }

    return {
      id: `${dateStr}-${i}`,
      date: dateStr,
      time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      timestamp: new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`).getTime(),
      country: template.country,
      currency: template.currency,
      impact: template.impact as 'High' | 'Medium' | 'Low',
      title: template.title,
      actual: actualVal ? actualVal.toFixed(1) + '%' : '-',
      forecast: forecastVal.toFixed(1) + '%',
      previous: (forecastVal - 0.2).toFixed(1) + '%',
      surprise: surprise ? parseFloat(surprise.toFixed(2)) : null
    };
  });
}

export async function fetchEconomicCalendarBatch(dates: string[]): Promise<Record<string, EconomicEvent[]>> {
  // In a real scenario, this would fetch from an API and cache to DB
  // For this demo, we generate high-fidelity mock data to ensure the UI is perfect
  const results: Record<string, EconomicEvent[]> = {};
  
  for (const date of dates) {
    results[date] = generateMockEvents(date).sort((a, b) => a.time.localeCompare(b.time));
  }
  
  return results;
}