'use client';

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
  if (activeFunction === 'EXEC') return <ExecutionCockpitModule />;
  if (activeFunction === 'DES') return <DescriptionModule />;
  if (activeFunction === 'FA') return <FinancialAnalysisModule />;
  if (activeFunction === 'HP') return <HistoricalPricingModule />;
  if (activeFunction === 'WEI') return <EarningsModule />;
  if (activeFunction === 'YAS') return <BondAnalyticsModule />;
  if (activeFunction === 'OVME') return <OptionsAnalyticsModule />;
  if (activeFunction === 'PORT') return <PortfolioModule />;
  return <ExecutionCockpitModule />;
}
