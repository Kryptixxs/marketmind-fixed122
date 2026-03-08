'use client';

import React from 'react';
import { TerminalFunction } from '../types';
import { useTerminalStore } from '../store/TerminalStore';
import { TerminalRuntimeSkeleton } from '../runtime/TerminalRuntimeSkeleton';
import { MarketTerminalModule } from '../modules/market/MarketModule';

const MODULE_TITLES: Record<TerminalFunction, string> = {
  EXEC: 'EXECUTION COCKPIT',
  DES: 'DESCRIPTION',
  FA: 'FINANCIAL ANALYSIS',
  HP: 'HISTORICAL PRICING',
  WEI: 'EARNINGS INTELLIGENCE',
  YAS: 'YIELD & SPREAD ANALYTICS',
  OVME: 'OPTIONS VOLATILITY',
  PORT: 'PORTFOLIO INTELLIGENCE',
  NEWS: 'NEWS & EVENT INTELLIGENCE',
  CAL: 'CALENDAR CATALYST',
  SEC: 'SEC FILINGS INTELLIGENCE',
  MKT: 'MARKET CONTEXT',
  INTEL: 'RELATIONSHIP INTEL',
};

const MODULE_DECISION_PROMPTS: Record<TerminalFunction, string> = {
  EXEC: 'What is the execution strategy for the active symbol?',
  DES: 'What are the key attributes of the security?',
  FA: 'What fundamental factors drive valuation?',
  HP: 'What is the historical price context?',
  WEI: 'What earnings catalysts matter?',
  YAS: 'What yield and spread dynamics apply?',
  OVME: 'What volatility regime and Greeks matter?',
  PORT: 'What is the exposure and risk profile?',
  NEWS: 'What events affect the symbol?',
  CAL: 'What catalysts are upcoming?',
  SEC: 'What filings and ownership matter?',
  MKT: 'What is the current macro regime and symbol impact?',
  INTEL: 'What relationships and entities matter?',
};

export function FunctionRouter({ activeFunction }: { activeFunction: TerminalFunction }) {
  const { state } = useTerminalStore();

  // MKT is migrated; use the real module (which uses TerminalRuntime internally)
  if (activeFunction === 'MKT') {
    return <MarketTerminalModule className="flex-1 min-w-0 min-h-0" />;
  }

  // All other modules: runtime skeleton with "Module not migrated yet"
  // Runtime controls size, scroll, collapse, and block limits — no black void
  return (
    <TerminalRuntimeSkeleton
      moduleCode={activeFunction}
      moduleTitle={MODULE_TITLES[activeFunction]}
      decisionPrompt={MODULE_DECISION_PROMPTS[activeFunction]}
      notMigrated
      className="flex-1 min-w-0 min-h-0"
    />
  );
}
