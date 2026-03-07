'use client';

import { useEffect, useMemo, useState } from 'react';
import { TerminalChart } from '@/components/charts/TerminalChart';

type FnCode = 'DES' | 'FA' | 'WEI' | 'HP' | 'YAS' | 'TOP' | 'ECO' | 'NI';
type Side = 'BUY' | 'SELL';

type Security = {
  ticker: string;
  market: string;
  asset: string;
};

type Quote = {
  symbol: string;
  name: string;
  last: number;
  pct: number;
  vol: number;
  high: number;
  low: number;
};

type BookRow = {
  bid: number;
  ask: number;
  bidSz: number;
  askSz: number;
};

type TapeRow = {
  t: string;
  px: number;
  sz: number;
  side: Side;
};

const FUNCTION_CODES: FnCode[] = ['DES', 'FA', 'WEI', 'HP', 'YAS', 'TOP', 'ECO', 'NI'];

const KEYBAR = [
  { label: 'CANCEL', role: 'danger' },
  { label: 'EQUITY', role: 'sector' },
  { label: 'CORP', role: 'sector' },
  { label: 'GOVT', role: 'sector' },
  { label: 'CMDTY', role: 'sector' },
  { label: 'CRNCY', role: 'sector' },
  { label: 'GO', role: 'go' },
] as const;

const UNIVERSE: Array<{ symbol: string; name: string; base: number }> = [
  { symbol: 'AAPL US', name: 'Apple Inc', base: 196.5 },
  { symbol: 'MSFT US', name: 'Microsoft Corp', base: 430.4 },
  { symbol: 'NVDA US', name: 'NVIDIA Corp', base: 914.1 },
  { symbol: 'META US', name: 'Meta Platforms', base: 511.1 },
  { symbol: 'AMZN US', name: 'Amazon.com', base: 183.2 },
  { symbol: 'TSLA US', name: 'Tesla Inc', base: 214.7 },
  { symbol: 'SPX Index', name: 'S&P 500 Index', base: 5284.1 },
  { symbol: 'NDX Index', name: 'Nasdaq 100', base: 18645.4 },
  { symbol: 'US10Y Govt', name: 'US 10Y Yield', base: 4.31 },
  { symbol: 'EURUSD Curncy', name: 'Euro / Dollar', base: 1.0841 },
  { symbol: 'USDJPY Curncy', name: 'Dollar / Yen', base: 150.52 },
  { symbol: 'XAUUSD Cmdty', name: 'Gold Spot', base: 2325.7 },
];

const WIRE = [
  'ECB SPEAKERS MAINTAIN DATA-DEPENDENT GUIDANCE INTO CPI WINDOW',
  'US TECH OUTPERFORMS AS INDEX BREADTH IMPROVES ACROSS GROWTH BASKETS',
  'RATES VOL REMAINS ELEVATED WHILE FRONT-END EXPECTATIONS STABILIZE',
  'SYSTEMATIC FLOWS TURN MODESTLY PRO-RISK AFTER VOLATILITY COMPRESSION',
  'ENERGY HOLDS BID AS DOLLAR SOFTENS DURING EUROPEAN SESSION',
];

const hash = (x: string) => Array.from(x).reduce((a, c) => a + c.charCodeAt(0), 0);
const fmt = (v: number, d = 2) => v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

