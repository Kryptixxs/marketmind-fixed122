'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Widget } from '@/components/Widget';
import TradingViewChart from '@/components/TradingViewChart';
import { NewsFeed } from '@/components/NewsFeed';
import { TerminalCommandBar } from '@/components/TerminalCommandBar';
import { TradeSetupPanel } from '@/components/widgets/TradeSetupPanel';
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
  const [watchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const { data: marketData } = useMarketData(watchlist, '15m');
  const { settings } = useSettings();
  
  const isTerminal = settings.uiTheme === 'terminal';
  const activeQuote = marketData[activeSymbol];
  const getTVSymbol = (sym: string) => TV_WIDGET_MAP[sym]?.tv || sym;

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
      setTimeout(() => setFlashStates({}), isTerminal ? 100 : 400); // Terminal is faster
      
      // Dispatch ambient bias to the global wrapper based on the active asset
      if (activeQuote) {
        const bias = activeQuote.changePercent >= 0 ? 'bullish' : 'bearish';
        window.dispatchEvent(new CustomEvent('vantage-ambient-bias', { detail: bias }));
      }
    }
  }, [marketData, activeQuote, isTerminal]);

  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-transparent">
      {isTerminal && <TerminalCommandBar />}

      <div 
        className="flex-1 w-full flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-12 overflow-y-auto lg:overflow-hidden custom-scrollbar transition-all duration-500"
        style={{ gap: isTerminal ? '0px' : '0.75rem', padding: isTerminal ? '0px' : '1rem' }}
      >
        
        {/* --- LEFT COLUMN: MARKET WATCH --- */}
        <div className="lg:col-span-3 lg:row-span-12 flex flex-col min-h-[400px]">
          <Widget title={isTerminal ? "QUOTE_BOARD" : "Market Watch"}>
            <div className={`flex flex-col h-full overflow-y-auto hide-scrollbar ${isTerminal ? 'divide-y divide-[#222222]' : 'gap-1 p-2'}`}>
              {watchlist.map(sym => {
                const data = marketData[sym];
                const isPositive = data?.change >= 0;
                const isActive = activeSymbol === sym;
                const isFlashing = flashStates[sym];
                
                if (isTerminal) {
                  return (
                    <div 
                      key={sym} onClick={() => setActiveSymbol(sym)}
                      className={`flex justify-between items-center px-3 py-1.5 cursor-pointer font-mono text-[11px] ${isActive ? 'bg-[#FFB000] text-black font-bold' : 'hover:bg-[#111111]'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{sym.padEnd(6, ' ')}</span>
                      </div>
                      <div className="flex gap-4 text-right">
                        <span className={isFlashing ? 'value-flash' : ''}>{data ? (data.price * 0.9999).toFixed(2).padStart(8, ' ') : '--------'}</span>
                        <span className={isFlashing ? 'value-flash' : ''}>{data ? (data.price * 1.0001).toFixed(2).padStart(8, ' ') : '--------'}</span>
                      </div>
                    </div>
                  );
                }

                // ARCHITECT MODE
                return (
                  <div 
                    key={sym} onClick={() => setActiveSymbol(sym)}
                    className={`btn-haptic flex justify-between items-center px-4 py-3 cursor-pointer rounded-xl transition-all duration-300 ${isActive ? 'bg-white/5 shadow-sm border border-white/10' : 'border border-transparent hover:bg-white/[0.02]'}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Glow Dot */}
                      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isPositive ? 'bg-positive shadow-[0_0_8px_theme(colors.teal.400)]' : 'bg-negative shadow-[0_0_8px_theme(colors.rose.400)]'}`} />
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary text-sm tracking-tight">{sym}</span>
                        <span className="text-[11px] text-text-secondary">{TV_WIDGET_MAP[sym]?.label}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-semibold text-text-primary ${isFlashing ? 'value-flash' : ''}`}>
                        {data ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
                      </span>
                      <span className={`text-[11px] font-medium ${isPositive ? 'text-positive' : 'text-negative'}`}>
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
        <div className={`lg:col-span-6 lg:row-span-12 flex flex-col min-h-[500px] ${isTerminal ? 'border-x border-[#222222]' : ''}`}>
          <Widget 
            title={`${activeSymbol} ${isTerminal ? 'MAIN_DISPLAY' : ''}`}
            isActiveTerminal={true}
          >
            <div className="w-full h-full relative">
               <TradingViewChart 
                  symbol={getTVSymbol(activeSymbol)} 
                  interval="15" 
                  style={isTerminal ? "0" : "1"} 
               />
            </div>
          </Widget>
        </div>

        {/* --- RIGHT COLUMN: AI & NEWS --- */}
        <div className="lg:col-span-3 lg:row-span-12 flex flex-col min-h-[600px]" style={{ gap: isTerminal ? '0px' : '0.75rem' }}>
          
          <div className={`flex-1 min-h-0 ${isTerminal ? 'border-b border-[#222222]' : ''}`}>
            <Widget title={isTerminal ? "SYSTEM_LOG" : "Algorithmic Bias"}>
              <TradeSetupPanel tick={activeQuote} timeframeLabel="15M" />
            </Widget>
          </div>

          <div className="flex-1 min-h-0">
            <Widget title={isTerminal ? "WIRE_FEED" : "Global Wire"}>
              <NewsFeed activeSymbol={activeSymbol} />
            </Widget>
          </div>

        </div>

      </div>
    </div>
  );
}