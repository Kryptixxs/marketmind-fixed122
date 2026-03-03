'use client';

import React, { useMemo } from 'react';
import { Target, AlertTriangle, TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react';
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

  if (!tick || !setup) return <div className="p-4 opacity-50">INITIALIZING_CORE_SYSTEMS...</div>;

  const isBuy = setup.signal.includes('BUY');
  const isSell = setup.signal.includes('SELL');

  if (isTerminal) {
    // TERMINAL MODE: RAW ASCII PRINTOUT
    return (
      <div className="p-4 font-mono text-[11px] leading-relaxed whitespace-pre h-full overflow-auto text-accent">
{`+---------------------------------------+
|  SYSTEM_STATUS: OK                    |
|  ALGO_BIAS    : ${setup.signal.padEnd(21, ' ')} |
|  CONFIDENCE   : ${setup.confidence.toString().padEnd(21, ' ')} |
+---------------------------------------+

> CALCULATING STRUCTURAL ARRAYS...
  ENTRY_ZONE : ${setup.entryZone[0].toFixed(2)} -> ${setup.entryZone[1].toFixed(2)}
  HARD_STOP  : ${setup.stopLoss.toFixed(2)}
  TARGET_1   : ${setup.takeProfit1.toFixed(2)}
  TARGET_2   : ${setup.takeProfit2.toFixed(2)}

> LIQUIDITY LEVELS (RESTRICTED)
  RESISTANCE : ${setup.resistance.map(r=>r.toFixed(2)).join(' | ')}
  SUPPORT    : ${setup.support.map(r=>r.toFixed(2)).join(' | ')}

> RUNTIME WARNINGS:
${setup.warnings.length === 0 ? '  [NONE]' : setup.warnings.map(w => `  WARN: ${w}`).join('\n')}

> END_OF_TRANSMISSION.`}
      </div>
    );
  }

  // ARCHITECT MODE: Floating layers and glow dots
  return (
    <div className="flex flex-col h-full overflow-hidden p-4 space-y-6">
      
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${isBuy ? 'bg-positive/20 text-positive shadow-[0_0_15px_theme(colors.teal.400)]' : isSell ? 'bg-negative/20 text-negative shadow-[0_0_15px_theme(colors.rose.400)]' : 'bg-surface text-text-tertiary'}`}>
          {isBuy ? <TrendingUp size={24} /> : isSell ? <TrendingDown size={24} /> : <Activity size={24} />}
        </div>
        <div>
          <h3 className="text-xs text-text-secondary font-medium">Algorithmic Bias</h3>
          <div className="text-xl font-semibold text-text-primary tracking-tight">{setup.signal}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-background/50 border border-border p-3 rounded-lg">
          <div className="text-[10px] text-text-secondary font-medium mb-1">ENTRY ZONE</div>
          <div className="text-sm text-text-primary">{setup.entryZone[0].toFixed(2)} - {setup.entryZone[1].toFixed(2)}</div>
        </div>
        <div className="bg-background/50 border border-border p-3 rounded-lg">
          <div className="text-[10px] text-text-secondary font-medium mb-1">RISK / REWARD</div>
          <div className="text-sm text-text-primary">1 : {setup.riskReward.toFixed(2)}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-medium text-text-secondary uppercase tracking-widest">Key Price Levels</div>
        <div className="flex justify-between items-center p-2 bg-negative/5 rounded-md border border-negative/10">
          <span className="text-xs text-negative font-medium">Target / Resistance</span>
          <span className="text-sm font-semibold">{setup.takeProfit1.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center p-2 bg-positive/5 rounded-md border border-positive/10">
          <span className="text-xs text-positive font-medium">Support / Stop Loss</span>
          <span className="text-sm font-semibold">{setup.stopLoss.toFixed(2)}</span>
        </div>
      </div>

    </div>
  );
}