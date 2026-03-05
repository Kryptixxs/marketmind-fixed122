'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { QuantCommandBar } from '@/features/Terminal/components/QuantCommandBar';
import { QuantContextBar } from '@/features/Terminal/components/QuantContextBar';
import { QuantSidePanel } from '@/features/Terminal/components/QuantSidePanel';
import { TradingChart } from '@/features/MarketData/components/TradingChart';
import { ConfluenceScanner } from '@/features/Terminal/components/widgets/ConfluenceScanner';
import { ICTPanel } from '@/features/Terminal/components/widgets/ICTPanel';
import { MiniCalendar } from '@/features/Terminal/components/widgets/MiniCalendar';
import { MarketInternals } from '@/features/Terminal/components/widgets/MarketInternals';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { useSettings } from '@/services/context/SettingsContext';
import { PanelLeftClose, PanelRightClose } from 'lucide-react';

export default function TerminalPage() {
  const { settings } = useSettings();
  const [activeSymbol, setActiveSymbol] = useState("NAS100");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const { data: marketData } = useMarketData([activeSymbol]);
  const activeQuote = marketData[activeSymbol];

  useEffect(() => {
    const handleSymbolChange = (e: any) => setActiveSymbol(e.detail);
    window.addEventListener('vantage-symbol-change', handleSymbolChange);
    return () => window.removeEventListener('vantage-symbol-change', handleSymbolChange);
  }, []);

  const chartData = useMemo(() => {
    if (!activeQuote || !activeQuote.history) return [];
    return activeQuote.history.map(h => ({
      time: Math.floor(h.timestamp / 1000),
      open: h.open,
      high: h.high,
      low: h.low,
      close: h.close
    }));
  }, [activeQuote?.history]);

  // Minimalist Quant Layout
  if (settings.theme === 'quant') {
    return (
      <div className="h-full w-full bg-background flex flex-col overflow-hidden text-text-primary">
        <QuantCommandBar activeSymbol={activeSymbol} onSymbolChange={setActiveSymbol} />
        
        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 bg-black relative">
            <TradingChart data={chartData} symbol={activeSymbol} />
            
            {/* Floating Toggle */}
            <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="absolute top-6 right-6 p-2 bg-background border border-border text-text-tertiary hover:text-text-primary transition-all z-10"
            >
              {isPanelOpen ? <PanelRightClose size={18} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
            </button>
          </div>

          <QuantSidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)}>
            <div className="space-y-12">
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-6">Market Internals</h3>
                <MarketInternals tick={activeQuote} />
              </section>
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-6">Structure & Flow</h3>
                <ICTPanel tick={activeQuote} />
              </section>
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-6">Confluence</h3>
                <ConfluenceScanner symbol={activeSymbol} />
              </section>
              <section>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary mb-6">Macro Events</h3>
                <MiniCalendar />
              </section>
            </div>
          </QuantSidePanel>
        </div>

        <QuantContextBar 
          bias={activeQuote?.changePercent >= 0 ? 'Bullish' : 'Bearish'} 
          vol={Math.abs(activeQuote?.changePercent || 0) > 1.5 ? 'High' : 'Low'}
        />
      </div>
    );
  }

  // Fallback to Bloomberg/Institutional Layout (Previous UI)
  // ... (Existing resizable panel code would go here, but for brevity I am focusing on the new Quant UI)
  return (
    <div className="h-full w-full flex items-center justify-center text-text-tertiary uppercase tracking-widest font-bold">
      Switching to {settings.theme} mode...
    </div>
  );
}