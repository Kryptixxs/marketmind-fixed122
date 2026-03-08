import { ModuleDataModel, ModuleTableRow, Quote, TerminalState } from '../../types';

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function normalize(values: number[]): number[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map((v) => (v - min) / (max - min));
}

function classifyRegime(riskOnScore: number): 'RISK ON' | 'RISK OFF' | 'TRANSITION' {
  if (riskOnScore >= 0.2) return 'RISK ON';
  if (riskOnScore <= -0.2) return 'RISK OFF';
  return 'TRANSITION';
}

function pickByMarket(quotes: Quote[], market: string): Quote[] {
  return quotes.filter((q) => q.symbol.includes(` ${market}`));
}

function pct(value: number, digits = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

function bps(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}bp`;
}

function mkRows(entries: Array<{ key: string; value: string; tone?: string }>): ModuleTableRow[] {
  return entries.map((e) => ({ key: e.key, value: e.value, tone: (e.tone as ModuleTableRow['tone'] | undefined) ?? 'neutral' }));
}

function timeframeSeries(series: number[]) {
  const mk = (label: '5D' | '1M' | '3M', length: number) => ({
    label,
    series: normalize(series.slice(-length)),
  });
  return [mk('5D', 20), mk('1M', 40), mk('3M', 90)];
}

export function buildMarketDataModel(state: TerminalState): ModuleDataModel {
  const indices = pickByMarket(state.quotes, 'Index');
  const rates = pickByMarket(state.quotes, 'Govt');
  const fx = pickByMarket(state.quotes, 'Curncy');
  const creditProxy = state.quotes.filter((q) => q.symbol === 'US10Y Govt' || q.symbol === 'SPX Index');
  const activeBars = state.barsBySymbol[state.activeSymbol] ?? [];
  const closeSeries = activeBars.map((b) => b.close);
  const vwapSeries = activeBars.map((b) => b.vwap);

  const adv = state.quotes.filter((q) => q.pct >= 0).length;
  const dec = state.quotes.filter((q) => q.pct < 0).length;
  const breadth = state.quotes.length ? (adv / state.quotes.length) * 100 : 50;
  const avgMove = mean(state.quotes.map((q) => q.pct));
  const volState = state.risk.impliedVolProxy;
  const riskOnScore = (breadth - 50) / 50 + avgMove / 2 - volState / 100;
  const regime = classifyRegime(riskOnScore);

  const topFactorMovers = [...state.quotes]
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, 6);

  const divergenceSeries = topFactorMovers.map((q) => q.pct - avgMove);
  const liquiditySeries = state.orderBook.slice(0, 16).map((l) => l.bidSize - l.askSize);
  const volTermSeries = [state.risk.realizedVol, state.risk.impliedVolProxy, state.microstructure.insideSpreadBps];
  const dollarImpact = fx[0]?.pct ?? 0;

  const etfFlowProxy = state.quotes.slice(0, 8).map((q) => q.volumeM * q.pct);
  const gammaProxy = state.microstructure.orderFlowImbalance * 100;
  const skewProxy = state.microstructure.imbalance * 100;
  const futuresProxy = indices.map((q) => q.pct * q.volumeM);
  const concentration = state.risk.concentration;

  const volatilityAlert = state.risk.impliedVolProxy > state.risk.realizedVol + 2;
  const liquidityStress = state.microstructure.insideSpreadBps > 6 || Math.abs(state.microstructure.imbalance) > 0.55;
  const breadthDeterioration = breadth < 45;

  return {
    moduleCode: 'MKT',
    asOfTs: state.tickMs,
    table: {
      regimeSnapshot: mkRows([
        { key: 'Regime', value: regime, tone: regime === 'RISK ON' ? 'positive' : regime === 'RISK OFF' ? 'negative' : 'warning' },
        { key: 'Breadth', value: `${breadth.toFixed(0)}% (${adv}/${dec})`, tone: breadth >= 50 ? 'positive' : 'negative' },
        { key: 'RiskOnScore', value: riskOnScore.toFixed(2), tone: riskOnScore >= 0 ? 'positive' : 'negative' },
        { key: 'VolState', value: `${state.risk.impliedVolProxy.toFixed(1)} / ${state.risk.realizedVol.toFixed(1)}`, tone: volatilityAlert ? 'warning' : 'neutral' },
        { key: 'CreditProxy', value: creditProxy.map((q) => `${q.symbol.split(' ')[0]} ${pct(q.pct)}`).join(' | ') || 'N/A', tone: 'accent' },
        { key: 'Rates', value: rates.slice(0, 2).map((q) => `${q.symbol.split(' ')[0]} ${pct(q.pct)}`).join(' | ') || 'N/A', tone: 'neutral' },
        { key: 'FX', value: fx.slice(0, 2).map((q) => `${q.symbol.split(' ')[0]} ${pct(q.pct)}`).join(' | ') || 'N/A', tone: 'neutral' },
      ]),
      driverAnalysis: mkRows([
        ...topFactorMovers.map((q) => ({
          key: `Factor ${q.symbol.split(' ')[0]}`,
          value: `${pct(q.pct)} | Vol ${q.volumeM.toFixed(1)}M`,
          tone: q.pct >= 0 ? 'positive' : 'negative',
        })),
        { key: 'LiquidityRegime', value: `${bps(state.microstructure.insideSpreadBps)} | OFI ${state.microstructure.orderFlowImbalance.toFixed(2)}`, tone: liquidityStress ? 'warning' : 'neutral' },
        { key: 'CrossAssetDiv', value: `${mean(divergenceSeries).toFixed(2)} sigma proxy`, tone: Math.abs(mean(divergenceSeries)) > 0.8 ? 'warning' : 'neutral' },
        { key: 'DollarImpact', value: pct(dollarImpact), tone: dollarImpact <= -0.2 ? 'positive' : dollarImpact >= 0.2 ? 'negative' : 'neutral' },
      ]),
      flowPositioning: mkRows([
        { key: 'ETFFlowProxy', value: etfFlowProxy.reduce((a, b) => a + b, 0).toFixed(0), tone: etfFlowProxy.reduce((a, b) => a + b, 0) >= 0 ? 'positive' : 'negative' },
        { key: 'DealerGamma', value: gammaProxy.toFixed(1), tone: Math.abs(gammaProxy) > 35 ? 'warning' : 'neutral' },
        { key: 'PutCallSkew', value: skewProxy.toFixed(1), tone: skewProxy < -20 ? 'negative' : skewProxy > 20 ? 'positive' : 'neutral' },
        { key: 'FuturesPos', value: futuresProxy.reduce((a, b) => a + b, 0).toFixed(0), tone: 'accent' },
        { key: 'RiskConcentration', value: `${concentration.toFixed(1)}%`, tone: concentration > 35 ? 'warning' : 'neutral' },
        { key: 'VolExpansionAlert', value: volatilityAlert ? 'ON' : 'OFF', tone: volatilityAlert ? 'warning' : 'neutral' },
        { key: 'LiquidityStress', value: liquidityStress ? 'ON' : 'OFF', tone: liquidityStress ? 'warning' : 'neutral' },
        { key: 'BreadthDeterioration', value: breadthDeterioration ? 'ON' : 'OFF', tone: breadthDeterioration ? 'warning' : 'neutral' },
      ]),
      deepDetail: mkRows([
        { key: 'CrisisComp 2020', value: `DD -34% | Vol +${(state.risk.impliedVolProxy * 1.8).toFixed(0)}%`, tone: 'negative' },
        { key: 'CrisisComp 2022', value: `DD -25% | Vol +${(state.risk.impliedVolProxy * 1.2).toFixed(0)}%`, tone: 'negative' },
        { key: 'CorrMatrix SPX/NDX', value: `${mean(indices.map((q) => q.corrToNDX)).toFixed(2)} corr`, tone: 'accent' },
        { key: 'LiquidityDepth', value: `${state.orderBook.length} levels | OFI ${state.microstructure.orderFlowImbalance.toFixed(2)}`, tone: 'neutral' },
        { key: 'SectorDispersion', value: state.risk.exposureBySector.slice(0, 3).map((s) => `${s.sector}:${s.value.toFixed(1)}`).join(' | ') || 'N/A', tone: 'neutral' },
      ]),
    },
    charts: {
      regimeSnapshot: {
        key: 'regimeSnapshot',
        question: 'What is the current market regime across core risk proxies?',
        series: normalize(indices.map((q) => q.pct)),
        secondary: normalize(rates.map((q) => q.pct)),
        labels: indices.map((q) => q.symbol.split(' ')[0]),
        timeframes: timeframeSeries(closeSeries),
      },
      driverAnalysis: {
        key: 'driverAnalysis',
        question: 'What factors are driving the move right now?',
        series: normalize(divergenceSeries),
        secondary: normalize(liquiditySeries),
        labels: topFactorMovers.map((q) => q.symbol.split(' ')[0]),
        timeframes: timeframeSeries(vwapSeries.length ? vwapSeries : closeSeries),
      },
      flowPositioning: {
        key: 'flowPositioning',
        question: 'Where are flows and positioning vulnerable?',
        series: normalize(etfFlowProxy),
        secondary: normalize([gammaProxy, skewProxy, concentration, ...futuresProxy.slice(0, 4)]),
        labels: state.quotes.slice(0, 8).map((q) => q.symbol.split(' ')[0]),
        timeframes: [
          { label: '5D', series: normalize(volTermSeries) },
          { label: '1M', series: normalize(futuresProxy.slice(0, 12)) },
          { label: '3M', series: normalize(etfFlowProxy) },
        ],
      },
      deepDetail: {
        key: 'deepDetail',
        question: 'How does current stress compare with historical and correlation depth?',
        series: normalize([state.risk.realizedVol, state.risk.impliedVolProxy, ...divergenceSeries.slice(0, 6)]),
        secondary: normalize([state.microstructure.insideSpreadBps, state.microstructure.orderFlowImbalance * 100, state.microstructure.imbalance * 100]),
        labels: ['RV', 'IV', 'DIV1', 'DIV2', 'DIV3', 'DIV4', 'DIV5', 'DIV6'],
      },
    },
  };
}
