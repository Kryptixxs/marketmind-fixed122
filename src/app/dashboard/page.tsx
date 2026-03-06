'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BookOpen,
  Clock3,
  Loader2,
  Radar,
  Shield,
  TrendingDown,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { TerminalCommandBar } from '@/features/Terminal/components/TerminalCommandBar';
import { useTunnel } from '@/features/Terminal/context/TunnelContext';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { NewsFeed } from '@/features/News/components/NewsFeed';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { fetchMarketData } from '@/app/actions/fetchMarketData';
import { OHLCV } from '@/features/MarketData/services/marketdata/types';
import { useSettings } from '@/services/context/SettingsContext';
import { BLOOMBERG_FUNCTIONS } from '@/features/Terminal/services/command-registry';

const MARKET_CATEGORIES: Record<string, string[]> = {
  Equities: ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD'],
  Indices: ['NAS100', 'SPX500', 'US30', 'RUSSELL', 'DAX40', 'FTSE100', 'NIKKEI'],
  Forex: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'],
  Commodities: ['GOLD', 'SILVER', 'CRUDE', 'NATGAS', 'COPPER'],
  Crypto: ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD'],
  Macro: ['DXY', 'VIX', 'US10Y', 'US2Y'],
};

const ALL_SYMBOLS = Object.values(MARKET_CATEGORIES).flat();

const LABELS: Record<string, string> = {
  AAPL: 'Apple', NVDA: 'NVIDIA', MSFT: 'Microsoft', TSLA: 'Tesla', GOOGL: 'Alphabet', AMZN: 'Amazon', META: 'Meta', AMD: 'AMD',
  NAS100: 'Nasdaq 100', SPX500: 'S&P 500', US30: 'Dow Jones', RUSSELL: 'Russell 2000', DAX40: 'DAX 40', FTSE100: 'FTSE 100', NIKKEI: 'Nikkei',
  EURUSD: 'EUR/USD', GBPUSD: 'GBP/USD', USDJPY: 'USD/JPY', AUDUSD: 'AUD/USD', USDCAD: 'USD/CAD',
  GOLD: 'Gold', SILVER: 'Silver', CRUDE: 'Crude Oil', NATGAS: 'Nat Gas', COPPER: 'Copper',
  BTCUSD: 'Bitcoin', ETHUSD: 'Ethereum', SOLUSD: 'Solana', BNBUSD: 'BNB', XRPUSD: 'XRP',
  DXY: 'Dollar Index', VIX: 'Volatility', US10Y: '10Y Yield', US2Y: '2Y Yield',
};

const TIMEFRAMES: Array<{ label: string; interval: string }> = [
  { label: '5M', interval: '5m' },
  { label: '15M', interval: '15m' },
  { label: '1H', interval: '60m' },
  { label: '4H', interval: '240m' },
  { label: '1D', interval: '1d' },
];

const FUNCTION_PROFILES: Record<
  string,
  Partial<{
    showDepth: boolean;
    showRisk: boolean;
    showMacro: boolean;
    showBlotter: boolean;
    showMovers: boolean;
    category: string;
    timeframe: string;
    leftTitle: string;
    rightTitle: string;
  }>
> = {
  WEI: {
    showDepth: true,
    showRisk: true,
    showMacro: true,
    showBlotter: true,
    showMovers: true,
    category: 'Indices',
    timeframe: '15M',
    leftTitle: 'World Equity Indices',
    rightTitle: 'Depth / Tape / Regime',
  },
  ECO: {
    showDepth: false,
    showRisk: false,
    showMacro: true,
    showBlotter: false,
    showMovers: true,
    category: 'Macro',
    timeframe: '1H',
    leftTitle: 'Economic Calendar Monitor',
    rightTitle: 'Macro / Event Risk Board',
  },
  TOP: {
    showDepth: false,
    showRisk: true,
    showMacro: true,
    showBlotter: false,
    showMovers: true,
    category: 'Equities',
    timeframe: '15M',
    leftTitle: 'Top Headlines / Assets',
    rightTitle: 'News Risk / Desk Signals',
  },
  NI: {
    showDepth: false,
    showRisk: true,
    showMacro: true,
    showBlotter: false,
    showMovers: true,
    category: 'Equities',
    timeframe: '15M',
    leftTitle: 'News Search Universe',
    rightTitle: 'Filtered Intel / Event Risk',
  },
  PORT: {
    showDepth: false,
    showRisk: true,
    showMacro: false,
    showBlotter: true,
    showMovers: false,
    category: 'Equities',
    timeframe: '1D',
    leftTitle: 'Portfolio Holdings Lens',
    rightTitle: 'Exposure / Risk Console',
  },
  BMAP: {
    showDepth: false,
    showRisk: false,
    showMacro: false,
    showBlotter: true,
    showMovers: true,
    category: 'Equities',
    timeframe: '1D',
    leftTitle: 'Market Map / Sector Breadth',
    rightTitle: 'Sector Rotation Console',
  },
  MOV: {
    showDepth: false,
    showRisk: false,
    showMacro: false,
    showBlotter: true,
    showMovers: true,
    category: 'Equities',
    timeframe: '15M',
    leftTitle: 'Top Movers Universe',
    rightTitle: 'Momentum / Flow Diagnostics',
  },
  BTMM: {
    showDepth: false,
    showRisk: true,
    showMacro: true,
    showBlotter: false,
    showMovers: true,
    category: 'Macro',
    timeframe: '1H',
    leftTitle: 'Money Market Ladder',
    rightTitle: 'Rates / Liquidity Structure',
  },
  GP: {
    showDepth: true,
    showRisk: true,
    showMacro: false,
    showBlotter: true,
    showMovers: true,
    category: 'Equities',
    timeframe: '15M',
    leftTitle: 'Instrument Monitor',
    rightTitle: 'Depth / Tape / Trade Plan',
  },
};

function PanelHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="h-7 min-h-[28px] flex items-center justify-between px-2 border-b border-border bg-surface shrink-0">
      <div className="flex items-center gap-1.5 min-w-0">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-widest text-text-secondary truncate">{title}</span>
      </div>
      <span className="text-[8px] text-text-tertiary font-mono">PROTOTYPE</span>
    </div>
  );
}

function BloombergFunctionRibbon({
  activeCode,
  onSelect,
}: {
  activeCode: string;
  onSelect: (code: string) => void;
}) {
  const keys = [
    { code: 'WEI', tone: 'warn' },
    { code: 'ECO', tone: 'good' },
    { code: 'TOP', tone: 'warn' },
    { code: 'NI', tone: 'good' },
    { code: 'PORT', tone: 'info' },
    { code: 'BMAP', tone: 'warn' },
    { code: 'MOV', tone: 'good' },
    { code: 'BTMM', tone: 'info' },
    { code: 'GP', tone: 'warn' },
  ] as const;
  const toneClass: Record<string, string> = {
    warn: 'bg-warning/20 border-warning/50 text-warning',
    good: 'bg-positive/15 border-positive/40 text-positive',
    info: 'bg-accent/15 border-accent/40 text-accent',
  };
  return (
    <div className="h-8 border-b border-border bg-black/50 flex items-center px-2 gap-1 overflow-x-auto custom-scrollbar">
      {keys.map((k) => (
        <button
          key={k.code}
          onClick={() => onSelect(k.code)}
          className={`px-2 py-1 border rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
            activeCode === k.code ? 'bg-accent/30 border-accent text-accent' : toneClass[k.tone]
          }`}
        >
          {k.code}
        </button>
      ))}
      <div className="h-4 w-px bg-border mx-1 shrink-0" />
      {['MENU', 'HELP', 'MSG', 'PRINT', 'MON', 'NEWS'].map((k) => (
        <button
          key={k}
          className="px-2 py-1 border border-border rounded text-[8px] font-mono uppercase tracking-wider text-text-tertiary hover:text-text-secondary"
        >
          {k}
        </button>
      ))}
    </div>
  );
}