function parseCommand(raw: string): { sec?: Security; fn?: FnCode; hasGo: boolean } {
  const t = raw
    .replace(/[<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  if (!t) return { hasGo: false };
  const parts = t.split(' ');
  const hasGo = parts[parts.length - 1] === 'GO';
  const body = hasGo ? parts.slice(0, -1) : parts;
  const fn = body.length ? (body[body.length - 1] as FnCode) : undefined;
  const validFn = fn && FUNCTION_CODES.includes(fn) ? fn : undefined;
  const secParts = validFn ? body.slice(0, -1) : body;
  if (secParts.length < 3) return { fn: validFn, hasGo };
  return {
    hasGo,
    fn: validFn,
    sec: { ticker: secParts[0], market: secParts[1], asset: secParts.slice(2).join(' ') },
  };
}

function functionRows(fn: FnCode): Array<[string, string]> {
  if (fn === 'DES') return [['Sector', 'Technology'], ['MktCap', '$3.1T'], ['52W', '144.8 - 213.2'], ['Beta', '1.21'], ['RevTTM', '$389.5B']];
  if (fn === 'FA') return [['GrossMgn', '45.6%'], ['OpMgn', '30.3%'], ['ROE', '152.7%'], ['Debt/EBITDA', '1.8x'], ['FCFYield', '3.6%']];
  if (fn === 'WEI') return [['US', '+0.72%'], ['Europe', '-0.18%'], ['Asia', '+0.25%'], ['Breadth', '64/36'], ['VolRegime', 'Medium']];
  if (fn === 'YAS') return [['YTW', '4.91%'], ['Duration', '7.18'], ['Convexity', '0.90'], ['Spread', '186 bps'], ['ZSpread', '172 bps']];
  if (fn === 'ECO') return [['CPI', 'Tue 08:30'], ['FOMC', 'Wed 14:00'], ['NFP', 'Fri 08:30'], ['ECB', 'Thu 13:15'], ['BoJ', 'Fri 03:00']];
  if (fn === 'TOP') return [['LeadTheme', 'Rates + Growth'], ['USFocus', 'Mega-cap AI'], ['Europe', 'Industrials'], ['Asia', 'China flow'], ['Cmdty', 'Energy bid']];
  if (fn === 'HP') return [['Headline', 'Risk assets firmer'], ['Sentiment', 'Constructive'], ['Catalyst', 'Macro data'], ['Impact', 'Moderate'], ['DeskFocus', 'Index tech']];
  return [['Query', 'Ticker + topic'], ['Ranking', 'Relevance'], ['Sources', 'Cross-wire'], ['Recency', 'High'], ['Priority', 'Desk']];
}

export default function DashboardPage() {
  const [tick, setTick] = useState(0);
  const [fnCode, setFnCode] = useState<FnCode>('DES');
  const [security, setSecurity] = useState<Security>({ ticker: 'AAPL', market: 'US', asset: 'EQUITY' });
  const [command, setCommand] = useState('AAPL US EQUITY DES GO');
  const [logs, setLogs] = useState<string[]>([
    'TERMINAL ONLINE / SIMULATED LIVE MODE',
    'WORKFLOW: <SECURITY> <ASSET> <FUNCTION> GO',
    'CTRL+L FOCUS INPUT / ENTER EXECUTE',
  ]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 900);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        const input = document.getElementById('cmd-input') as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }
      if (e.key === 'Escape') setCommand('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const clocks = useMemo(() => {
    const ts = 1_711_800_000_000 + tick * 900;
    const d = new Date(ts);
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const s = d.getUTCSeconds();
    const mk = (o: number) => `${String((h + o + 24) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return { ny: mk(-4), ldn: mk(0), hkg: mk(8), tky: mk(9) };
  }, [tick]);

  const quotes = useMemo<Quote[]>(() => {
    return UNIVERSE.map((u, i) => {
      const k = hash(u.symbol);
      const wave = Math.sin((tick + i * 2) * 0.17 + k * 0.001) * 1.5;
      const pct = Number(wave.toFixed(2));
      const last = u.base * (1 + pct / 100);
      const range = Math.abs(Math.cos((tick + i) * 0.22 + k * 0.002)) * (u.base > 1000 ? 28 : u.base > 100 ? 3.2 : 0.02);
      return {
        symbol: u.symbol,
        name: u.name,
        last,
        pct,
        vol: 1 + Math.abs(Math.cos((tick + i) * 0.11)) * 8.9,
        high: last + range,
        low: last - range,
      };
    });
  }, [tick]);

  const active = useMemo(() => {
    const q = quotes.find((x) => x.symbol.startsWith(`${security.ticker} ${security.market}`));
    return q ?? quotes[0];
  }, [quotes, security.market, security.ticker]);

  const chart = useMemo(() => {
    const px = active?.last ?? 100;
    return Array.from({ length: 72 }, (_, i) => {
      const drift = Math.sin((i + tick) * 0.17) * 1.1 + Math.cos((i + tick * 0.7) * 0.13) * 0.8;
      return Number((px * (1 + drift / 100)).toFixed(4));
    });
  }, [active?.last, tick]);

  const book = useMemo<BookRow[]>(() => {
    const px = active?.last ?? 100;
    const step = px > 1000 ? 0.5 : px > 100 ? 0.05 : 0.01;
    return Array.from({ length: 12 }, (_, i) => ({
      bid: Number((px - step * (i + 1)).toFixed(4)),
      ask: Number((px + step * (i + 1)).toFixed(4)),
      bidSz: Math.round(90 + Math.abs(Math.sin((tick + i) * 0.27)) * 1450),
      askSz: Math.round(95 + Math.abs(Math.cos((tick + i) * 0.29)) * 1420),
    }));
  }, [active?.last, tick]);

  const tape = useMemo<TapeRow[]>(() => {
    return book.slice(0, 8).map((r, i) => ({
      t: clocks.ny,
      px: i % 2 === 0 ? r.bid : r.ask,
      sz: Math.round((r.bidSz + r.askSz) / 5),
      side: i % 2 === 0 ? 'BUY' : 'SELL',
    }));
  }, [book, clocks.ny]);

  const fnData = useMemo(() => functionRows(fnCode), [fnCode]);

  const blotter = useMemo(() => {
    return quotes.slice(0, 12).map((q, i) => {
      const side: Side = i % 2 === 0 ? 'BUY' : 'SELL';
      const qty = 50 + i * 25;
      const entry = q.last * (1 - q.pct / 100 / 2.8);
      const pnl = (q.last - entry) * qty * (side === 'BUY' ? 1 : -1);
      return { id: `${q.symbol}-${i}`, symbol: q.symbol, side, qty, price: q.last, pnl };
    });
  }, [quotes]);

  const desk = useMemo(() => {
    const adv = quotes.filter((q) => q.pct > 0).length;
    const dec = quotes.filter((q) => q.pct < 0).length;
    const breadth = quotes.length ? (adv / quotes.length) * 100 : 0;
    const avgMove = quotes.reduce((a, q) => a + Math.abs(q.pct), 0) / Math.max(1, quotes.length);
    const spread = 0.4 + Math.abs(Math.sin(tick * 0.12)) * 2.6;
    const latency = 7 + Math.round(Math.abs(Math.cos(tick * 0.09)) * 22);
    return { adv, dec, breadth, avgMove, spread, latency };
  }, [quotes, tick]);

  const doExecute = (raw?: string) => {
    const parsed = parseCommand(raw ?? command);
    if (!parsed.hasGo) {
      setLogs((prev) => ['REJECTED: MISSING GO', ...prev].slice(0, 20));
      return;
    }
    if (parsed.sec) setSecurity(parsed.sec);
    if (parsed.fn) setFnCode(parsed.fn);
    const sec = parsed.sec
      ? `${parsed.sec.ticker} ${parsed.sec.market} ${parsed.sec.asset}`
      : `${security.ticker} ${security.market} ${security.asset}`;
    const fn = parsed.fn ?? fnCode;
    setLogs((prev) => [`LOADED ${sec} <${fn}>`, ...prev].slice(0, 20));
  };

  const chartRange = useMemo(() => {
    const min = Math.min(...chart);
    const max = Math.max(...chart);
    const span = Math.max(0.0001, max - min);
    return chart.map((v) => (v - min) / span);
  }, [chart]);

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-[#05080d] text-[#d7deea] font-mono">
      <div className="h-6 border-b border-[#1a2433] bg-[#070d17] px-1 grid grid-cols-6 gap-x-2 text-[10px] tabular-nums">
        {quotes.slice(0, 6).map((q) => (
          <div key={`top-${q.symbol}`} className="flex items-center justify-between min-w-0">
            <span className="truncate text-[#9db0cb]">{q.symbol}</span>
            <span className={q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}%</span>
          </div>
        ))}
      </div>

      <div className="h-8 border-b border-[#1a2433] bg-[#090f1a] px-1 flex items-center gap-1 overflow-x-auto custom-scrollbar">
        {KEYBAR.map((k) => (
          <button
            key={k.label}
            onClick={() => {
              if (k.label === 'GO') doExecute();
              if (k.label === 'CANCEL') setCommand('');
            }}
            className={`h-6 px-2 border text-[10px] font-bold tracking-wide shrink-0 ${
              k.role === 'go'
                ? 'bg-[#123547] border-[#2a779b] text-[#a7dfff]'
                : k.role === 'danger'
                  ? 'bg-[#411b2a] border-[#8d3c59] text-[#ffc0d5]'
                  : 'bg-[#221a3b] border-[#4d3f81] text-[#d1c8ff]'
            }`}
          >
            {k.label}
          </button>
        ))}
        {FUNCTION_CODES.map((f) => (
          <button
            key={f}
            onClick={() => {
              const cmd = `${security.ticker} ${security.market} ${security.asset} ${f} GO`;
              setCommand(cmd);
              doExecute(cmd);
            }}
            className={`h-6 px-1.5 border text-[10px] font-bold shrink-0 ${fnCode === f ? 'bg-[#113328] border-[#2a7b60] text-[#99f1d6]' : 'bg-[#0e1522] border-[#28344a] text-[#9eb3cf]'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="h-8 border-b border-[#1a2433] bg-[#060c14] px-1 flex items-center gap-1">
        <span className="text-[11px] text-[#8ac5ef]">{security.ticker} {security.market}</span>
        <span className="text-[11px] text-[#7ea4d0]">&lt;{security.asset}&gt;</span>
        <span className="text-[#4b5f7e]">{'>'}</span>
        <input
          id="cmd-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && doExecute()}
          spellCheck={false}
          className="flex-1 h-6 border border-[#263247] bg-[#09111c] px-1 text-[11px] text-[#e2eaf6] outline-none focus:border-[#4a6f9c]"
        />
        <button onClick={() => doExecute()} className="h-6 px-1.5 border border-[#2a779b] bg-[#123547] text-[#b6e6ff] text-[10px] font-bold">
          GO
        </button>
      </div>

      <div className="h-6 border-b border-[#1a2433] bg-[#080f1b] px-1 flex items-center justify-between text-[10px] tabular-nums">
        <div className="flex items-center gap-2 text-[#a4b8d2]">
          <span>Adv/Dec {desk.adv}/{desk.dec}</span>
          <span>Breadth {fmt(desk.breadth, 0)}%</span>
          <span>AvgMove {fmt(desk.avgMove, 2)}%</span>
          <span>Spread {fmt(desk.spread, 1)}bp</span>
          <span>Latency {desk.latency}ms</span>
        </div>
        <div className="flex items-center gap-2 text-[#a4b8d2]">
          <span>NY {clocks.ny}</span>
          <span>LDN {clocks.ldn}</span>
          <span>HKG {clocks.hkg}</span>
          <span>TKY {clocks.tky}</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-[24%_48%_28%] grid-rows-[58%_42%] gap-px bg-[#1a2433]">
        <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
          <div className="h-6 px-1 border-b border-[#1a2433] bg-[#0b1320] flex items-center justify-between text-[10px]">
            <span className="text-[#9bc3e8] font-bold">MONITORS</span>
            <span className="text-[#7f99ba]">{quotes.length} LIVE</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-[10px] tabular-nums">
              <thead className="sticky top-0 bg-[#0a121f]">
                <tr className="text-[#7db0db]">
                  <th className="text-left px-1 py-0.5">Ticker</th>
                  <th className="text-right px-1 py-0.5">Last</th>
                  <th className="text-right px-1 py-0.5">%Chg</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.symbol}
                    className="border-t border-[#152033] hover:bg-[#0d1a2c] cursor-pointer"
                    onClick={() => {
                      const [ticker, market] = q.symbol.split(' ');
                      const inferred = market === 'Index' ? 'INDEX' : market === 'Curncy' ? 'CURNCY' : market === 'Govt' ? 'GOVT' : 'EQUITY';
                      setSecurity({ ticker, market, asset: inferred });
                    }}
                  >
                    <td className="px-1 py-0.5 text-[#d7e2f2]">{q.symbol}</td>
                    <td className="px-1 py-0.5 text-right text-[#edf3fb]">{fmt(q.last, q.last < 10 ? 4 : 2)}</td>
                    <td className={`px-1 py-0.5 text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>
                      {q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
          <div className="h-6 px-1 border-b border-[#1a2433] bg-[#0b1320] flex items-center justify-between text-[10px]">
            <span className="text-[#9bc3e8] font-bold">{security.ticker} {security.market} &lt;{fnCode}&gt;</span>
            <span className="text-[#9eb4cf]">{active?.name}</span>
          </div>
          <div className="h-12 grid grid-cols-4 gap-px bg-[#1a2433] text-[10px]">
            <div className="bg-[#08111d] px-1 py-0.5">
              <div className="text-[#6f89aa]">Last</div>
              <div className="text-[#edf4fc] font-bold tabular-nums">{fmt(active?.last ?? 0, active && active.last < 10 ? 4 : 2)}</div>
            </div>
            <div className="bg-[#08111d] px-1 py-0.5">
              <div className="text-[#6f89aa">Chg%</div>
              <div className={`font-bold tabular-nums ${(active?.pct ?? 0) >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{(active?.pct ?? 0) >= 0 ? '+' : ''}{fmt(active?.pct ?? 0, 2)}</div>
            </div>
            <div className="bg-[#08111d] px-1 py-0.5">
              <div className="text-[#6f89aa]">Vol</div>
              <div className="text-[#8cc7f3] font-bold tabular-nums">{fmt(active?.vol ?? 0, 2)}M</div>
            </div>
            <div className="bg-[#08111d] px-1 py-0.5">
              <div className="text-[#6f89aa]">Range</div>
              <div className="text-[#d9e5f5] font-bold tabular-nums">{fmt(active?.low ?? 0, 2)}-{fmt(active?.high ?? 0, 2)}</div>
            </div>
          </div>
          <div className="grid grid-cols-[62%_38%] gap-px bg-[#1a2433] flex-1 min-h-0">
            <div className="bg-[#08111d] min-h-0 flex flex-col">
              <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">INTRADAY</div>
              <div className="flex-1 min-h-0 relative">
                <TerminalChart
                  type="line"
                  series={chartRange}
                  secondary={chartRange.map((v, i) => chartRange[Math.max(0, i - 4)] ?? v)}
                  labels={Array.from({ length: chartRange.length }, (_, i) => `${i}`)}
                  metricLabel={`${security.ticker} INTRADAY`}
                  metricValue={`${fmt(active?.last ?? 0, active && active.last < 10 ? 4 : 2)}`}
                />
              </div>
            </div>
            <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">FUNCTION DECK</div>
              {fnData.map(([k, v]) => (
                <div key={k} className="text-[10px] px-1 py-0.5 border-b border-[#142034] flex items-center justify-between">
                  <span className="text-[#93a9c6]">{k}</span>
                  <span className="text-[#e0eaf7] font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
          <div className="h-6 px-1 border-b border-[#1a2433] bg-[#0b1320] flex items-center justify-between text-[10px]">
            <span className="text-[#9bc3e8] font-bold">DEPTH / TAPE / ALERTS</span>
            <span className="text-[#7f99ba]">L2</span>
          </div>
          <div className="grid grid-rows-[50%_24%_26%] gap-px bg-[#1a2433] flex-1 min-h-0">
            <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
              <table className="w-full text-[10px] tabular-nums">
                <thead className="sticky top-0 bg-[#0a121f] text-[#7db0db]">
                  <tr>
                    <th className="text-right px-1 py-0.5">BidSz</th>
                    <th className="text-right px-1 py-0.5">Bid</th>
                    <th className="text-right px-1 py-0.5">Ask</th>
                    <th className="text-right px-1 py-0.5">AskSz</th>
                  </tr>
                </thead>
                <tbody>
                  {book.map((r, i) => (
                    <tr key={`bk-${i}`} className="border-t border-[#142034]">
                      <td className="text-right px-1 py-0.5 text-[#4ce0a5]">{r.bidSz}</td>
                      <td className="text-right px-1 py-0.5 text-[#4ce0a5]">{fmt(r.bid, r.bid < 10 ? 4 : 2)}</td>
                      <td className="text-right px-1 py-0.5 text-[#ff7ca3]">{fmt(r.ask, r.ask < 10 ? 4 : 2)}</td>
                      <td className="text-right px-1 py-0.5 text-[#ff7ca3]">{r.askSz}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">TIME &amp; SALES</div>
              {tape.map((r, i) => (
                <div key={`tp-${i}`} className="text-[10px] px-1 py-0.5 border-b border-[#142034] grid grid-cols-[1fr_1fr_auto_auto] tabular-nums">
                  <span className="text-[#8aa2bf]">{r.t}</span>
                  <span className={r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{fmt(r.px, 2)}</span>
                  <span className="text-[#d8e4f4]">{r.sz}</span>
                  <span className={r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}>{r.side}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
              <div className="h-5 px-1 border-b border-[#1a2433] text-[10px] text-[#8cc7f3] flex items-center">ALERTS</div>
              {['VOL CLUSTER IN US TECH BASKET', 'CROSS-ASSET CORRELATION SHIFT > 0.80', 'RATES VOL RISING INTO DATA WINDOW'].map((a) => (
                <div key={a} className="text-[9px] px-1 py-0.5 border-b border-[#142034] text-[#dbe7f7]">{a}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
          <div className="h-6 px-1 border-b border-[#1a2433] bg-[#0b1320] flex items-center justify-between text-[10px]">
            <span className="text-[#9bc3e8] font-bold">CROSS-ASSET MATRIX</span>
            <span className="text-[#7f99ba]">|%| Rank</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-[10px] tabular-nums">
              <thead className="sticky top-0 bg-[#0a121f] text-[#7db0db]">
                <tr>
                  <th className="text-left px-1 py-0.5">Asset</th>
                  <th className="text-right px-1 py-0.5">Last</th>
                  <th className="text-right px-1 py-0.5">%Chg</th>
                  <th className="text-right px-1 py-0.5">Vol</th>
                </tr>
              </thead>
              <tbody>
                {[...quotes]
                  .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
                  .map((q) => (
                    <tr key={`mx-${q.symbol}`} className="border-t border-[#142034]">
                      <td className="px-1 py-0.5 text-[#dbe7f7]">{q.symbol}</td>
                      <td className="px-1 py-0.5 text-right text-[#edf3fb]">{fmt(q.last, q.last < 10 ? 4 : 2)}</td>
                      <td className={`px-1 py-0.5 text-right font-bold ${q.pct >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{q.pct >= 0 ? '+' : ''}{fmt(q.pct, 2)}</td>
                      <td className="px-1 py-0.5 text-right text-[#9eb3cf]">{fmt(q.vol, 2)}M</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
          <div className="h-6 px-1 border-b border-[#1a2433] bg-[#0b1320] flex items-center justify-between text-[10px]">
            <span className="text-[#9bc3e8] font-bold">NEWS + COMMAND FEED</span>
            <span className="text-[#7f99ba]">LIVE</span>
          </div>
          <div className="grid grid-rows-[55%_45%] gap-px bg-[#1a2433] flex-1 min-h-0">
            <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
              {WIRE.map((n, i) => (
                <div key={n} className="text-[10px] px-1 py-0.5 border-b border-[#142034]">
                  <span className="text-[#7db0db] mr-1">BN {680 + i}</span>
                  <span className="text-[#dbe7f7]">{n}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#08111d] min-h-0 overflow-y-auto custom-scrollbar">
              {logs.map((l, i) => (
                <div key={`${l}-${i}`} className="text-[10px] px-1 py-0.5 border-b border-[#142034] text-[#cfe0f5]">{l}</div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#070e18] min-h-0 overflow-hidden flex flex-col">
          <div className="h-6 px-1 border-b border-[#1a2433] bg-[#0b1320] flex items-center justify-between text-[10px]">
            <span className="text-[#9bc3e8] font-bold">EXECUTION BLOTTER</span>
            <span className="text-[#7f99ba]">SIM</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="w-full text-[10px] tabular-nums">
              <thead className="sticky top-0 bg-[#0a121f] text-[#7db0db]">
                <tr>
                  <th className="text-left px-1 py-0.5">Symbol</th>
                  <th className="text-left px-1 py-0.5">Side</th>
                  <th className="text-right px-1 py-0.5">Qty</th>
                  <th className="text-right px-1 py-0.5">Last</th>
                  <th className="text-right px-1 py-0.5">PnL</th>
                </tr>
              </thead>
              <tbody>
                {blotter.map((r) => (
                  <tr key={r.id} className="border-t border-[#142034]">
                    <td className="px-1 py-0.5 text-[#dbe7f7]">{r.symbol}</td>
                    <td className={`px-1 py-0.5 font-bold ${r.side === 'BUY' ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{r.side}</td>
                    <td className="px-1 py-0.5 text-right text-[#edf3fb]">{r.qty}</td>
                    <td className="px-1 py-0.5 text-right text-[#edf3fb]">{fmt(r.price, 2)}</td>
                    <td className={`px-1 py-0.5 text-right font-bold ${r.pnl >= 0 ? 'text-[#4ce0a5]' : 'text-[#ff7ca3]'}`}>{r.pnl >= 0 ? '+' : ''}{fmt(r.pnl, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="h-6 border-t border-[#1a2433] bg-[#07101c] px-1 flex items-center overflow-hidden text-[10px] whitespace-nowrap">
        {[...WIRE, ...WIRE].map((n, i) => (
          <span key={`${n}-${i}`} className="mr-5">
            <span className="text-[#7db0db] mr-1">{660 + (i % 30)}</span>
            <span className="text-[#d7e3f3]">{n}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
