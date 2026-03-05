'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Target, ArrowUpRight, ArrowDownRight, Crosshair, Zap, Brain, Loader2, Newspaper } from 'lucide-react';
import { Tick } from '@/features/MarketData/services/marketdata/types';
import { findSwingPoints, findUnmitigatedFVGs } from '@/lib/tech-math';
import { fetchNews } from '@/app/actions/fetchNews';
import { analyzeICTSetup } from '@/app/actions/analyzeICTSetup';

export function ICTPanel({ tick, timeframeLabel = '15m' }: { tick?: Tick, timeframeLabel?: string }) {
  const [aiPrediction, setAiPrediction] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [newsSentiment, setNewsSentiment] = useState(0);

  useEffect(() => {
    if (!tick) return;
    const loadNews = async () => {
      const symName = tick.symbol.split('=')[0].split('-')[0];
      const news = await fetchNews('General');
      let score = 0;
      let count = 0;
      news.forEach(n => {
        const text = n.title.toLowerCase();
        if (text.includes(symName.toLowerCase())) {
          count++;
          if (text.match(/soar|jump|buy|bull|beat|growth|high|up/)) score += 40; // High weight
          if (text.match(/plunge|drop|sell|bear|miss|shrink|low|down|risk/)) score -= 40; // High weight
        }
      });
      setNewsSentiment(count > 0 ? Math.max(-100, Math.min(100, score / count)) : 0);
    };
    loadNews();
  }, [tick?.symbol]);

  const mathData = useMemo(() => {
    if (!tick || !tick.history || tick.history.length < 30) return null;

    const history = tick.history;
    const current = history[history.length - 1];
    
    const { swingHighs, swingLows } = findSwingPoints(history);
    const unmitigatedHighs = swingHighs.filter(h => !h.mitigated);
    const unmitigatedLows = swingLows.filter(l => !l.mitigated);

    const buysideLiquidity = unmitigatedHighs.length > 0 ? Math.min(...unmitigatedHighs.map(h => h.price)) : Math.max(...history.slice(-20).map(h=>h.high));
    const sellsideLiquidity = unmitigatedLows.length > 0 ? Math.max(...unmitigatedLows.map(l => l.price)) : Math.min(...history.slice(-20).map(h=>h.low));

    const activeFVGs = findUnmitigatedFVGs(history).map(fvg => ({
      ...fvg,
      distance: ((fvg.type === 'BISI' ? fvg.top - current.close : current.close - fvg.bottom) / current.close) * 100
    }));

    let sweep = null;
    if (current.high > buysideLiquidity && current.close < buysideLiquidity) {
      sweep = { type: 'Buy-Side Swept (Turtle Soup)', level: buysideLiquidity, sentiment: 'BEARISH' };
    } else if (current.low < sellsideLiquidity && current.close > sellsideLiquidity) {
      sweep = { type: 'Sell-Side Swept (Turtle Soup)', level: sellsideLiquidity, sentiment: 'BULLISH' };
    }

    let structure = 'Consolidation';
    let structBias = 'NEUTRAL';
    if (current.close > buysideLiquidity) { structure = 'BOS (Bull Break)'; structBias = 'BULLISH'; }
    else if (current.close < sellsideLiquidity) { structure = 'MSS (Bear Shift)'; structBias = 'BEARISH'; }

    const dealingRange = Math.max(buysideLiquidity, ...history.slice(-50).map(h=>h.high)) - Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low));
    const eq = Math.min(sellsideLiquidity, ...history.slice(-50).map(h=>h.low)) + (dealingRange / 2);
    const isDiscount = current.close < eq;

    // VERY HEAVY WEIGHTING ALGORITHM
    let algoBias = 'WAIT / NEUTRAL';
    let biasColor = 'text-text-secondary';
    
    // News is king (+5 max), Sweeps are queen (+4), FVGs are bishops (+3), Structure is rook (+2), Discount/Premium is pawn (+1)
    const hasBullFVG = activeFVGs.some(f => f.type === 'BISI' && Math.abs(f.distance) < 0.5);
    const hasBearFVG = activeFVGs.some(f => f.type === 'SIBI' && Math.abs(f.distance) < 0.5);

    const newsBullScore = newsSentiment > 10 ? Math.min(5, Math.floor(newsSentiment / 15)) : 0;
    const newsBearScore = newsSentiment < -10 ? Math.min(5, Math.floor(Math.abs(newsSentiment) / 15)) : 0;

    const combinedBullish = (isDiscount ? 1 : 0) + (structBias === 'BULLISH' ? 2 : 0) + (sweep?.sentiment === 'BULLISH' ? 4 : 0) + (hasBullFVG ? 3 : 0) + newsBullScore;
    const combinedBearish = (!isDiscount ? 1 : 0) + (structBias === 'BEARISH' ? 2 : 0) + (sweep?.sentiment === 'BEARISH' ? 4 : 0) + (hasBearFVG ? 3 : 0) + newsBearScore;

    if (combinedBullish >= 7) { algoBias = 'HIGH CONVICTION LONG'; biasColor = 'text-positive'; }
    else if (combinedBearish >= 7) { algoBias = 'HIGH CONVICTION SHORT'; biasColor = 'text-negative'; }
    else if (sweep?.sentiment === 'BULLISH' || newsBullScore >= 4) { algoBias = 'SCALP LONG (High Prob)'; biasColor = 'text-positive'; }
    else if (sweep?.sentiment === 'BEARISH' || newsBearScore >= 4) { algoBias = 'SCALP SHORT (High Prob)'; biasColor = 'text-negative'; }
    else if (combinedBullish > combinedBearish) { algoBias = 'LEANING LONG'; biasColor = 'text-positive opacity-80'; }
    else if (combinedBearish > combinedBullish) { algoBias = 'LEANING SHORT'; biasColor = 'text-negative opacity-80'; }

    return { 
      buysideLiquidity, sellsideLiquidity, 
      fvgs: activeFVGs.sort((a, b) => Math.abs(a.distance) - Math.abs(b.distance)).slice(0, 2), 
      sweep, structure, isDiscount, currentPrice: current.close, algoBias, biasColor
    };
  }, [tick, newsSentiment]);

  useEffect(() => {
    if (!mathData || !tick) return;
    const getPrediction = async () => {
      setIsPredicting(true);
      const recentCandles = tick.history!.slice(-10);
      const result = await analyzeICTSetup(tick.symbol, tick.price, recentCandles, mathData);
      setAiPrediction(result);
      setIsPredicting(false);
    };
    getPrediction();
  }, [tick?.symbol]); 

  if (!tick || !mathData) return <div className="flex h-full items-center justify-center opacity-50 text-[10px] uppercase font-bold tracking-widest text-text-tertiary">Awaiting Data</div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2 relative">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="text-[10px] text-text-tertiary uppercase font-bold tracking-widest flex items-center gap-1.5">
          <Target size={12} /> SMC Arrays ({timeframeLabel})
        </div>
        {newsSentiment !== 0 && (
          <div className={`text-[10px] font-bold uppercase flex items-center gap-1 ${newsSentiment > 0 ? 'text-positive' : 'text-negative'}`}>
            <Newspaper size={12} /> News Bias
          </div>
        )}
      </div>

      {isPredicting || !aiPrediction ? (
        <div className="bg-surface-highlight border border-border p-4 rounded-sm flex flex-col items-center justify-center text-center gap-2">
          <Loader2 size={16} className="animate-spin text-accent" />
          <span className="text-[10px] text-text-tertiary uppercase font-bold">Generating Custom AI Bias...</span>
        </div>
      ) : (
        <div className="bg-surface-highlight border border-border p-4 rounded-sm flex flex-col gap-3">
          <div className="flex flex-col items-center justify-center text-center pb-3 border-b border-border/50">
            <span className="text-[10px] text-text-tertiary uppercase font-bold mb-1 flex items-center gap-1.5"><Brain size={12} className="text-accent"/> Custom AI Bias</span>
            <span className={`text-xl font-black tracking-tight uppercase ${aiPrediction.biasColor}`}>{aiPrediction.algoBias}</span>
          </div>
          <p className="text-xs text-text-primary leading-relaxed">
            {aiPrediction.customAnalysis}
          </p>
        </div>
      )}
      
      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pt-1">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-highlight/30 border border-border/50 p-2.5 rounded-sm flex flex-col">
            <span className="text-[10px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowUpRight size={10}/> Fractal BSL</span>
            <span className="text-xs font-mono font-medium text-text-primary mt-1">{mathData.buysideLiquidity.toFixed(2)}</span>
          </div>
          <div className="bg-surface-highlight/30 border border-border/50 p-2.5 rounded-sm flex flex-col">
            <span className="text-[10px] text-text-tertiary uppercase font-bold flex items-center gap-1"><ArrowDownRight size={10}/> Fractal SSL</span>
            <span className="text-xs font-mono font-medium text-text-primary mt-1">{mathData.sellsideLiquidity.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-surface-highlight/30 border border-border/50 p-2.5 rounded-sm flex items-center justify-between">
          <span className="text-[10px] text-text-tertiary uppercase font-bold">Structure ({timeframeLabel})</span>
          <span className={`text-xs font-mono font-bold ${mathData.isDiscount ? 'text-positive' : 'text-negative'}`}>
            {mathData.structure} • {mathData.isDiscount ? 'DISCOUNT' : 'PREMIUM'}
          </span>
        </div>

        {mathData.sweep && (
          <div className="bg-warning/10 border border-warning/20 p-2.5 rounded-sm flex items-center justify-between">
            <span className="text-[10px] text-warning uppercase font-bold flex items-center gap-1"><Zap size={12}/> Sweep Detected</span>
            <span className="text-xs font-mono font-bold text-warning">{mathData.sweep.type}</span>
          </div>
        )}

        <div className="bg-surface-highlight/30 border border-border/50 p-2.5 rounded-sm flex flex-col gap-2">
          <span className="text-[10px] text-text-tertiary uppercase font-bold flex items-center gap-1">
            <Crosshair size={12} /> Nearest Active FVGs
          </span>
          {mathData.fvgs.length > 0 ? mathData.fvgs.map((fvg, i) => (
            <div key={i} className="flex justify-between items-center bg-background border border-border/50 px-2.5 py-1.5 rounded-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${fvg.type === 'BISI' ? 'bg-positive' : 'bg-negative'}`} />
                <span className="text-[10px] font-bold text-text-primary">{fvg.type === 'BISI' ? 'Demand' : 'Supply'}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-mono text-text-secondary">{fvg.bottom.toFixed(2)} - {fvg.top.toFixed(2)}</span>
              </div>
            </div>
          )) : (
             <span className="text-[10px] text-text-tertiary font-mono italic">Price is balanced. No immediate gaps.</span>
          )}
        </div>
      </div>
    </div>
  );
}