'use client';

import React, { useEffect, useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Loader2, Sparkles, Newspaper } from 'lucide-react';
import { ConfluenceEngine } from '@/lib/confluence/engine';
import { ConfluenceResult } from '@/lib/confluence/types';
import { useMarketData } from '@/lib/marketdata/useMarketData';
import { useSettings } from '@/context/SettingsContext';
import { fetchNews } from '@/app/actions/fetchNews';

export function ConfluenceScanner({ symbol, timeframeLabel = '15m' }: { symbol: string, timeframeLabel?: string }) {
  const [bullish, setBullish] = useState<ConfluenceResult[]>([]);
  const [bearish, setBearish] = useState<ConfluenceResult[]>([]);
  const [newsScore, setNewsScore] = useState(0);
  const { settings } = useSettings();
  
  const { data } = useMarketData([symbol]);
  const tick = data[symbol];

  // Asynchronously fetch news to feed the engine
  useEffect(() => {
    const getNews = async () => {
      const symName = symbol.split('=')[0].split('-')[0];
      const news = await fetchNews('General');
      let score = 0;
      let count = 0;
      news.forEach(n => {
        if (n.title.toLowerCase().includes(symName.toLowerCase())) {
          count++;
          if (n.title.match(/soar|jump|buy|bull|beat|growth|high|up/i)) score += 40;
          if (n.title.match(/plunge|drop|sell|bear|miss|shrink|low|down|risk/i)) score -= 40;
        }
      });
      setNewsScore(count > 0 ? score / count : 0);
    };
    getNews();
  }, [symbol]);

  useEffect(() => {
    if (!tick || !tick.history || tick.history.length < 50) return;

    const engine = new ConfluenceEngine({
      symbol,
      interval: timeframeLabel,
      quotes: tick.history
    }, newsScore); // Inject news score here
    
    const allActive = engine.calculateAll().filter(r => r.isActive);
    
    const bulls: ConfluenceResult[] = [];
    const bears: ConfluenceResult[] = [];

    allActive.forEach(res => {
      let multiplier = 1.0;
      if (settings.strategy === 'Scalper' && ['MOMENTUM', 'VOLUME', 'CANDLE'].includes(res.category)) multiplier = 1.25;
      if (settings.strategy === 'Swing' && ['SMC', 'STRUCTURE', 'SR'].includes(res.category)) multiplier = 1.25;
      if (settings.strategy === 'Macro' && ['MA', 'FUNDAMENTAL', 'QUANT', 'INTERMARKET'].includes(res.category)) multiplier = 1.25;

      res.score = Math.min(100, Math.round(res.score * multiplier));

      const str = (res.label + ' ' + res.description).toLowerCase();
      if (str.match(/bearish|resistance|supply|overbought|death cross|distribution|short|high|top|down|reject|sell|below|target|headwind/)) {
        bears.push(res);
      } else if (str.match(/bullish|support|demand|oversold|golden cross|accumulation|long|low|bottom|up|buy|above|expansion|tailwind/)) {
        bulls.push(res);
      } else {
        bulls.push(res); 
      }
    });

    setBullish(bulls.sort((a, b) => b.score - a.score));
    setBearish(bears.sort((a, b) => b.score - a.score));
  }, [tick, timeframeLabel, settings.strategy, newsScore]);

  const loading = !tick || !tick.history || tick.history.length < 50;

  if (loading) return <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-2"><Loader2 size={14} className="animate-spin text-accent" /><span className="text-[10px] font-bold tracking-widest uppercase">Computing Confluences...</span></div>;

  const totalScore = bullish.reduce((sum, r) => sum + r.score, 0) + bearish.reduce((sum, r) => sum + r.score, 0);
  const bullPct = totalScore > 0 ? (bullish.reduce((sum, r) => sum + r.score, 0) / totalScore) * 100 : 50;

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1">
          {timeframeLabel} Matrix 
          <span className="bg-accent/10 text-accent px-1 py-0.5 rounded-sm flex items-center gap-1"><Sparkles size={8}/> {settings.strategy} Weighted</span>
        </div>
        <span className="text-[9px] text-text-secondary font-mono font-bold">
          <span className="text-positive">{bullish.length}</span> vs <span className="text-negative">{bearish.length}</span>
        </span>
      </div>

      <div className="w-full h-1.5 bg-surface-highlight rounded-full overflow-hidden flex mb-2 shrink-0">
        <div className="h-full bg-positive transition-all duration-500" style={{ width: `${bullPct}%` }} />
        <div className="h-full bg-negative transition-all duration-500" style={{ width: `${100 - bullPct}%` }} />
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
        {/* BULLISH COLUMN */}
        <div className="flex flex-col overflow-y-auto custom-scrollbar pr-1 gap-1">
          <div className="sticky top-0 bg-background/90 backdrop-blur pb-1 text-[8px] font-bold text-positive uppercase flex items-center gap-1">
            <TrendingUp size={10} /> Bullish Forces
          </div>
          {bullish.map(res => (
            <div key={res.id} className="bg-positive/5 border border-positive/20 p-1.5 rounded-sm flex flex-col group relative">
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-bold text-text-primary leading-tight pr-4">{res.label}</span>
                <span className="text-[8px] font-mono text-positive absolute right-1.5 top-1.5">{res.score}</span>
              </div>
              <span className="text-[7px] text-text-tertiary mt-0.5 line-clamp-2">{res.description}</span>
            </div>
          ))}
        </div>

        {/* BEARISH COLUMN */}
        <div className="flex flex-col overflow-y-auto custom-scrollbar pr-1 gap-1">
          <div className="sticky top-0 bg-background/90 backdrop-blur pb-1 text-[8px] font-bold text-negative uppercase flex items-center gap-1">
            <TrendingDown size={10} /> Bearish Forces
          </div>
          {bearish.map(res => (
            <div key={res.id} className="bg-negative/5 border border-negative/20 p-1.5 rounded-sm flex flex-col group relative">
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-bold text-text-primary leading-tight pr-4">{res.label}</span>
                <span className="text-[8px] font-mono text-negative absolute right-1.5 top-1.5">{res.score}</span>
              </div>
              <span className="text-[7px] text-text-tertiary mt-0.5 line-clamp-2">{res.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}