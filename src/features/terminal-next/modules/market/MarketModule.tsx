import React, { useMemo } from 'react';
import { ModuleContract, TerminalModuleContext } from '../../runtime/modules/moduleContract';
import { PanelFrame } from '../../runtime/panels/PanelFrame';
import { PanelType, BandLayer } from '../../runtime/panels/types';
import { buildMarketModel, MarketModel } from './buildMarketModel';
import { TerminalChart } from '../../components/charts/TerminalChart';
import { ChartCard } from '../../components/charts/ChartCard';
import { TerminalRuntime } from '../../runtime/TerminalRuntime';
import { useTerminalStore } from '../../store/TerminalStore';
import { ModuleRegistry } from '../../runtime/modules/ModuleRegistry';

export const MarketModuleContract: ModuleContract<MarketModel> = {
  id: 'MARKET',
  title: 'Market Context',
  decisionPrompt: 'What is the current macro regime and how does it impact the active symbol?',
  bandSpec: {
    primary: 0.25,
    secondary: 0.45,
    tertiary: 0.30,
  },
  buildModel: (context: TerminalModuleContext) => buildMarketModel(context),
  render: (model: MarketModel) => {
    // Primary: VERDICT only (regime/stability/change)
    const primaryPanels = (
      <div className="flex h-full w-full gap-2 p-2">
        <PanelFrame
          className="flex-1"
          config={{
            id: 'market-verdict',
            type: PanelType.VERDICT,
            title: 'Regime Verdict',
          }}
        >
          <div className="flex items-center justify-between h-full px-4">
            <div>
              <div className="text-3xl font-bold tracking-tighter text-emerald-400">
                {model.regimeVerdict.regime}
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest">
                Score: {model.regimeVerdict.score.toFixed(2)} | Stability: {model.regimeVerdict.stability}
              </div>
            </div>
            <div className="text-right flex flex-col items-end justify-center">
              <div className="text-sm font-medium text-slate-300">24H Change</div>
              <div className="text-lg font-bold text-emerald-500">{model.regimeVerdict.change}</div>
            </div>
          </div>
        </PanelFrame>
      </div>
    );

    // Secondary: DIAGNOSTIC (drivers + symbol overlay)
    const secondaryPanels = (
      <div className="flex h-full w-full gap-2 p-2">
        <PanelFrame
          className="flex-1 min-w-0"
          config={{
            id: 'global-drivers',
            type: PanelType.DIAGNOSTIC,
            title: 'Global Drivers',
          }}
        >
          <div className="flex flex-col h-full space-y-2">
            <div className="flex-1 min-h-0">
              <ChartCard className="h-full">
                <TerminalChart
                  type="bar"
                  series={model.globalDrivers.map(d => d.impact)}
                  labels={model.globalDrivers.map(d => d.symbol)}
                />
              </ChartCard>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 shrink-0">
              {model.globalDrivers.map(d => (
                <div key={d.symbol} className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="font-mono text-xs">{d.symbol}</span>
                  <span className={`font-mono text-xs ${d.impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {d.impact >= 0 ? '+' : ''}{d.impact.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </PanelFrame>

        <PanelFrame
          className="flex-1 min-w-0"
          config={{
            id: 'symbol-impact',
            type: PanelType.DIAGNOSTIC,
            title: `Symbol Overlay: ${model.symbolImpact.symbol}`,
          }}
        >
          <div className="flex flex-col justify-center h-full p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Beta to Market</span>
              <span className="text-xl font-mono text-slate-200">{model.symbolImpact.beta.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Correlation</span>
              <span className="text-xl font-mono text-slate-200">{(model.symbolImpact.correlation * 100).toFixed(0)}%</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-2">
              <span className="text-slate-400 text-sm font-bold text-rose-400">Implied Move</span>
              <span className="text-xl font-mono text-rose-400 font-bold">±{model.symbolImpact.impliedMove.toFixed(1)}%</span>
            </div>
          </div>
        </PanelFrame>
      </div>
    );

    // Tertiary: VULNERABILITY + collapsed HISTORICAL
    const tertiaryPanels = (
      <div className="flex h-full w-full gap-2 p-2">
        <PanelFrame
          className="flex-1 min-w-0"
          config={{
            id: 'symbol-vulnerabilities',
            type: PanelType.VULNERABILITY,
            title: 'Symbol Vulnerabilities',
          }}
        >
          <div className="flex flex-col space-y-2 h-full justify-center">
            {model.symbolVulnerabilities.map(v => (
              <div key={v.factor} className="flex items-center justify-between bg-slate-950 p-2 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm tracking-wider ${
                    v.riskLevel === 'HIGH' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {v.riskLevel}
                  </span>
                  <span className="font-mono text-sm text-slate-200">{v.factor}</span>
                </div>
                <span className="text-xs text-slate-400">{v.description}</span>
              </div>
            ))}
          </div>
        </PanelFrame>

        <PanelFrame
          className="flex-1 min-w-0"
          config={{
            id: 'historical-context',
            type: PanelType.HISTORICAL,
            title: 'Historical Context',
          }}
        >
          <div className="flex h-full w-full gap-4">
            <div className="flex-1 border-r border-slate-800 pr-4">
              <table className="w-full text-left text-sm h-full">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="pb-1 font-normal">Period</th>
                    <th className="pb-1 font-normal text-right">Return</th>
                    <th className="pb-1 font-normal text-right">Vol</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {model.historicalContext.map(h => (
                    <tr key={h.period} className="border-b border-slate-800/50 last:border-0">
                      <td className="py-1 font-mono">{h.period}</td>
                      <td className={`py-1 text-right font-mono ${h.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {h.returnPct > 0 ? '+' : ''}{h.returnPct}%
                      </td>
                      <td className="py-1 text-right font-mono text-slate-400">{h.volatility}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex-1 min-w-0 min-h-0">
              <ChartCard className="h-full">
                <TerminalChart
                  type="line"
                  series={model.historicalContext.map(h => h.returnPct)}
                  labels={model.historicalContext.map(h => h.period)}
                />
              </ChartCard>
            </div>
          </div>
        </PanelFrame>
      </div>
    );

    return {
      primaryPanels,
      secondaryPanels,
      tertiaryPanels,
    };
  },
};

export const MarketTerminalModule: React.FC<{ className?: string }> = ({ className }) => {
  const store = useTerminalStore();
  const activeSymbol = store.state.activeSymbol;
  const timeframe = '1D'; // For now

  const context: TerminalModuleContext = useMemo(
    () => ({
      activeSymbol,
      timeframe,
      state: store.state,
    }),
    [activeSymbol, timeframe, store.state]
  );

  const model = useMemo(() => MarketModuleContract.buildModel(context), [context]);

  return (
    <TerminalRuntime
      moduleId={MarketModuleContract.id}
      title={MarketModuleContract.title}
      decisionPrompt={MarketModuleContract.decisionPrompt}
      bandSpec={MarketModuleContract.bandSpec}
      renderModule={() => MarketModuleContract.render(model)}
      className={className}
    />
  );
};

ModuleRegistry.register(MarketModuleContract);

export default MarketTerminalModule;