function BottomHeadlineTape({ lines }: { lines: string[] }) {
  return (
    <div className="h-9 border-t border-warning/40 bg-black flex items-center overflow-hidden">
      <div className="px-3 h-full flex items-center bg-warning/20 text-warning text-[10px] font-black uppercase tracking-wider border-r border-warning/40 shrink-0">
        TOP NEWS
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-6 ticker-scroll whitespace-nowrap" style={{ width: 'max-content' }}>
          {[...lines, ...lines].map((line, i) => (
            <span key={`${line}-${i}`} className="text-[10px] font-mono text-text-secondary">
              <span className="text-warning mr-1">{String(660 + (i % 40)).padStart(3, '0')}</span>
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function fmtPrice(symbol: string, value: number) {
  if (symbol.includes('USD') && symbol.length === 6) return value.toFixed(4);
  if (value < 10) return value.toFixed(3);
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function seedFromSymbol(symbol: string) {
  return symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

export default function DashboardPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('SPX500');
  const [activeCategory, setActiveCategory] = useState('Indices');
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[1]);
  const [candleHistory, setCandleHistory] = useState<OHLCV[]>([]);
  const [activeFunctionCode, setActiveFunctionCode] = useState('WEI');

  const { settings, updateSettings } = useSettings();
  const { push } = useTunnel();
  const { data: marketData } = useMarketData(ALL_SYMBOLS);
  const { data: selectedOnlyData } = useMarketData([selectedSymbol], timeframe.interval);
  const marketClockTs = marketData[selectedSymbol]?.timestamp ?? 1_704_000_000_000;
  const displayData = useMemo(() => {
    const minuteBucket = Math.floor(marketClockTs / 60_000);
    const toFallback = (sym: string) => {
      const seed = seedFromSymbol(sym);
      const base = 20 + (seed % 2000) + (sym.includes('USD') ? 0.25 : 0);
      const drift = ((minuteBucket % 17) - 8) * 0.03;
      const changePercent = (((seed % 13) - 6) * 0.18) + drift;
      return {
        price: Number((base * (1 + changePercent / 100)).toFixed(4)),
        changePercent: Number(changePercent.toFixed(2)),
      };
    };
    return Object.fromEntries(
      ALL_SYMBOLS.map((sym) => {
        const live = marketData[sym];
        return [sym, live ?? toFallback(sym)];
      })
    ) as Record<string, { price: number; changePercent: number }>;
  }, [marketClockTs, marketData]);
  const selectedTick = selectedOnlyData[selectedSymbol] || displayData[selectedSymbol];
  const baseClockTs = selectedTick?.timestamp ?? candleHistory[candleHistory.length - 1]?.timestamp ?? 1_704_000_000_000;

  const drillToSymbol = (sym: string) => {
    setSelectedSymbol(sym);
    window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
    push({ type: 'SYMBOL', symbol: sym, label: LABELS[sym] || sym });
  };

  const loadHistory = useCallback(async (symbol: string, interval: string) => {
    const res = await fetchMarketData(symbol, interval);
    setCandleHistory(res?.history ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory(selectedSymbol, timeframe.interval).catch(() => setCandleHistory([]));
  }, [selectedSymbol, timeframe.interval, loadHistory]);

  useEffect(() => {
    const onPreset = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail?.toUpperCase();
      if (detail === 'BMON' || detail === 'FLOW' || detail === 'MACRO' || detail === 'RISK') {
        updateSettings({ activeWorkspace: detail });
      }
    };
    window.addEventListener('vantage-workspace-preset', onPreset as EventListener);
    return () => window.removeEventListener('vantage-workspace-preset', onPreset as EventListener);
  }, [updateSettings]);

  useEffect(() => {
    const onFunction = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail?.toUpperCase();
      if (BLOOMBERG_FUNCTIONS.some((f) => f.code === detail)) {
        setActiveFunctionCode(detail);
      }
    };
    window.addEventListener('vantage-function-code', onFunction as EventListener);
    return () => window.removeEventListener('vantage-function-code', onFunction as EventListener);
  }, []);

  const chartData = useMemo(() => {
    if (!candleHistory.length) return [];
    const mapped = candleHistory.map((h) => ({
      time: Math.floor(h.timestamp / 1000),
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close,
    }));
    if (mapped.length && selectedTick?.price) {
      const last = mapped[mapped.length - 1];
      last.high = Math.max(last.high, selectedTick.price);
      last.low = Math.min(last.low, selectedTick.price);
      last.close = selectedTick.price;
    }
    return mapped;
  }, [candleHistory, selectedTick]);

  const watchlist = useMemo(() => MARKET_CATEGORIES[activeCategory] || [], [activeCategory]);
  const topMovers = useMemo(() => {
    return ALL_SYMBOLS
      .sort((a, b) => Math.abs(displayData[b]!.changePercent) - Math.abs(displayData[a]!.changePercent))
      .slice(0, 12);
  }, [displayData]);

  const orderBook = useMemo(() => {
    const px = selectedTick?.price ?? 0;
    if (!px) return { bids: [], asks: [] as Array<{ price: number; size: number }> };
    const tickSize = px < 50 ? 0.01 : 0.05;
    const bids = Array.from({ length: 8 }, (_, i) => ({
      price: Number((px - tickSize * (i + 1)).toFixed(4)),
      size: Math.floor(120 + (Math.sin(i + px) + 1) * 420),
    }));
    const asks = Array.from({ length: 8 }, (_, i) => ({
      price: Number((px + tickSize * (i + 1)).toFixed(4)),
      size: Math.floor(100 + (Math.cos(i + px) + 1) * 390),
    }));
    return { bids, asks };
  }, [selectedTick?.price]);

  const tradeTape = useMemo(() => {
    const px = selectedTick?.price ?? 0;
    if (!px) return [];
    const now = baseClockTs;
    return Array.from({ length: 14 }, (_, i) => {
      const dir = i % 2 === 0 ? 1 : -1;
      const price = px * (1 + dir * (0.00015 + (i % 5) * 0.00008));
      return {
        id: `${selectedSymbol}-${i}`,
        time: new Date(now - i * 17_000).toISOString().slice(11, 19),
        price,
        size: Math.floor(25 + (i + 1) * 7),
        side: dir > 0 ? 'BUY' : 'SELL',
      };
    });
  }, [baseClockTs, selectedTick?.price, selectedSymbol]);

  const blotter = useMemo(() => {
    return topMovers.slice(0, 14).map((sym, i) => {
      const tick = displayData[sym]!;
      const qty = 50 + i * 25;
      const avg = tick.price * (1 - tick.changePercent / 100 / 3);
      const pnl = (tick.price - avg) * qty;
      return { sym, qty, avg, last: tick.price, pnl, side: i % 2 === 0 ? 'LONG' : 'SHORT' };
    });
  }, [displayData, topMovers]);

  const flowHeatmap = useMemo(() => {
    return topMovers.slice(0, 10).map((sym, i) => {
      const tick = displayData[sym];
      const seed = seedFromSymbol(sym);
      const imbalance = ((seed % 31) - 15) / 15;
      const pressure = Math.min(99, Math.abs(Math.round(tick.changePercent * 7 + i * 3)));
      return {
        sym,
        pressure,
        imbalance,
        trend: tick.changePercent >= 0 ? 'UP' : 'DN',
      };
    });
  }, [displayData, topMovers]);

  const macroEvents = useMemo(() => {
    const now = new Date();
    const hh = now.toISOString().slice(11, 16);
    return [
      `${hh} UTC  US Initial Claims beat by 12k`,
      `${hh} UTC  ECB speaker signals data-dependent path`,
      `${hh} UTC  Crude inventories draw larger than expected`,
      `${hh} UTC  Nasdaq breadth improves to 62% advancers`,
      `${hh} UTC  Vol regime stable; no stress trigger fired`,
      `${hh} UTC  FX carry basket modest risk-on tilt`,
    ];
  }, []);

  const riskStrip = useMemo(() => {
    const values = blotter.map((b) => b.pnl);
    const gross = values.reduce((a, b) => a + Math.abs(b), 0);
    const net = values.reduce((a, b) => a + b, 0);
    const var95 = gross * 0.042;
    const drawdown = Math.min(0, net / Math.max(gross, 1) * 100);
    return { gross, net, var95, drawdown };
  }, [blotter]);

  const regimeSnapshot = useMemo(() => {
    const movers = topMovers.slice(0, 8).map((s) => displayData[s].changePercent);
    const breadth = movers.filter((m) => m > 0).length / Math.max(movers.length, 1);
    const realizedVol = movers.reduce((a, b) => a + Math.abs(b), 0) / Math.max(movers.length, 1);
    const correlation = 0.22 + (Math.abs(displayData[selectedSymbol]?.changePercent || 0) % 1) * 0.46;
    const liquidityScore = Math.max(1, Math.min(99, Math.round(72 - realizedVol * 8 + breadth * 12)));
    const regime =
      realizedVol > 1.9 ? 'STRESS' :
      breadth > 0.62 ? 'RISK-ON' :
      breadth < 0.38 ? 'RISK-OFF' : 'BALANCED';
    return { breadth, realizedVol, correlation, liquidityScore, regime };
  }, [displayData, selectedSymbol, topMovers]);

  const factorExposure = useMemo(() => {
    const seed = seedFromSymbol(selectedSymbol);
    return [
      { name: 'Beta', value: ((seed % 220) / 100).toFixed(2), dir: seed % 2 === 0 ? 'LONG' : 'SHORT' },
      { name: 'Momentum', value: (((seed % 35) - 17) / 10).toFixed(2), dir: seed % 3 === 0 ? 'LONG' : 'SHORT' },
      { name: 'Value', value: (((seed % 28) - 14) / 10).toFixed(2), dir: seed % 5 < 3 ? 'LONG' : 'SHORT' },
      { name: 'Size', value: (((seed % 18) - 9) / 10).toFixed(2), dir: seed % 7 < 4 ? 'LONG' : 'SHORT' },
      { name: 'Quality', value: (((seed % 16) - 8) / 10).toFixed(2), dir: seed % 11 < 6 ? 'LONG' : 'SHORT' },
    ];
  }, [selectedSymbol]);

  const executionQuality = useMemo(() => {
    const slipBp = Math.max(0.2, Math.abs(displayData[selectedSymbol]?.changePercent || 0) * 1.7);
    const fillRate = Math.max(62, Math.min(99, 95 - slipBp * 2.2));
    const venueScore = Math.max(55, Math.min(99, 88 - slipBp * 1.4));
    return {
      slippageBp: slipBp,
      fillRate,
      venueScore,
      orderToTrade: 2.1 + slipBp / 4,
    };
  }, [displayData, selectedSymbol]);

  const pnlAttribution = useMemo(() => {
    const gross = Math.max(1, riskStrip.gross);
    return [
      { bucket: 'Delta', pnl: riskStrip.net * 0.54 },
      { bucket: 'Gamma', pnl: riskStrip.net * 0.11 },
      { bucket: 'Carry', pnl: riskStrip.net * 0.18 },
      { bucket: 'FX', pnl: riskStrip.net * 0.09 },
      { bucket: 'Residual', pnl: riskStrip.net * 0.08 },
    ].map((x) => ({ ...x, pct: (x.pnl / gross) * 100 }));
  }, [riskStrip]);

  const activeFunction = useMemo(
    () => BLOOMBERG_FUNCTIONS.find((f) => f.code === activeFunctionCode) ?? BLOOMBERG_FUNCTIONS[0],
    [activeFunctionCode]
  );

  const functionDeckRows = useMemo(() => {
    switch (activeFunctionCode) {
      case 'WEI':
        return topMovers.slice(0, 8).map((s) => `${s} ${displayData[s].changePercent >= 0 ? '+' : ''}${displayData[s].changePercent.toFixed(2)}%`);
      case 'ECO':
        return macroEvents.slice(0, 6);
      case 'TOP':
      case 'NI':
        return [
          `${selectedSymbol} liquidity narrative remains two-way`,
          'Cross-asset vol regime stable into next data print',
          'Systematic trend model increases index risk budget',
          'Dispersion remains elevated in single-name book',
        ];
      case 'PORT':
        return factorExposure.map((f) => `${f.name} ${f.value} ${f.dir}`);
      case 'BMAP':
        return ['US Tech +1.3%', 'Energy -0.8%', 'Financials +0.2%', 'Comms +0.7%', 'Utilities -0.3%', 'Industrials +0.1%'];
      case 'MOV':
        return topMovers.slice(0, 10).map((s) => `${s} ${displayData[s].changePercent.toFixed(2)}%`);
      case 'BTMM':
        return ['SOFR 5.31', 'EFFR 5.33', 'UST 2Y 4.63', 'UST 10Y 4.22', 'OIS 3M 5.19', 'TED 0.27'];
      case 'GP':
        return [`${selectedSymbol} primary trend: ${selectedTick?.changePercent && selectedTick.changePercent >= 0 ? 'up' : 'down'}`, 'Intraday volatility bucket: medium', 'Momentum signal: neutral+', 'Breakout probability: 58%'];
      default:
        return [activeFunction.desc];
    }
  }, [activeFunctionCode, activeFunction.desc, displayData, factorExposure, macroEvents, selectedSymbol, selectedTick, topMovers]);

  const worldClocks = useMemo(() => {
    const zones = [
      { city: 'New York', offset: -4 },
      { city: 'London', offset: 0 },
      { city: 'Hong Kong', offset: 8 },
      { city: 'Tokyo', offset: 9 },
    ];
    const stamp = new Date(baseClockTs);
    const utcHours = stamp.getUTCHours();
    const minutes = stamp.getUTCMinutes();
    const seconds = stamp.getUTCSeconds();
    return zones.map((z) => {
      const h = (utcHours + z.offset + 24) % 24;
      return {
        city: z.city,
        time: `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      };
    });
  }, [baseClockTs]);

  const heatmapRows = useMemo(() => {
    const symbols = [...topMovers, ...watchlist].slice(0, 24);
    return symbols.map((sym, i) => {
      const t = displayData[sym];
      const score = Math.min(100, Math.max(0, Math.round(50 + t.changePercent * 8 + (i % 5) * 3)));
      return { sym, score, change: t.changePercent, price: t.price };
    });
  }, [displayData, topMovers, watchlist]);

  const functionRibbon = useMemo(
    () => ['CANCEL', 'MSG', 'MENU', 'NEWS', 'ECO', 'TOP', 'WEI', 'NI', 'PORT', 'BMAP', 'MOV', 'BTMM', 'GP', 'HELP'],
    []
  );

  const loadedCount = ALL_SYMBOLS.filter((s) => marketData[s]?.price).length;
  const workspacePreset = settings.activeWorkspace;
  const layout = settings.workspaceLayouts[workspacePreset];
  const functionProfile = FUNCTION_PROFILES[activeFunctionCode] || {};
  const showDepth = functionProfile.showDepth ?? layout.showDepth;
  const showRisk = functionProfile.showRisk ?? layout.showRisk;
  const showMacro = functionProfile.showMacro ?? layout.showMacro;
  const showBlotter = functionProfile.showBlotter ?? layout.showBlotter;
  const showMovers = functionProfile.showMovers ?? layout.showMovers;
  const rightTitle =
    functionProfile.rightTitle ||
    (workspacePreset === 'FLOW' ? 'Depth / Tape' :
    workspacePreset === 'MACRO' ? 'Macro / Signal Board' :
    workspacePreset === 'RISK' ? 'Risk / Exposure Console' : 'Depth / Tape / Risk');
  const leftTitle = functionProfile.leftTitle || 'Cross-Asset Monitor';

  return (
    <div className={`h-full flex flex-col bg-background overflow-hidden ${settings.theme === 'bloomberg' ? 'bbg-frame' : ''}`}>
      <TerminalCommandBar />
      <BloombergFunctionRibbon activeCode={activeFunctionCode} onSelect={setActiveFunctionCode} />

      <div className="h-8 border-b border-border bg-surface flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Radar size={12} className="text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Market Operations Workspace</span>
        </div>
        <div className="flex items-center gap-1">
          {(['BMON', 'FLOW', 'MACRO', 'RISK'] as const).map((p) => (
            <button
              key={p}
              onClick={() => updateSettings({ activeWorkspace: p })}
              className={`px-2 py-0.5 text-[8px] font-bold uppercase border rounded ${
                workspacePreset === p ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {p}
            </button>
          ))}
          <span className="ml-2 text-[9px] font-mono text-text-tertiary">{loadedCount}/{ALL_SYMBOLS.length} feeds online</span>
        </div>
      </div>

      <div className="h-8 border-b border-border bg-[#070c15] flex items-center gap-1 px-2 overflow-x-auto custom-scrollbar">
        {functionRibbon.map((k, i) => (
          <button
            key={k}
            onClick={() => {
              const fn = BLOOMBERG_FUNCTIONS.find((f) => f.code === k);
              if (fn) setActiveFunctionCode(fn.code);
            }}
            className={`px-2 py-0.5 text-[8px] uppercase font-bold border rounded ${
              i % 3 === 0 ? 'bg-[#0a3f2a] text-[#7fffaf] border-[#2f7f57]' :
              i % 3 === 1 ? 'bg-[#2f2a0a] text-[#ffdc6b] border-[#7f6e2f]' :
              'bg-[#2a162a] text-[#ff9cfb] border-[#6f3f6d]'
            } ${activeFunctionCode === k ? 'ring-1 ring-accent' : ''}`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="h-7 border-b border-border bg-background/70 flex items-center gap-1 px-2 overflow-x-auto custom-scrollbar">
        <div className="px-2 py-0.5 border border-accent/40 rounded text-[9px] uppercase font-bold tracking-wider text-accent">
          {activeFunction.code} <span className="text-text-secondary">{activeFunction.label}</span>
        </div>
        <div className="px-2 py-0.5 border border-border rounded text-[9px] uppercase font-bold tracking-wider text-text-secondary">
          Regime: <span className="text-accent">{regimeSnapshot.regime}</span>
        </div>
        <div className="px-2 py-0.5 border border-border rounded text-[9px] font-mono text-text-secondary">
          Breadth {(regimeSnapshot.breadth * 100).toFixed(0)}%
        </div>
        <div className="px-2 py-0.5 border border-border rounded text-[9px] font-mono text-text-secondary">
          RV {regimeSnapshot.realizedVol.toFixed(2)}
        </div>
        <div className="px-2 py-0.5 border border-border rounded text-[9px] font-mono text-text-secondary">
          Corr {regimeSnapshot.correlation.toFixed(2)}
        </div>
        <div className="px-2 py-0.5 border border-border rounded text-[9px] font-mono text-text-secondary">
          Liquidity {regimeSnapshot.liquidityScore}
        </div>
        <div className="px-2 py-0.5 border border-border rounded text-[9px] font-mono text-text-secondary">
          OTR {executionQuality.orderToTrade.toFixed(2)}
        </div>
        <div className="h-4 w-px bg-border mx-1" />
        {BLOOMBERG_FUNCTIONS.map((fn) => (
          <button
            key={fn.code}
            onClick={() => setActiveFunctionCode(fn.code)}
            className={`px-1.5 py-0.5 border rounded text-[8px] font-mono uppercase ${
              activeFunctionCode === fn.code ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {fn.code}
          </button>
        ))}
      </div>

      <div
        className="flex-1 min-h-0 grid gap-px bg-border overflow-hidden"
        style={{
          gridTemplateColumns: `${layout.leftWidth}px 1fr ${layout.rightWidth}px`,
          gridTemplateRows: `minmax(320px, ${100 - layout.bottomHeight}%) minmax(260px, ${layout.bottomHeight}%)`,
        }}
      >
        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title={leftTitle} icon={<Waves size={11} className="text-cyan" />} />
          <div className="grid grid-cols-2 gap-px bg-border border-b border-border">
            {worldClocks.map((c) => (
              <div key={c.city} className="bg-background px-2 py-1">
                <div className="text-[8px] uppercase text-text-tertiary">{c.city}</div>
                <div className="text-[10px] font-mono font-bold text-text-primary">{c.time}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap border-b border-border bg-surface shrink-0">
            {Object.keys(MARKET_CATEGORIES).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-1.5 py-1 text-[8px] font-bold uppercase tracking-wider transition-colors ${
                  activeCategory === cat ? 'text-accent border-b border-accent bg-accent/10' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {watchlist.map((sym) => {
              const t = displayData[sym];
              const hasData = !!t?.price;
              const up = (t?.changePercent ?? 0) >= 0;
              const active = selectedSymbol === sym;
              return (
                <button
                  key={sym}
                  onClick={() => drillToSymbol(sym)}
                  className={`w-full text-left px-2 py-1 border-b border-border/30 ${active ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-surface-highlight border-l-2 border-l-transparent'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className={`text-[10px] font-bold ${active ? 'text-accent' : 'text-text-primary'}`}>{sym}</div>
                      <div className="text-[8px] text-text-tertiary truncate">{LABELS[sym] || sym}</div>
                    </div>
                    <div className="text-right">
                      {hasData ? (
                        <>
                          <div className="text-[10px] font-mono text-text-primary">{fmtPrice(sym, t!.price)}</div>
                          <div className={`text-[8px] font-mono font-bold ${up ? 'text-positive' : 'text-negative'}`}>
                            {up ? '+' : ''}{t!.changePercent.toFixed(2)}%
                          </div>
                        </>
                      ) : (
                        <Loader2 size={10} className="animate-spin text-text-tertiary ml-auto" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-background flex flex-col min-h-0">
          <PanelHeader title={`${selectedSymbol} — ${LABELS[selectedSymbol] || selectedSymbol}`} icon={<BookOpen size={11} className="text-accent" />} />
          <div className="h-8 border-b border-border bg-surface px-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.label}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${
                    timeframe.label === tf.label ? 'border-accent text-accent bg-accent/10' : 'border-border text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
            {selectedTick?.price ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-text-primary">{fmtPrice(selectedSymbol, selectedTick.price)}</span>
                <span className={`text-[10px] font-mono font-bold ${selectedTick.changePercent >= 0 ? 'text-positive' : 'text-negative'}`}>
                  {selectedTick.changePercent >= 0 ? '+' : ''}{selectedTick.changePercent.toFixed(2)}%
                </span>
              </div>
            ) : (
              <Loader2 size={12} className="animate-spin text-accent" />
            )}
          </div>
          <div className="h-14 border-b border-border bg-surface grid grid-cols-4 gap-px bg-border">
            {['US Tech', 'Energy', 'Rates', 'Crypto'].map((bucket, i) => {
              const sym = topMovers[i] || selectedSymbol;
              const chg = displayData[sym]?.changePercent || 0;
              const up = chg >= 0;
              return (
                <button
                  key={bucket}
                  onClick={() => drillToSymbol(sym)}
                  className={`text-left px-2 py-1 ${up ? 'bg-positive/15' : 'bg-negative/15'} hover:bg-surface-highlight`}
                >
                  <div className="text-[8px] uppercase font-bold text-text-tertiary">{bucket}</div>
                  <div className="text-[10px] font-bold text-text-primary">{sym}</div>
                  <div className={`text-[9px] font-mono font-bold ${up ? 'text-positive' : 'text-negative'}`}>
                    {up ? '+' : ''}{chg.toFixed(2)}%
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex-1 min-h-0">
            {chartData.length ? (
              <TradingChart key={`${selectedSymbol}-${timeframe.interval}`} data={chartData} symbol={selectedSymbol} />
            ) : (
              <div className="h-full flex items-center justify-center"><Loader2 size={18} className="animate-spin text-accent" /></div>
            )}
          </div>
        </div>

        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title={rightTitle} icon={<Shield size={11} className="text-warning" />} />

          <div className="p-2 border-b border-border">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Security Heatmap</div>
            <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-1">
              {heatmapRows.slice(0, 12).map((r) => (
                <button
                  key={`${r.sym}-${r.score}`}
                  onClick={() => drillToSymbol(r.sym)}
                  className={`w-full text-left px-2 py-1 border rounded ${
                    r.change >= 0 ? 'border-positive/30 bg-positive/10 hover:bg-positive/15' : 'border-negative/30 bg-negative/10 hover:bg-negative/15'
                  }`}
                >
                  <div className="flex items-center justify-between text-[8px] font-mono">
                    <span className="font-bold text-text-primary">{r.sym}</span>
                    <span className={r.change >= 0 ? 'text-positive' : 'text-negative'}>
                      {r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="h-1 bg-background/70 rounded mt-1 overflow-hidden">
                    <div
                      className={r.change >= 0 ? 'h-full bg-positive' : 'h-full bg-negative'}
                      style={{ width: `${r.score}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {showDepth && (
          <div className="p-2 border-b border-border">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Order Book ({selectedSymbol})</div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-background border border-border rounded p-1">
                <div className="text-[8px] text-positive font-bold mb-1">Bids</div>
                {orderBook.bids.map((b) => (
                  <button
                    key={`b-${b.price}`}
                    onClick={() =>
                      push({
                        type: 'ORDER',
                        id: `b-${selectedSymbol}-${b.price}`,
                        symbol: selectedSymbol,
                        label: `${selectedSymbol} Bid ${b.price}`,
                        side: 'BUY',
                        qty: b.size,
                        price: b.price,
                      })
                    }
                    className="w-full flex justify-between text-[8px] font-mono hover:bg-surface-highlight"
                  >
                    <span className="text-positive">{fmtPrice(selectedSymbol, b.price)}</span>
                    <span className="text-text-tertiary">{b.size}</span>
                  </button>
                ))}
              </div>
              <div className="bg-background border border-border rounded p-1">
                <div className="text-[8px] text-negative font-bold mb-1">Asks</div>
                {orderBook.asks.map((a) => (
                  <button
                    key={`a-${a.price}`}
                    onClick={() =>
                      push({
                        type: 'ORDER',
                        id: `a-${selectedSymbol}-${a.price}`,
                        symbol: selectedSymbol,
                        label: `${selectedSymbol} Ask ${a.price}`,
                        side: 'SELL',
                        qty: a.size,
                        price: a.price,
                      })
                    }
                    className="w-full flex justify-between text-[8px] font-mono hover:bg-surface-highlight"
                  >
                    <span className="text-negative">{fmtPrice(selectedSymbol, a.price)}</span>
                    <span className="text-text-tertiary">{a.size}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          )}

          {showDepth && (
          <div className="p-2 border-b border-border">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Time & Sales</div>
            <div className="bg-background border border-border rounded max-h-44 overflow-y-auto custom-scrollbar">
              {tradeTape.map((r) => (
                <button
                  key={r.id}
                  onClick={() =>
                    push({
                      type: 'TAPE',
                      id: r.id,
                      symbol: selectedSymbol,
                      label: `${selectedSymbol} ${r.side} ${r.size}`,
                      side: r.side as 'BUY' | 'SELL',
                      qty: r.size,
                      price: r.price,
                      time: r.time,
                    })
                  }
                  className="w-full grid grid-cols-[1fr_1fr_auto_auto] gap-2 px-2 py-1 border-b border-border/30 text-[8px] font-mono hover:bg-surface-highlight text-left"
                >
                  <span className="text-text-tertiary">{r.time}</span>
                  <span className={r.side === 'BUY' ? 'text-positive' : 'text-negative'}>{fmtPrice(selectedSymbol, r.price)}</span>
                  <span className="text-text-secondary">{r.size}</span>
                  <span className={r.side === 'BUY' ? 'text-positive' : 'text-negative'}>{r.side}</span>
                </button>
              ))}
            </div>
          </div>
          )}

          {showRisk && (
          <div className="p-2 border-b border-border">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Desk Risk Strip</div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-background border border-border rounded p-1.5">
                <div className="text-[7px] text-text-tertiary uppercase">Gross</div>
                <div className="text-[10px] font-mono font-bold text-text-primary">${riskStrip.gross.toFixed(0)}</div>
              </div>
              <div className="bg-background border border-border rounded p-1.5">
                <div className="text-[7px] text-text-tertiary uppercase">Net PnL</div>
                <div className={`text-[10px] font-mono font-bold ${riskStrip.net >= 0 ? 'text-positive' : 'text-negative'}`}>${riskStrip.net.toFixed(0)}</div>
              </div>
              <div className="bg-background border border-border rounded p-1.5">
                <div className="text-[7px] text-text-tertiary uppercase">VaR 95%</div>
                <div className="text-[10px] font-mono font-bold text-warning">${riskStrip.var95.toFixed(0)}</div>
              </div>
              <div className="bg-background border border-border rounded p-1.5">
                <div className="text-[7px] text-text-tertiary uppercase">Drawdown</div>
                <div className="text-[10px] font-mono font-bold text-negative">{riskStrip.drawdown.toFixed(2)}%</div>
              </div>
            </div>
          </div>
          )}

          {showMacro && (
          <div className="p-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Macro Board</div>
            {['SPX500', 'NAS100', 'US30', 'DXY', 'VIX', 'US10Y', 'GOLD', 'CRUDE'].map((sym) => {
              const t = displayData[sym];
              const up = (t?.changePercent ?? 0) >= 0;
              return (
                <div key={sym} className="flex items-center justify-between bg-background border border-border rounded px-2 py-1 mb-1">
                  <span className="text-[9px] font-bold text-text-primary">{LABELS[sym] || sym}</span>
                  <div className="text-right">
                    <div className="text-[9px] font-mono text-text-secondary">{fmtPrice(sym, t?.price ?? 0)}</div>
                    <div className={`text-[8px] font-mono ${up ? 'text-positive' : 'text-negative'}`}>{t ? `${up ? '+' : ''}${t.changePercent.toFixed(2)}%` : '--'}</div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          <div className="p-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Flow Heatmap</div>
            {flowHeatmap.map((f) => (
              <div key={f.sym} className="mb-1 rounded border border-border bg-background px-2 py-1">
                <div className="flex items-center justify-between text-[8px] font-mono">
                  <span className="text-text-primary font-bold">{f.sym}</span>
                  <span className={f.trend === 'UP' ? 'text-positive' : 'text-negative'}>
                    {f.trend} {f.pressure}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-surface-highlight overflow-hidden">
                  <div
                    className={`h-full ${f.imbalance >= 0 ? 'bg-positive' : 'bg-negative'}`}
                    style={{ width: `${Math.min(100, Math.max(8, Math.abs(Math.round(f.imbalance * 100))))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {showBlotter && (
        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title="Execution Blotter" icon={<Clock3 size={11} className="text-warning" />} />
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Avg</th>
                  <th className="text-right">Last</th>
                  <th className="text-right">PnL</th>
                </tr>
              </thead>
              <tbody>
                {blotter.map((b) => (
                  <tr
                    key={b.sym}
                    onClick={() =>
                      push({
                        type: 'ORDER',
                        id: `blotter-${b.sym}-${b.side}`,
                        symbol: b.sym,
                        label: `${b.sym} ${b.side}`,
                        side: b.side === 'LONG' ? 'BUY' : 'SELL',
                        qty: b.qty,
                        price: b.last,
                      })
                    }
                    className="cursor-pointer"
                  >
                    <td className="font-bold text-text-primary">{b.sym}</td>
                    <td><span className={`badge ${b.side === 'LONG' ? 'badge-positive' : 'badge-negative'}`}>{b.side}</span></td>
                    <td className="text-right font-mono">{b.qty}</td>
                    <td className="text-right font-mono">{fmtPrice(b.sym, b.avg)}</td>
                    <td className="text-right font-mono">{fmtPrice(b.sym, b.last)}</td>
                    <td className={`text-right font-mono font-bold ${b.pnl >= 0 ? 'text-positive' : 'text-negative'}`}>{b.pnl >= 0 ? '+' : ''}{b.pnl.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title="News / Alerts / Movers" icon={<Bell size={11} className="text-cyan" />} />
          <div className="flex-1 min-h-0 grid grid-cols-[1fr_170px] gap-px bg-border">
            <div className="bg-background min-h-0 overflow-hidden">
              <NewsFeed
                activeSymbol={selectedSymbol}
                onSelectArticle={(article) =>
                  push({
                    type: 'ARTICLE',
                    id: article.id || `dash-${article.source}-${article.time}`,
                    title: article.title,
                    label: article.title,
                    source: article.source,
                    time: article.time,
                    snippet: article.contentSnippet,
                    link: article.link,
                  })
                }
              />
            </div>
            <div className="bg-surface min-h-0 overflow-y-auto custom-scrollbar p-1.5">
              {showMovers && <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Top Movers</div>}
              {showMovers && topMovers.map((sym) => {
                const t = displayData[sym]!;
                const up = t.changePercent >= 0;
                return (
                  <button
                    key={sym}
                    onClick={() => drillToSymbol(sym)}
                    className="w-full bg-background border border-border rounded px-2 py-1 mb-1 text-left hover:border-border-highlight"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-primary">{sym}</span>
                      <span className={`text-[8px] font-mono ${up ? 'text-positive' : 'text-negative'}`}>
                        {up ? <TrendingUp size={9} className="inline mr-0.5" /> : <TrendingDown size={9} className="inline mr-0.5" />}
                        {up ? '+' : ''}{t.changePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-[8px] text-text-tertiary truncate">{LABELS[sym] || sym}</div>
                  </button>
                );
              })}
              {showMovers && <div className="h-px bg-border my-1" />}
              <div className="text-[8px] font-bold uppercase text-text-tertiary mb-1">Alert Log</div>
              {[
                `${selectedSymbol} touched intraday liquidity zone`,
                'Volatility cluster detected in index basket',
                'Cross-asset correlation shift > threshold',
              ].map((line, idx) => (
                <button
                  key={line}
                  onClick={() =>
                    push({
                      type: 'EVENT',
                      id: `alert-${idx}-${selectedSymbol}`,
                      label: line,
                      detail: `Desk signal generated for ${selectedSymbol} based on synthetic cross-asset model.`,
                      impact: idx === 0 ? 'HIGH' : idx === 1 ? 'MEDIUM' : 'LOW',
                    })
                  }
                  className="w-full text-left flex items-start gap-1.5 text-[8px] text-text-secondary mb-1 hover:bg-surface-highlight rounded px-1 py-0.5"
                >
                  <AlertTriangle size={9} className={idx === 0 ? 'text-warning mt-0.5' : 'text-text-tertiary mt-0.5'} />
                  <span>{line}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-surface flex flex-col min-h-0">
          <PanelHeader title="HF Analytics / Event Tape" icon={<Clock3 size={11} className="text-warning" />} />
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-2">
            <div className="border border-border bg-background rounded p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[8px] uppercase font-bold text-text-tertiary">Active Function Deck</div>
                <div className="text-[8px] font-mono text-accent">{activeFunction.code}</div>
              </div>
              <div className="text-[9px] text-text-secondary mb-1">{activeFunction.desc}</div>
              {functionDeckRows.slice(0, 8).map((row) => (
                <div key={row} className="text-[9px] font-mono text-text-secondary border-b border-border/40 last:border-b-0 py-0.5">
                  {row}
                </div>
              ))}
            </div>

            <div className="border border-border bg-background rounded p-2">
              <div className="text-[8px] uppercase font-bold text-text-tertiary mb-1">Execution Quality</div>
              <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                <div className="bg-surface rounded px-2 py-1">
                  <div className="text-text-tertiary">Slippage</div>
                  <div className="text-warning font-bold">{executionQuality.slippageBp.toFixed(2)}bp</div>
                </div>
                <div className="bg-surface rounded px-2 py-1">
                  <div className="text-text-tertiary">Fill Rate</div>
                  <div className="text-positive font-bold">{executionQuality.fillRate.toFixed(1)}%</div>
                </div>
                <div className="bg-surface rounded px-2 py-1">
                  <div className="text-text-tertiary">Venue Score</div>
                  <div className="text-cyan font-bold">{executionQuality.venueScore.toFixed(1)}</div>
                </div>
              </div>
            </div>

            <div className="border border-border bg-background rounded p-2">
              <div className="text-[8px] uppercase font-bold text-text-tertiary mb-1">Factor Exposure</div>
              {factorExposure.map((f) => (
                <div key={f.name} className="flex items-center justify-between text-[9px] font-mono border-b border-border/40 last:border-b-0 py-0.5">
                  <span className="text-text-secondary">{f.name}</span>
                  <span className={f.dir === 'LONG' ? 'text-positive' : 'text-negative'}>{f.value} {f.dir}</span>
                </div>
              ))}
            </div>

            <div className="border border-border bg-background rounded p-2">
              <div className="text-[8px] uppercase font-bold text-text-tertiary mb-1">PnL Attribution</div>
              {pnlAttribution.map((p) => (
                <div key={p.bucket} className="flex items-center justify-between text-[9px] font-mono border-b border-border/40 last:border-b-0 py-0.5">
                  <span className="text-text-secondary">{p.bucket}</span>
                  <span className={p.pnl >= 0 ? 'text-positive' : 'text-negative'}>
                    {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(0)} ({p.pct.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>

            <div className="border border-border bg-background rounded p-2">
              <div className="text-[8px] uppercase font-bold text-text-tertiary mb-1">Event Tape</div>
              {macroEvents.map((line) => (
                <button
                  key={line}
                  onClick={() =>
                    push({
                      type: 'EVENT',
                      id: `macro-${line.slice(0, 10)}`,
                      label: line,
                      detail: 'Macro desk timeline event generated from simulated macro tape.',
                      impact: 'MEDIUM',
                    })
                  }
                  className="w-full text-left mb-1 rounded border border-border bg-surface px-2 py-1 text-[9px] text-text-secondary font-mono hover:bg-surface-highlight"
                >
                  {line}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <BottomHeadlineTape lines={macroEvents} />
    </div>
  );
}
