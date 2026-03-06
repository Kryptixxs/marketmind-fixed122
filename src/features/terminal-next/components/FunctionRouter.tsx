'use client';

import React from 'react';
import { TerminalFunction } from '../types';
import { BondAnalyticsModule } from './modules/BondAnalyticsModule';
import { DescriptionModule } from './modules/DescriptionModule';
import { EarningsModule } from './modules/EarningsModule';
import { ExecutionCockpitModule } from './modules/ExecutionCockpitModule';
import { FinancialAnalysisModule } from './modules/FinancialAnalysisModule';
import { HistoricalPricingModule } from './modules/HistoricalPricingModule';
import { OptionsAnalyticsModule } from './modules/OptionsAnalyticsModule';
import { PortfolioModule } from './modules/PortfolioModule';

export function FunctionRouter({ activeFunction }: { activeFunction: TerminalFunction }) {
  const componentByFunction: Record<TerminalFunction, React.ComponentType> = {
    EXEC: ExecutionCockpitModule,
    DES: DescriptionModule,
    FA: FinancialAnalysisModule,
    HP: HistoricalPricingModule,
    WEI: EarningsModule,
    YAS: BondAnalyticsModule,
    OVME: OptionsAnalyticsModule,
    PORT: PortfolioModule,
  };
  const Active = componentByFunction[activeFunction] ?? ExecutionCockpitModule;
  // Keyed mount ensures hard structural transition between workspaces.
  return <Active key={`module-${activeFunction}`} />;
}
