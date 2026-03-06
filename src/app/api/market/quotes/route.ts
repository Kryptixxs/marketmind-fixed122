import { NextRequest, NextResponse } from 'next/server';
import { getCached, setCache } from '@/lib/server-cache';

const CACHE_TTL = 15_000; // 15 seconds

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

const FINNHUB_SYMBOLS: Record<string, string> = {
  'AAPL': 'AAPL', 'TSLA': 'TSLA', 'NVDA': 'NVDA', 'MSFT': 'MSFT',
  'GOOGL': 'GOOGL', 'AMZN': 'AMZN', 'META': 'META', 'AMD': 'AMD',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols') || '';
  const symbols = symbolsParam.split(',').filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ error: 'No symbols provided' }, { status: 400 });
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  const results: Record<string, any> = {};

  await Promise.allSettled(
    symbols.map(async (sym) => {
      const cacheKey = `quote:${sym}`;
      const cached = getCached<any>(cacheKey);
      if (cached) {
        results[sym] = cached;
        return;
      }

      const finnhubSym = FINNHUB_SYMBOLS[sym];
      if (finnhubSym && apiKey) {
        try {
          const url = `${FINNHUB_BASE}/quote?symbol=${finnhubSym}&token=${apiKey}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.c && data.c > 0) {
              const quote = {
                symbol: sym,
                price: data.c,
                change: data.d,
                changePercent: data.dp,
                high: data.h,
                low: data.l,
                open: data.o,
                previousClose: data.pc,
                source: 'finnhub',
              };
              setCache(cacheKey, quote, CACHE_TTL);
              results[sym] = quote;
              return;
            }
          }
        } catch {
          // fall through to Yahoo
        }
      }

      try {
        const yfMap: Record<string, string> = {
          'NAS100': '^NDX', 'SPX500': '^GSPC', 'US30': '^DJI', 'RUSSELL': '^RUT',
          'DAX40': '^GDAXI', 'GOLD': 'GC=F', 'SILVER': 'SI=F', 'CRUDE': 'CL=F',
          'NATGAS': 'NG=F', 'EURUSD': 'EURUSD=X', 'GBPUSD': 'GBPUSD=X',
          'USDJPY': 'JPY=X', 'AUDUSD': 'AUDUSD=X', 'BTCUSD': 'BTC-USD',
          'ETHUSD': 'ETH-USD', 'SOLUSD': 'SOL-USD', 'VIX': '^VIX',
          'DXY': 'DX-Y.NYB', 'US10Y': '^TNX',
        };

        const yfSym = yfMap[sym] || sym;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yfSym}?interval=1d&range=1d`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (meta?.regularMarketPrice) {
            const prevClose = meta.previousClose || meta.regularMarketPrice;
            const change = meta.regularMarketPrice - prevClose;
            const quote = {
              symbol: sym,
              price: meta.regularMarketPrice,
              change,
              changePercent: prevClose !== 0 ? (change / prevClose) * 100 : 0,
              high: meta.regularMarketDayHigh,
              low: meta.regularMarketDayLow,
              open: meta.regularMarketOpen,
              previousClose: prevClose,
              source: 'yahoo',
            };
            setCache(cacheKey, quote, CACHE_TTL);
            results[sym] = quote;
          }
        }
      } catch {
        // symbol failed entirely
      }
    })
  );

  return NextResponse.json(results);
}
