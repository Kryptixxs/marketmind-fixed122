'use client';

import React, { useMemo } from 'react';
import { Target, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Tick } from '@/lib/marketdata/types';
import { generateTradeSetup } from '@/lib/trade-setup-math';
import { useSettings } from '@/context/SettingsContext';

export function TradeSetupPanel({ tick, timeframeLabel }: { tick?: Tick, timeframeLabel: string }) {
  const { settings } = useSettings();
  const isTerminal = settings.uiTheme === 'terminal';
  
  const setup = useMemo(() => {
    if (!tick) return null;
    return generateTradeSetup(tick.history || []);
  }, [tick]);

  if (!tick || !setup) return <div className="p-4 opacity-50 font-mono text-[10px] tracking-widest">[SYSLOG] AWAITING_DATA_STREAM...</div>;

  const isBuy = setup.signal.includes('BUY');
  const isSell = setup.signal.includes('SELL');

  if (isTerminal) {
    // TERMINAL MODE: RAW ASCII SYSTEM LOG
    return (
      <div className="p-3 font-mono text-[10px] leading-relaxed whitespace-pre overflow-auto h-full text-accent bg-black">
{`[INFO] INIT_ALGO_MATRIX : OK
[EXEC] RUNTIME_BIAS     : ${setup.signal}
[STAT] CONFIDENCE_IDX   : ${setup.confidence}%

-----------------------------------------
[CALC] STRUCTURAL_ARRAYS
       ENTRY_ZONE       : ${setup.entryZone[0].toFixed(2)} / ${setup.entryZone[1].toFixed(2)}
       HARD_STOP        : ${setup.stopLoss.toFixed(2)}
       PROFIT_TGT       : ${setup.takeProfit1.toFixed(2)}
-----------------------------------------
[DATA] LIQUIDITY_POOLS
       RESISTANCE       : ${setup.resistance.length ? setup.resistance.map(r=>r.toFixed(2)).join(', ') : 'NONE'}
       SUPPORT          : ${setup.support.length ? setup.support.map(r=>r.toFixed(2)).join(', ') : 'NONE'}
-----------------------------------------
${setup.warnings.length > 0 ? setup.warnings.map(w => `[WARN] ${w}`).join('\n') : '[INFO] NO_SYSTEM_WARNINGS'}
`}
      </div>
    );
  }

  // ARCHITECT MODE: Spatial floating layers
  return (
    <div className="flex flex-col h-full p-6 space-y-8">
      
      <div className="flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 ${isBuy ? 'bg-positive/10 text-positive shadow-[0_0_24px_theme(colors.teal.400/20)] border border-positive/20' : isSell ? 'bg-negative/10 text-negative shadow-[0_0_24px_theme(colors.rose.400/20)] border border-negative/20' : 'bg-white/5 text-text-tertiary border border-white/10'}`}>
          {isBuy ? <TrendingUp size={28} strokeWidth={1.5} /> : isSell ? <TrendingDown size={28} strokeWidth={1.5} /> : <Activity size={28} strokeWidth={1.5} />}
        </div>
        <div className="flex flex-col">
          <h3 className="text-xs text-text-secondary font-medium tracking-wide">Directional Bias</h3>
          <div className="text-2xl font-bold text-text-primary tracking-tight mt-0.5">{setup.signal}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl shadow-inner">
          <div className="text-[10px] text-text-secondary font-medium mb-1 tracking-widest">ENTRY ZONE</div>
          <div className="text-sm font-semibold text-text-primary">{setup.entryZone[0].toFixed(2)} - {setup.entryZone[1].toFixed(2)}</div>
        </div>
        <div className="bg-white/5 border border-white/5 p-4 rounded-xl shadow-inner">
          <div className="text-[10px] text-text-secondary font-medium mb-1 tracking-widest">RISK/REWARD</div>
          <div className="text-sm font-semibold text-text-primary">1 : {setup.riskReward.toFixed(2)}</div>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="text-[10px] font-medium text-text-secondary uppercase tracking-widest">Key Structural Levels</div>
        <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-negative/50 rounded-l-xl" />
          <span className="text-xs text-text-secondary ml-2 font-medium">Target / Resistance</span>
          <span className="text-sm font-semibold text-text-primary">{setup.takeProfit1.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/5 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-positive/50 rounded-l-xl" />
          <span className="text-xs text-text-secondary ml-2 font-medium">Support / Stop Loss</span>
          <span className="text-sm font-semibold text-text-primary">{setup.stopLoss.toFixed(2)}</span>
        </div>
      </div>

    </div>
  );
}