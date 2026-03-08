'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useTerminalStore } from '../store/TerminalStore';
import { evaluateTriggeredRules, loadAlertRules } from '../services/alertMonitor';

export function TerminalStatusBar() {
  const { state, clocks } = useTerminalStore();
  const [rulesCount, setRulesCount] = useState(0);

  const rules = useMemo(() => {
    return loadAlertRules();
  }, [state.tickMs]);

  useEffect(() => {
    setRulesCount(rules.length);
  }, [rules.length]);

  const triggered = useMemo(() => {
    return evaluateTriggeredRules(rules, state.quotes);
  }, [rules, state.quotes, state.tickMs]);

  useEffect(() => {
    if (triggered.length > 0) {
      document.documentElement.classList.add('terminal-alert-flash');
      const t = setTimeout(() => document.documentElement.classList.remove('terminal-alert-flash'), 280);
      return () => clearTimeout(t);
    }
  }, [triggered.length]);

  return (
    <div className="h-[20px] border-t border-[#333] bg-[#000] px-2 flex items-center justify-between text-[10px] font-mono">
      <div className="flex items-center gap-3">
        <span className="text-[#00FF00]">Connection: ACTIVE</span>
        <span className="text-[#b0b8c4]">B-PIPE Latency: {state.workerAnalytics?.workerLatencyMs ?? 0}ms</span>
        <span className="text-[#b0b8c4]">UI Refresh: {state.workerAnalytics?.uiFps ?? 60}fps</span>
        <span className={triggered.length > 0 ? 'text-[#FFFFFF] font-bold' : 'text-[#666]'}>
          ALRT {triggered.length}/{rulesCount}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[#a4b8d2]">
        <span>EST {clocks.ny}</span>
        <span>GMT {clocks.ldn}</span>
      </div>
    </div>
  );
}

