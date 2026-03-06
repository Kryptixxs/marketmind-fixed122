'use server';

export interface SECFiling {
  id: string;
  form: string;
  company: string;
  cik: string;
  filed: string;
  accepted: string;
  url: string;
  description: string;
}

export async function fetchSECFilings(ticker?: string): Promise<SECFiling[]> {
  const symbol = (ticker || 'MARKET').toUpperCase();
  const today = new Date();

  return Array.from({ length: 8 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const form = ['10-Q', '8-K', '10-K', 'DEF 14A'][i % 4];
    return {
      id: `sim-sec-${symbol}-${i}`,
      form,
      company: symbol,
      cik: `${1000000 + i}`,
      filed: date,
      accepted: `${date}T14:${String(10 + i).padStart(2, '0')}:00Z`,
      url: '#',
      description: `${form} simulated filing for ${symbol}.`,
    };
  });
}
