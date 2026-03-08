import { TerminalModuleContext } from '../../runtime/modules/moduleContract';
import { TerminalState } from '../../types';
import { buildMarketDataModel } from './buildMarketDataModel';

export interface MarketModel {
  regimeVerdict: {
    regime: 'RISK ON' | 'RISK OFF' | 'TRANSITION';
    score: number;
    stability: string;
    change: string;
  };
  globalDrivers: Array<{
    symbol: string;
    impact: number;
    volume: number;
  }>;
  symbolImpact: {
    symbol: string;
    beta: number;
    correlation: number;
    impliedMove: number;
  };
  symbolVulnerabilities: Array<{
    factor: string;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
  }>;
  historicalContext: Array<{
    period: string;
    returnPct: number;
    volatility: number;
  }>;
}

export function buildMarketModel(context: TerminalModuleContext): MarketModel {
  const state = context.state as TerminalState;
  const legacyModel = buildMarketDataModel(state);
  
  // Extracting from legacy table values to map into our semantic new model
  const regimeRow = legacyModel.table.regimeSnapshot.find(r => r.key === 'Regime');
  const scoreRow = legacyModel.table.regimeSnapshot.find(r => r.key === 'RiskOnScore');
  const volAlertRow = legacyModel.table.flowPositioning.find(r => r.key === 'VolExpansionAlert');
  const regimeVerdictScore = parseFloat(scoreRow?.value || '0');
  
  const drivers = legacyModel.table.driverAnalysis
    .filter(r => r.key.startsWith('Factor'))
    .map(r => {
      const parts = r.value.split('|');
      return {
        symbol: r.key.replace('Factor ', ''),
        impact: parseFloat(parts[0] || '0'),
        volume: parseFloat((parts[1] || '0').replace('Vol ', '').replace('M', ''))
      };
    });

  const activeQuote = state.quotes.find(q => q.symbol === context.activeSymbol);
  
  const symbolVulnerabilities = [];
  if (volAlertRow?.value === 'ON') {
    symbolVulnerabilities.push({ factor: 'Volatility', riskLevel: 'HIGH' as const, description: 'Broad implied volatility expansion detected' });
  }
  const breadthRow = legacyModel.table.flowPositioning.find(r => r.key === 'BreadthDeterioration');
  if (breadthRow?.value === 'ON') {
    symbolVulnerabilities.push({ factor: 'Breadth', riskLevel: 'MEDIUM' as const, description: 'Underlying market breadth is deteriorating' });
  }
  const liqRow = legacyModel.table.flowPositioning.find(r => r.key === 'LiquidityStress');
  if (liqRow?.value === 'ON') {
    symbolVulnerabilities.push({ factor: 'Liquidity', riskLevel: 'HIGH' as const, description: 'Order book liquidity stress active' });
  }

  if (symbolVulnerabilities.length === 0) {
    symbolVulnerabilities.push({ factor: 'None', riskLevel: 'LOW' as const, description: 'No immediate macro vulnerabilities detected' });
  }

  return {
    regimeVerdict: {
      regime: (regimeRow?.value || 'TRANSITION') as any,
      score: regimeVerdictScore,
      stability: volAlertRow?.value === 'ON' ? 'UNSTABLE' : 'STABLE',
      change: 'Active',
    },
    globalDrivers: drivers.slice(0, 4),
    symbolImpact: {
      symbol: context.activeSymbol,
      beta: state.risk.beta || 1.0,
      correlation: state.risk.corrToBenchmark || 0.0,
      impliedMove: (activeQuote?.pct || 0) * 1.5, // simulated implied move
    },
    symbolVulnerabilities,
    historicalContext: [
      { period: '1D', returnPct: activeQuote?.pct || 0, volatility: state.risk.impliedVolProxy },
      { period: '1W', returnPct: (activeQuote?.pct || 0) * 5, volatility: state.risk.impliedVolProxy * 0.9 },
      { period: '1M', returnPct: (activeQuote?.pct || 0) * 20, volatility: state.risk.realizedVol },
    ],
  };
}
