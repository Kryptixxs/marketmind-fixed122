'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { TerminalCommandBar } from '@/components/TerminalCommandBar';
import { TradeSetupPanel } from '@/components/widgets/TradeSetupPanel';
import { Wifi, Plus, Search, X } from 'lucide-react';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { useSettings } from '@/context/SettingsContext';

const DEFAULT_WATCHLIST = ['NAS100', 'SPX500', 'US30', 'CRUDE', 'GOLD', 'EURUSD', 'BTCUSD'];

const TV_WIDGET_MAP: Record<string, { tv: string, label: string }> = {
  'NAS100': { tv: 'PEPPERSTONE:NAS100', label: 'Nasdaq 100' },
  'SPX500': { tv: 'PEPPERSTONE:US500', label: 'S&P 500' },
  'US30': { tv: 'PEPPERSTONE:US30', label: 'Dow Jones' },
  'CRUDE': { tv: 'TVC:USOIL', label: 'Crude Oil' },
  'GOLD': { tv: 'TVC:GOLD', label: 'Gold' },
  'EURUSD': { tv: 'FX:EURUSD', label: 'EUR/USD' },
  'BTCUSD': { tv: 'BINANCE:BTCUSDT', label: 'Bitcoin' },
};

export default function TerminalPage() {
  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const { data: marketData } = useMarketData(watchlist, '15m');
  const { settings } = useSettings();
  
  const isTerminal = settings.uiTheme === 'terminal';
  const activeQuote = marketData[activeSymbol];
  const getTVSymbol = (sym: string) => TV_WIDGET_MAP[sym]?.tv || sym;

  // Flash effect ref for tracking changes
  const prevPrices = useRef<Record<string, number>>({});
  const [flashStates, setFlashStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const newFlashes: Record<string, boolean> = {};
    let hasChanges = false;
    
    Object.values(marketData).forEach(tick => {
      if (prevPrices.current[tick.symbol] && prevPrices.current[tick.symbol] !== tick.price) {
        newFlashes[tick.symbol] = true;
        hasChanges = true;
      }
      prevPrices.current[tick.symbol] = tick.price;
    });

    if (hasChanges) {
      setFlashStates(prev => ({ ...prev, ...newFlashes }));
      setTimeout(() => setFlashStates({}), isTerminal ? 100 : 300);
    }
  }, [marketData, isTerminal]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-background">
      {isTerminal && <TerminalCommandBar />}

      <div 
        className="flex-1 w-full flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-12 overflow-y-auto lg:overflow-hidden custom-scrollbar"
        style={{ gap: 'var(--grid-gap)', padding: 'var(--grid-gap)' }}
      >
        
        {/* --- LEFT COLUMN: MARKET WATCH --- */}
        <div className="lg:col-span-3 lg:row-span-12 min-h-[400px] lg:h-full flex flex-col">
          <Widget title={isTerminal ? "QUOTE_BOARD_V1" : "Market Watch"}>
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar divide-y divide-border">
              {watchlist.map(sym => {
                const data = marketData[sym];
                const isPositive = data?.change >= 0;
                const isActive = activeSymbol === sym;
                const isFlashing = flashStates[sym];
                
                if (isTerminal) {
                  // TERMINAL MODE: Monolithic, inverted highlights, raw bid/ask simulation
                  return (
                    <div 
                      key={sym} onClick={() => setActiveSymbol(sym)}
                      className={`flex justify-between items-center px-4 py-2 cursor-pointer ${isActive ? 'bg-accent text-accent-text font-bold' : 'hover:bg-surface-highlight'}`}
                    >
                      <div className="flex items-center gap-3">
                        {isActive ? <span className="text-accent-text">{'>'}</span> : <span className="opacity-0">{'>'}</span>}
                        <span>{sym}</span>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-[8px] opacity-70">BID</span>
                          <span className={isFlashing ? 'value-flash' : ''}>{data ? (data.price * 0.9999).toFixed(2) : '----'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] opacity-70">ASK</span>
                          <span className={isFlashing ? 'value-flash' : ''}>{data ? (data.price * 1.0001).toFixed(2) : '----'}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ARCHITECT MODE: Soft borders, glow dots, sparkline intent
                return (
                  <div 
                    key={sym} onClick={() => setActiveSymbol(sym)}
                    className={`flex justify-between items-center px-4 py-3 cursor-pointer transition-all ${isActive ? 'bg-surface-highlight' : 'hover:bg-surface-highlight/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-positive shadow-[0_0_8px_theme(colors.teal.400)]' : 'bg-negative shadow-[0_0_8px_theme(colors.rose.400)]'}`} />
                      <div className="flex flex-col">
                        <span className="font-medium text-text-primary text-xs">{sym}</span>
                        <span className="text-[10px] text-text-secondary">{TV_WIDGET_MAP[sym]?.label}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-semibold text-text-primary ${isFlashing ? 'value-flash' : ''}`}>
                        {data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
                      </span>
                      <span className={`text-[10px] font-medium ${isPositive ? 'text-positive' : 'text-negative'}`}>
                        {isPositive ? '+' : ''}{data ? data.changePercent.toFixed(2) : '--'}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Widget>
        </div>

        {/* --- CENTER COLUMN: CHART --- */}
        <div className="lg:col-span-6 lg:row-span-12 flex flex-col min-h-[500px] lg:h-full">
          <Widget 
            title={`${activeSymbol} ${isTerminal ? 'PRIMARY_DISPLAY' : 'Technical View'}`}
            actions={<div className="flex items-center gap-1.5 text-[9px] text-accent"><Wifi size={10}/> LIVE</div>}
          >
            <div className="w-full h-full bg-background relative">
               <TradingViewChart 
                  symbol={getTVSymbol(activeSymbol)} 
                  interval="15" 
                  // Architect gets Candles (1), Terminal gets OHLC Bars (0)
                  style={isTerminal ? "0" : "1"} 
               />
            </div>
          </Widget>
        </div>

        {/* --- RIGHT COLUMN: AI & NEWS --- */}
        <div className="lg:col-span-3 lg:row-span-12 flex flex-col min-h-[600px] lg:h-full" style={{ gap: 'var(--grid-gap)' }}>
          
          <div className="flex-1 min-h-0">
            <Widget title={isTerminal ? "AI_SYS_OVERRIDE" : "AI Trade Bias"}>
              <TradeSetupPanel tick={activeQuote} timeframeLabel="15M" />
            </Widget>
          </div>

          <div className="flex-1 min-h-0">
            <Widget title={isTerminal ? "RAW_WIRE_FEED" : "Global Wire"}>
              <NewsFeed activeSymbol={activeSymbol} />
            </Widget>
          </div>

        </div>

      </div>
    </div>
  );
}