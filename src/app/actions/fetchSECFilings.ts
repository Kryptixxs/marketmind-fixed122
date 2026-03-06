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

const CACHE: { data: SECFiling[]; ts: number; ticker: string } = { data: [], ts: 0, ticker: '' };
const CACHE_TTL = 900_000;

export async function fetchSECFilings(ticker?: string): Promise<SECFiling[]> {
  const key = ticker || 'recent';
  if (CACHE.ticker === key && Date.now() - CACHE.ts < CACHE_TTL) return CACHE.data;

  try {
    let url: string;
    if (ticker) {
      const tickerRes = await fetch(
        `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&dateRange=custom&startdt=${new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]}&enddt=${new Date().toISOString().split('T')[0]}`,
        {
          headers: { 'User-Agent': 'VantageTerminal/1.0 contact@vantage.app', 'Accept': 'application/json' },
          next: { revalidate: 900 },
        }
      );
      url = `https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&forms=10-K,10-Q,8-K,S-1,DEF+14A&dateRange=custom&startdt=${new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]}`;
    } else {
      url = 'https://efts.sec.gov/LATEST/search-index?forms=10-K,10-Q,8-K&dateRange=custom&startdt=' +
        new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    }

    const fullSearchUrl = `https://efts.sec.gov/LATEST/search-index?q=${ticker || ''}&forms=10-K,10-Q,8-K,S-1&limit=20`;
    const res = await fetch(fullSearchUrl, {
      headers: { 'User-Agent': 'VantageTerminal/1.0 contact@vantage.app', 'Accept': 'application/json' },
      next: { revalidate: 900 },
    });

    if (!res.ok) {
      const recentUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${ticker || ''}&type=10-K&dateb=&owner=include&count=15&search_text=&action=getcompany&output=atom`;
      return CACHE.data;
    }

    const json = await res.json();
    if (!json.hits?.hits) return [];

    const filings: SECFiling[] = json.hits.hits.slice(0, 15).map((hit: any, i: number) => {
      const src = hit._source || {};
      return {
        id: `sec-${i}-${Date.now()}`,
        form: src.forms || src.form_type || 'Unknown',
        company: src.display_names?.[0] || src.entity_name || 'Unknown',
        cik: src.ciks?.[0] || '',
        filed: src.file_date || '',
        accepted: src.period_of_report || '',
        url: `https://www.sec.gov/Archives/edgar/data/${src.ciks?.[0]}/${src.file_num || ''}`,
        description: `${src.forms || ''} filing by ${src.display_names?.[0] || 'Unknown'}`,
      };
    });

    CACHE.data = filings;
    CACHE.ts = Date.now();
    CACHE.ticker = key;

    return filings;
  } catch (e) {
    console.warn('[SEC] Error:', (e as Error).message);
    return CACHE.data;
  }
}
