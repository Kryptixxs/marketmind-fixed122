'use client';

import React from 'react';
import { TerminalFunction } from '../types';
import { useTerminalStore } from '../store/TerminalStore';
import type { PanelFunction } from '../context/PanelFocusContext';
import { TerminalRuntimeSkeleton } from '../runtime/TerminalRuntimeSkeleton';
import { MarketTerminalModule } from '../modules/market/MarketModule';
import { WorldEquityIndices } from './visualizations/WorldEquityIndices';
import {
  NewsWire,
  SecurityDescription,
  PriceChart,
  SectorHeatmap,
  EconomicCalendar,
  FXCrossMatrix,
  YieldCurve,
  FinancialAnalysisTable,
  IBChat,
} from './visualizations';

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
  ECO: 'ECONOMIC CALENDAR',
  FXC: 'FX CROSS MATRIX',
  GC: 'YIELD CURVE',
  IB: 'INSTANT BLOOMBERG',
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
  ECO: 'What macroeconomic events are upcoming?',
  FXC: 'What are the FX cross rates?',
  GC: 'What is the yield curve shape?',
  IB: 'Trader communication chat',
};

export function FunctionRouter({
  activeFunction,
  panelFunction,
}: {
  activeFunction: TerminalFunction;
  panelFunction?: PanelFunction;
}) {
  const { state } = useTerminalStore();

  if (activeFunction === 'WEI') {
    return <WorldEquityIndices />;
  }
  if (activeFunction === 'NEWS') {
    return <NewsWire maxHeight="100%" className="flex-1 min-h-0" />;
  }
  if (activeFunction === 'DES') {
    return <SecurityDescription />;
  }
  if (panelFunction === 'GP') {
    return <PriceChart className="flex-1 min-h-0 w-full" />;
  }
  if (activeFunction === 'IMAP') {
    return <SectorHeatmap />;
  }
  if (activeFunction === 'MKT') {
    return <MarketTerminalModule className="flex-1 min-w-0 min-h-0" />;
  }
  if (activeFunction === 'ECO') {
    return <EconomicCalendar maxHeight="100%" className="flex-1 min-h-0" />;
  }
  if (activeFunction === 'FXC') {
    return <FXCrossMatrix className="flex-1 min-h-0 w-full" />;
  }
  if (activeFunction === 'GC') {
    return <YieldCurve height={220} className="flex-1 min-h-0 w-full" />;
  }
  if (activeFunction === 'FA') {
    return <FinancialAnalysisTable className="flex-1 min-h-0 w-full" />;
  }
  if (activeFunction === 'IB') {
    return <IBChat className="flex-1 min-h-0 w-full" />;
  }

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
