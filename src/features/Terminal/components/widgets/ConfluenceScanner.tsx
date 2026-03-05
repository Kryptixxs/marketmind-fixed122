'use client';

import React, { useEffect, useState } from 'react';
import { Zap, TrendingUp, TrendingDown, Loader2, Sparkles, Newspaper } from 'lucide-react';
import { ConfluenceEngine } from '@/features/Terminal/services/confluence/engine';
import { ConfluenceResult } from '@/features/Terminal/services/confluence/types';
import { useMarketData } from '@/features/MarketData/services/marketdata/useMarketData';
import { useSettings } from '@/services/context/SettingsContext';
import { fetchNews } from '@/app/actions/fetchNews';
import { analyzeNewsSentiment } from '@/app/actions/analyzeNewsSentiment';

export function ConfluenceScanner({ symbol, timeframeLabel = '15m' }: { symbol: string, timeframeLabel?: string }) {
  const [bullish, setBullish] = useState<ConfluenceResult[]>([]);
  const [bearish, setBearish] = useState<ConfluenceResult[]>([]);
  const [newsData, setNewsData] = useState<{score: number, label: string} | null>(null);
  const { settings } = useSettings();
  
  const { data } = useMarketData([symbol]);
  const tick = data[symbol];

  // Asynchronously fetch news and use REAL AI to determine sentiment score
  useEffect(() => {
    const getNews = async () => {
      try {
        const symName = symbol.split('=')[0].split('-')[0];
        const news = await fetchNews('General');
        const headlines = news.slice(0, 10).map(n => n.title);
        const sentimentResult = await analyzeNewsSentiment(headlines, symName);
        setNewsData(sentimentResult);
      } catch (e) {
        console.error(e);
        setNewsData({ score: 0, label: 'Neutral' });
      }
    };
    getNews();
  }, [symbol]);

  useEffect(() => {
    if (!tick || !tick.history || tick.history.length < 50 || !newsData) return;

    // Pass the real AI news score into the technical confluence engine
    const engine = new ConfluenceEngine({
      symbol,
      interval: timeframeLabel,
      quotes: tick.history
    }, newsData.score); 
    
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
  }, [tick, timeframeLabel, settings.strategy, newsData]);

  const loading = !tick || !tick.history || tick.history.length < 50 || !newsData;

  if (loading) return <div className="flex flex-col items-center justify-center h-full text-text-tertiary gap-2"><Loader2 size={14} className="animate-spin text-accent" /><span className="text-[10px] font-bold tracking-widest uppercase">Computing Confluences...</span></div>;

  const totalScore = bullish.reduce((sum, r) => sum + r.score, 0) + bearish.reduce((sum, r) => sum + r.score, 0);
  const bullPct = totalScore > 0 ? (bullish.reduce((sum, r) => sum + r.score, 0) / totalScore) * 100 : 50;

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between shrink-0 mb-3">
        <div className="text-[10px] text-text-tertiary uppercase font-bold flex items-center gap-1.5">
          {timeframeLabel} Matrix
          <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded-sm flex items-center gap-1"><Sparkles size={10}/> AI Weighted</span>
        </div>
        <span className="text-xs text-text-secondary font-mono font-bold">
          <span className="text-positive">{bullish.length}</span> vs <span className="text-negative">{bearish.length}</span>
        </span>
      </div>

      <div className="w-full h-2 bg-surface-highlight rounded-full overflow-hidden flex mb-3 shrink-0">
        <div className="h-full bg-positive transition-all duration-500" style={{ width: `${bullPct}%` }} />
        <div className="h-full bg-negative transition-all duration-500" style={{ width: `${100 - bullPct}%` }} />
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
        {/* BULLISH COLUMN */}
        <div className="flex flex-col overflow-y-auto custom-scrollbar pr-1 gap-1.5">
          <div className="sticky top-0 bg-background/90 backdrop-blur pb-1 text-[10px] font-bold text-positive uppercase flex items-center gap-1.5">
            <TrendingUp size={12} /> Bullish Forces
          </div>
          {bullish.map(res => (
            <div key={res.id} className="bg-positive/5 border border-positive/20 p-2 rounded-sm flex flex-col group relative">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-text-primary leading-tight pr-5">{res.label}</span>
                <span className="text-[10px] font-mono font-bold text-positive absolute right-2 top-2">{res.score}</span>
              </div>
              <span className="text-[9px] text-text-tertiary mt-1 line-clamp-2 leading-snug">{res.description}</span>
            </div>
          ))}
        </div>

        {/* BEARISH COLUMN */}
        <div className="flex flex-col overflow-y-auto custom-scrollbar pr-1 gap-1.5">
          <div className="sticky top-0 bg-background/90 backdrop-blur pb-1 text-[10px] font-bold text-negative uppercase flex items-center gap-1.5">
            <TrendingDown size={12} /> Bearish Forces
          </div>
          {bearish.map(res => (
            <div key={res.id} className="bg-negative/5 border border-negative/20 p-2 rounded-sm flex flex-col group relative">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-text-primary leading-tight pr-5">{res.label}</span>
                <span className="text-[10px] font-mono font-bold text-negative absolute right-2 top-2">{res.score}</span>
              </div>
              <span className="text-[9px] text-text-tertiary mt-1 line-clamp-2 leading-snug">{res.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}