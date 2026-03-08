'use client';

import React from 'react';
import { TerminalModuleFrame } from './structure/TerminalModuleFrame';
import { TerminalModuleDefinition, TerminalFunction } from '../types';
import { useTerminalStore } from '../store/TerminalStore';
import { BondAnalyticsModule } from './modules/BondAnalyticsModule';
import { CalendarModule } from './modules/CalendarModule';
import { DescriptionModule } from './modules/DescriptionModule';
import { EarningsModule } from './modules/EarningsModule';
import { ExecutionCockpitModule } from './modules/ExecutionCockpitModule';
import { FinancialAnalysisModule } from './modules/FinancialAnalysisModule';
import { HistoricalPricingModule } from './modules/HistoricalPricingModule';
import { IntelModule } from './modules/IntelModule';
import { MarketModule } from './modules/MarketModule';
import { NewsModule } from './modules/NewsModule';
import { OptionsAnalyticsModule } from './modules/OptionsAnalyticsModule';
import { PortfolioModule } from './modules/PortfolioModule';
import { SecFilingsModule } from './modules/SecFilingsModule';

export function FunctionRouter({ activeFunction }: { activeFunction: TerminalFunction }) {
  const { state } = useTerminalStore();
  const componentByFunction: Record<TerminalFunction, React.ComponentType> = {
    EXEC: ExecutionCockpitModule,
    DES: DescriptionModule,
    FA: FinancialAnalysisModule,
    INTEL: IntelModule,
    HP: HistoricalPricingModule,
    WEI: EarningsModule,
    YAS: BondAnalyticsModule,
    OVME: OptionsAnalyticsModule,
    PORT: PortfolioModule,
    NEWS: NewsModule,
    CAL: CalendarModule,
    SEC: SecFilingsModule,
    MKT: MarketModule,
  };
  const Active = componentByFunction[activeFunction] ?? ExecutionCockpitModule;
  if (activeFunction === 'MKT') return <Active key={`module-${activeFunction}`} />;

  const definition: TerminalModuleDefinition = {
    code: activeFunction,
    primaryDecision: `${activeFunction} CONTEXT ACTIVE FOR ${state.activeSymbol}`,
    bands: {
      primary: {
        key: 'primary',
        panels: [
          {
            id: `${activeFunction}-workspace`,
            type: 'SNAPSHOT',
            question: `What is primary objective of ${activeFunction}?`,
            priority: 100,
            content: <Active key={`module-${activeFunction}`} />,
          },
        ],
      },
      secondary: { key: 'secondary', panels: [] },
      tertiary: { key: 'tertiary', panels: [] },
    },
  };
  return <TerminalModuleFrame definition={definition} />;
}
