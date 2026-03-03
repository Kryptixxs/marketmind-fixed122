'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Target, ArrowUpRight, ArrowDownRight, Crosshair, Zap, Newspaper, Loader2 } from 'lucide-react';
import { Tick } from '@/lib/marketdata/types';
import { findSwingPoints, findUnmitigatedFVGs } from '@/lib/tech-math';
import { fetchNews } from '@/app/actions/fetchNews';
import { analyzeNewsSentiment } from '@/app/actions/analyzeNewsSentiment';

export function ICTPanel({ tick, timeframeLabel = '15m' }: { tick?: Tick, timeframeLabel?: string }) {
  const [newsData, setNewsData] = useState<{score: number, label: string} | null>(null);
  const [isScoring, setIsScoring] = useState(false);

  // Fetch news and run REAL AI sentiment analysis
  useEffect(() => {
    if (!tick) return;
    const analyzeSentiment = async () => {
      setIsScoring(true);
      try {
        const symName = tick.symbol.split('=')[0].split('-')[0];
        const news = await fetchNews('General');
        const headlines = news.slice(0, 10).map(n => n.title);
        
        const sentimentResult = await analyzeNewsSentiment(headlines, symName);
        setNewsData(sentimentResult);
      } catch (e) {
        console.error(e);
        setNewsData({ score: 0, label: 'Neutral' });
      } finally {
        setIsScoring(false);
      }
    };
    analyzeSentiment();
  }, [tick?.symbol]);

  const data = useMemo(() => {
    if (!tick || !tick.history || tick.history.length < 30 || !newsData) return null;

    const history = tick.history;
    const current = history[history.length - 1];
    
    // Strict Fractal Swing Points
    const { swingHighs, swingLows } = findSwingPoints(history);
    const unmitigatedHighs = swingHighs.filter(h => !h.mitigated);
    const unmitigatedLows = swingLows.filter(l => !l.mitigated);

    const buysideLiquidity = unmitigatedHighs.length > 0 ? Math.min(...unmitigatedHighs.map(h => h.price)) : Math.max(...history.slice(-20).map(h=>h.high));
    const sellsideLiquidity = unmitigatedLows.length > 0 ? Math.max(...unmitigatedLows.map(l => l.price)) : Math.min(...history.slice(-20).map(h=>h.low));

    // Strict Unmitigated FVGs
    const activeFVGs = findUnmitigatedFVGs(history).map(fvg => ({
      ...fvg,
      distance: ((fvg.type === 'BISI' ? fvg.top - current.close : current.close - fvg.bottom) / current.close) * 100
    }));

    let sweep = null;
    if (current.high > buysideLiquidity && current.close < buysideLiquidity) {
      sweep = { type: 'Buy-Side Swept', level: buysideLiquidity, sentiment: 'BEARISH' };
    } else if (current.low < sellsideLiquidity && current.close > sellsideLiquidity) {
      sweep = { type: 'Sell-Side Swept', level: sellsideLiquidity, sentiment: 'BULLISH' };
    }

    let structure = 'Consolidation';
    let structBias = 'NEUTRAL';
    if (current.close > buysideLiquidity) { structure = 'BOS (Bull Break)'; structBias = 'BULLISH'; }
    else if (current.close < sellsideLiquidity) { structure = 'MSS (Bear Shift)'; structBias = 'BEARISH'; }

    const dealingRange = Math.max(buysideLiquidity, ...history.slice(-50).map(h=>h.high)) - Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low));
    const eq = Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low)) + (dealingRange / 2);
    const isDiscount = current.close < eq;

    // AI-Injected Execution Bias
    let algoBias = 'WAIT / NEUTRAL';
    let biasColor = 'text-text-secondary';
    const newsScore = newsData.score;
    
    const combinedBullish = (isDiscount ? 1 : 0) + (structBias === 'BULLISH' ? 2 : 0) + (sweep?.sentiment === 'BULLISH' ? 2 : 0) + (newsScore > 20 ? 1 : 0);
    const combinedBearish = (!isDiscount ? 1 : 0) + (structBias === 'BEARISH' ? 2 : 0) + (sweep?.sentiment === 'BEARISH' ? 2 : 0) + (newsScore < -20 ? 1 : 0);

    if (combinedBullish >= 4) { algoBias = 'HIGH CONVICTION LONG'; biasColor = 'text-positive'; }
    else if (combinedBearish >= 4) { algoBias = 'HIGH CONVICTION SHORT'; biasColor = 'text-negative'; }
    else if (sweep?.sentiment === 'BULLISH') { algoBias = 'SCALP LONG (Reversal)'; biasColor = 'text-positive'; }
    else if (sweep?.sentiment === 'BEARISH') { algoBias = 'SCALP SHORT (Reversal)'; biasColor = 'text-negative'; }
    else if (combinedBullish > combinedBearish) { algoBias = 'LEANING LONG'; biasColor = 'text-positive opacity-80'; }
    else if (combinedBearish > combinedBullish) { algoBias = 'LEANING SHORT'; biasColor = 'text-negative opacity-80'; }

    return { 
      buysideLiquidity, sellsideLiquidity, 
      fvgs: activeFVGs.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance)).slice(0, 2), 
      sweep, structure, isDiscount, algoBias, biasColor, currentPrice: current.close
    };
  }, [tick, newsData]);

  if (!tick) return <div className="flex h-full items-center justify-center opacity-50 text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Awaiting Data</div>;
  if (!data || isScoring) return <div className="flex flex-col h-full items-center justify-center opacity-50 text-[10px] uppercase font-bold tracking-widest text-accent gap-2"><Loader2 size={16} className="animate-spin" /> Analyzing AI Sentiment...</div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2 relative">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="text-[8px] text-text-tertiary uppercase font-bold tracking-widest flex items-center gap-1.5">
          <Target size={10} /> SMC Arrays ({timeframeLabel})
        </div>
        <div className={`text-[8px] font-bold uppercase flex items-center gap-1 ${newsData?.score > 0 ? 'text-positive' : newsData?.score < 0 ? 'text-negative' : 'text-text-tertiary'}`}>
          <Newspaper size={10} /> AI Bias: {newsData?.label}
        </div>
      </div>

      <div className="bg-surface-highlight border border-border p-3 rounded-sm flex flex-col items-center justify-center text-center">
        <span className="text-[9px] text-text-tertiary uppercase font-bold mb-1">Execution Bias</span>
        <span className={`text-xl font-black tracking-tighter ${data.biasColor}`}>{data.algoBias}</span>
      </div>
      
      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-2 gap-1">
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowUpRight size={8}/> Fractal BSL</span>
            <span className="text-[10px] font-mono text-text-primary mt-0.5">{data.buysideLiquidity.toFixed(2)}</span>
            <span className="text-[8px] text-text-tertiary mt-0.5">Unmitigated Target</span>
          </div>
          <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col">
            <span className="text-[8px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowDownRight size={8}/> Fractal SSL</span>
            <span className="text-[10px] font-mono text-text-primary mt-0.5">{data.sellsideLiquidity.toFixed(2)}</span>
            <span className="text-[8px] text-text-tertiary mt-0.5">Unmitigated Target</span>
          </div>
        </div>

        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex items-center justify-between">
          <span className="text-[9px] text-text-tertiary uppercase font-bold">Structure ({timeframeLabel})</span>
          <span className={`text-[9px] font-mono font-bold ${data.isDiscount ? 'text-positive' : 'text-negative'}`}>
            {data.structure} • {data.isDiscount ? 'DISCOUNT' : 'PREMIUM'}
          </span>
        </div>

        {data.sweep && (
          <div className="bg-warning/10 border border-warning/20 p-2 rounded-sm flex items-center justify-between">
            <span className="text-[9px] text-warning uppercase font-bold flex items-center gap-1"><Zap size={10}/> Sweep Detected</span>
            <span className="text-[9px] font-mono font-bold text-warning">{data.sweep.type}</span>
          </div>
        )}

        <div className="bg-surface-highlight/30 border border-border/50 p-2 rounded-sm flex flex-col gap-1.5">
          <span className="text-[9px] text-text-tertiary uppercase font-bold flex items-center gap-1">
            <Crosshair size={10} /> Nearest Active FVGs
          </span>
          {data.fvgs.length > 0 ? data.fvgs.map((fvg, i) => (
            <div key={i} className="flex justify-between items-center bg-background border border-border/50 px-2 py-1 rounded-sm">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${fvg.type === 'BISI' ? 'bg-positive' : 'bg-negative'}`} />
                <span className="text-[9px] font-bold text-text-primary">{fvg.type === 'BISI' ? 'Demand' : 'Supply'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-mono text-text-secondary">{fvg.bottom.toFixed(2)} - {fvg.top.toFixed(2)}</span>
              </div>
            </div>
          )) : (
             <span className="text-[9px] text-text-tertiary font-mono italic">Price is balanced. No immediate gaps.</span>
          )}
        </div>
      </div>
    </div>
  );
}