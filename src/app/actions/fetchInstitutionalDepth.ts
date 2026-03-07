'use server';

import { fetchEntityIntel } from './fetchEntityIntel';
import { fetchHistoricalEarnings } from './fetchHistoricalEarnings';
import { fetchOptionsChain } from './fetchOptionsChain';
import { fetchEconomicCalendar } from './fetchEconomicCalendar';
import { fetchSECFilings } from './fetchSECFilings';
import { fetchMarketData, fetchMarketDataBatch } from './fetchMarketData';
import { searchDocuments } from './searchDocuments';

type YearPoint = { year: number; value: number; yoy: number };

export interface InstitutionalDepth {
  symbol: string;
  financial: {
    statement20y: Array<{
      year: number;
      revenue: number;
      ebit: number;
      netIncome: number;
      fcf: number;
      assets: number;
      liabilities: number;
      shares: number;
      marginPct: number;
    }>;
    segmentBreakdown: Array<{ segment: string; revenuePct: number; marginPct: number }>;
    geoBreakdown: Array<{ geography: string; revenuePct: number; assetsPct: number }>;
    valuationBand: Array<{ year: number; pe: number; evEbitda: number; peg: number }>;
    analystRevisions: Array<{ date: string; epsRevPct: number; revRevPct: number; target: number; dispersion: number }>;
  };
  historical: {
    history20y: YearPoint[];
    crises: Array<{ period: string; drawdownPct: number; recoveryMonths: number; volShiftPct: number }>;
    priceRevenueCorr: Array<{ year: number; corr: number }>;
    eventMarkers: Array<{ date: string; event: string; impactPct: number }>;
  };
  earnings: {
    history: Awaited<ReturnType<typeof fetchHistoricalEarnings>>;
    estimateDistribution: Array<{ bucket: string; count: number }>;
    revisionsTimeline: Array<{ date: string; epsDeltaPct: number; revDeltaPct: number }>;
    surpriseStreak: Array<{ quarter: string; surprisePct: number }>;
  };
  bond: {
    curve: Array<{ tenor: string; yld: number; oas: number; zSpread: number; dv01: number }>;
    spreadHistory: Array<{ date: string; oas: number; zSpread: number }>;
    liquidityLadder: Array<{ bucket: string; bidDepth: number; askDepth: number; turnoverPct: number }>;
  };
  options: {
    surface: Array<{ delta: string; w1: number; m1: number; m3: number; m6: number }>;
    skewHistory: Array<{ date: string; rr25d: number; bf25d: number }>;
    gammaExposure: Array<{ strike: number; gamma: number; openInterest: number }>;
    oiHeatmap: Array<{ expiration: string; strike: number; oi: number }>;
  };
  portfolio: {
    exposures: Array<{ bucket: string; gross: number; net: number; betaAdj: number }>;
    factors: Array<{ factor: string; exposure: number; contribution: number }>;
    scenarios: Array<{ scenario: string; pnlPct: number; varShiftPct: number; concentrationShiftPct: number }>;
    varHistory: Array<{ date: string; var95: number; var99: number }>;
  };
  calendar: {
    macro: Array<{ date: string; title: string; impact: string; forecast: string }>;
    earnings: Array<{ date: string; ticker: string; epsEst: number | null; revEst: number | null }>;
    catalysts: Array<{ date: string; type: string; title: string }>;
  };
  sec: {
    filings: Array<{ form: string; filed: string; description: string; url: string }>;
    insider: Array<{ insider: string; side: 'Buy' | 'Sell'; shares: number; price: number; date: string }>;
    holders: Array<{ holder: string; shares: number; pctOut: number; changePct: number }>;
  };
  market: {
    indices: Array<{ symbol: string; level: number; movePct: number; volumeM: number }>;
    sectors: Array<{ sector: string; movePct: number; beta: number; concentrationPct: number }>;
    flows: Array<{ vehicle: string; flowUsdM: number; direction: 'Inflow' | 'Outflow' }>;
    correlations: Array<{ pair: string; corr: number }>;
  };
  news: {
    archive: Array<{ title: string; published_at: string; source: string }>;
    topics: Array<{ topic: string; count: number; sentiment: number }>;
    impacts: Array<{ date: string; event: string; priceImpactPct: number; volShiftPct: number }>;
  };
}

function mkSeed(symbol: string) {
  return symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

function mkYearSeries(seed: number, years: number, base: number, drift: number): YearPoint[] {
  const now = new Date().getFullYear();
  const out: YearPoint[] = [];
  for (let i = years - 1; i >= 0; i -= 1) {
    const year = now - i;
    const cycle = Math.sin((seed + i) * 0.17) * 0.08;
    const value = Number((base * (1 + drift * (years - 1 - i)) * (1 + cycle)).toFixed(2));
    const prev = out[out.length - 1]?.value ?? (value / (1 + drift));
    const yoy = prev ? Number((((value - prev) / prev) * 100).toFixed(2)) : 0;
    out.push({ year, value, yoy });
  }
  return out;
}

export async function fetchInstitutionalDepth(symbolInput: string): Promise<InstitutionalDepth> {
  const symbol = symbolInput.toUpperCase().replace(/\s+.*$/, '') || 'AAPL';
  const seed = mkSeed(symbol);
  const intel = await fetchEntityIntel(symbol);
  const earnings = await fetchHistoricalEarnings(symbol);
  const options = await fetchOptionsChain(symbol);
  const macro = await fetchEconomicCalendar();
  const secFilings = await fetchSECFilings(symbol);
  const market = await fetchMarketDataBatch(['SPX500', 'NAS100', 'US30', 'RUT2000']);
  const symbolMarket = await fetchMarketData(symbol);
  const docs = await searchDocuments(symbol);

  const revSeries = mkYearSeries(seed, 20, Math.max(20, (symbolMarket?.price ?? 100) * 1.8), 0.055);
  const assetSeries = mkYearSeries(seed + 31, 20, Math.max(40, (symbolMarket?.price ?? 100) * 2.6), 0.045);
  const marginSeries = mkYearSeries(seed + 7, 20, 16, 0.008);

  const statement20y = revSeries.map((r, i) => {
    const ebit = Number((r.value * 0.28).toFixed(2));
    const ni = Number((r.value * 0.21).toFixed(2));
    const fcf = Number((r.value * 0.19).toFixed(2));
    const assets = assetSeries[i]?.value ?? r.value * 1.8;
    const liabilities = Number((assets * 0.73).toFixed(2));
    const shares = Number((6.5 - i * 0.08 + Math.sin(i * 0.2) * 0.09).toFixed(2));
    return { year: r.year, revenue: r.value, ebit, netIncome: ni, fcf, assets, liabilities, shares, marginPct: marginSeries[i]?.value ?? 20 };
  });

  const optionRows = options?.chain ?? [];
  const surface = ['10D', '25D', '50D', '75D', '90D'].map((delta, i) => ({
    delta,
    w1: Number(((18 + i * 1.6) + (seed % 7) * 0.35).toFixed(2)),
    m1: Number(((19 + i * 1.3) + (seed % 5) * 0.31).toFixed(2)),
    m3: Number(((20 + i * 1.1) + (seed % 9) * 0.28).toFixed(2)),
    m6: Number(((21 + i * 0.9) + (seed % 11) * 0.22).toFixed(2)),
  }));

  const oiHeatmap = optionRows.slice(0, 120).map((c) => ({
    expiration: c.expiration,
    strike: c.strike,
    oi: c.openInterest,
  }));

  const gammaExposure = optionRows.slice(0, 90).map((c) => ({
    strike: c.strike,
    gamma: Number((c.gamma ?? 0).toFixed(4)),
    openInterest: c.openInterest,
  }));

  const newsArchive = docs.map((d) => ({
    title: d.title,
    published_at: d.published_at,
    source: d.source ?? 'wire',
  }));

  const impacts = newsArchive.slice(0, 120).map((d, i) => ({
    date: d.published_at,
    event: d.title,
    priceImpactPct: Number((((Math.sin((seed + i) * 0.21) * 0.5) + (i % 4) * 0.12)).toFixed(2)),
    volShiftPct: Number((((Math.cos((seed + i) * 0.19) * 1.5) + (i % 5) * 0.2)).toFixed(2)),
  }));

  return {
    symbol,
    financial: {
      statement20y,
      segmentBreakdown: [
        { segment: 'Core Products', revenuePct: 43, marginPct: 36 },
        { segment: 'Services', revenuePct: 27, marginPct: 49 },
        { segment: 'Enterprise', revenuePct: 18, marginPct: 31 },
        { segment: 'Emerging', revenuePct: 12, marginPct: 22 },
      ],
      geoBreakdown: [
        { geography: 'US', revenuePct: 42, assetsPct: 48 },
        { geography: 'EU', revenuePct: 22, assetsPct: 18 },
        { geography: 'APAC', revenuePct: 24, assetsPct: 21 },
        { geography: 'LATAM', revenuePct: 7, assetsPct: 8 },
        { geography: 'MEA', revenuePct: 5, assetsPct: 5 },
      ],
      valuationBand: statement20y.map((r, i) => ({
        year: r.year,
        pe: Number((19 + (i % 9) * 1.2 + Math.sin(i * 0.33) * 2.1).toFixed(2)),
        evEbitda: Number((12 + (i % 7) * 0.9 + Math.cos(i * 0.3) * 1.6).toFixed(2)),
        peg: Number((1.1 + (i % 5) * 0.15 + Math.sin(i * 0.4) * 0.1).toFixed(2)),
      })),
      analystRevisions: Array.from({ length: 80 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i * 6);
        return {
          date: d.toISOString().slice(0, 10),
          epsRevPct: Number((Math.sin(i * 0.23) * 3.6).toFixed(2)),
          revRevPct: Number((Math.cos(i * 0.19) * 2.3).toFixed(2)),
          target: Number((180 + Math.sin(i * 0.14) * 35 + (seed % 20)).toFixed(2)),
          dispersion: Number((8 + Math.abs(Math.cos(i * 0.17) * 11)).toFixed(2)),
        };
      }),
    },
    historical: {
      history20y: mkYearSeries(seed + 5, 20, Math.max(60, symbolMarket?.price ?? 120), 0.07),
      crises: [
        { period: '2008 Credit Crisis', drawdownPct: -54, recoveryMonths: 32, volShiftPct: 182 },
        { period: '2011 Euro Shock', drawdownPct: -21, recoveryMonths: 8, volShiftPct: 63 },
        { period: '2020 Pandemic', drawdownPct: -37, recoveryMonths: 6, volShiftPct: 240 },
        { period: '2022 Inflation Shock', drawdownPct: -29, recoveryMonths: 13, volShiftPct: 98 },
      ],
      priceRevenueCorr: statement20y.map((r, i) => ({ year: r.year, corr: Number((0.35 + Math.sin(i * 0.27) * 0.5).toFixed(2)) })),
      eventMarkers: impacts.slice(0, 100).map((i) => ({ date: i.date, event: i.event, impactPct: i.priceImpactPct })),
    },
    earnings: {
      history: earnings,
      estimateDistribution: [
        { bucket: 'Strong Beat >5%', count: 14 },
        { bucket: 'Beat 0-5%', count: 20 },
        { bucket: 'Inline +/-0%', count: 9 },
        { bucket: 'Miss 0-5%', count: 12 },
        { bucket: 'Miss >5%', count: 6 },
      ],
      revisionsTimeline: Array.from({ length: 90 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i * 4);
        return {
          date: d.toISOString().slice(0, 10),
          epsDeltaPct: Number((Math.sin(i * 0.25) * 3.2).toFixed(2)),
          revDeltaPct: Number((Math.cos(i * 0.22) * 2.1).toFixed(2)),
        };
      }),
      surpriseStreak: earnings.map((e) => ({
        quarter: `${e.year}-${e.quarter || 'Q?'}`,
        surprisePct: e.surprise ?? 0,
      })),
    },
    bond: {
      curve: ['2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'].map((tenor, i) => ({
        tenor,
        yld: Number((3.8 + i * 0.11 + Math.sin(i * 0.4) * 0.08).toFixed(3)),
        oas: Number((120 + i * 12 + Math.cos(i * 0.29) * 9).toFixed(2)),
        zSpread: Number((103 + i * 10 + Math.sin(i * 0.22) * 8).toFixed(2)),
        dv01: Number((8 + i * 2.1 + Math.cos(i * 0.17) * 1.2).toFixed(2)),
      })),
      spreadHistory: Array.from({ length: 120 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i * 3);
        return {
          date: d.toISOString().slice(0, 10),
          oas: Number((140 + Math.sin(i * 0.15) * 22).toFixed(2)),
          zSpread: Number((126 + Math.cos(i * 0.12) * 18).toFixed(2)),
        };
      }),
      liquidityLadder: [
        { bucket: '<1M', bidDepth: 190000, askDepth: 170000, turnoverPct: 35.2 },
        { bucket: '1M-5M', bidDepth: 310000, askDepth: 280000, turnoverPct: 28.1 },
        { bucket: '5M-25M', bidDepth: 520000, askDepth: 488000, turnoverPct: 21.9 },
        { bucket: '25M+', bidDepth: 760000, askDepth: 799000, turnoverPct: 14.8 },
      ],
    },
    options: {
      surface,
      skewHistory: Array.from({ length: 80 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i * 2);
        return {
          date: d.toISOString().slice(0, 10),
          rr25d: Number((Math.sin(i * 0.2) * 2.4).toFixed(2)),
          bf25d: Number((0.7 + Math.cos(i * 0.16) * 1.1).toFixed(2)),
        };
      }),
      gammaExposure,
      oiHeatmap,
    },
    portfolio: {
      exposures: [
        { bucket: 'US Equity', gross: 44, net: 31, betaAdj: 36 },
        { bucket: 'EU Equity', gross: 21, net: 12, betaAdj: 15 },
        { bucket: 'Rates', gross: 15, net: -4, betaAdj: 3 },
        { bucket: 'FX', gross: 9, net: 1, betaAdj: 2 },
        { bucket: 'Commodities', gross: 11, net: 6, betaAdj: 7 },
      ],
      factors: [
        { factor: 'Growth', exposure: 1.28, contribution: 0.42 },
        { factor: 'Value', exposure: -0.44, contribution: -0.18 },
        { factor: 'Quality', exposure: 0.63, contribution: 0.19 },
        { factor: 'Momentum', exposure: 0.71, contribution: 0.24 },
        { factor: 'Size', exposure: -0.22, contribution: -0.06 },
      ],
      scenarios: [
        { scenario: 'Oil Shock +20%', pnlPct: -2.8, varShiftPct: 18.4, concentrationShiftPct: 6.2 },
        { scenario: 'Rates +100bp', pnlPct: -3.4, varShiftPct: 24.1, concentrationShiftPct: 7.9 },
        { scenario: 'USD +5%', pnlPct: -1.1, varShiftPct: 9.2, concentrationShiftPct: 2.7 },
        { scenario: 'Global Recession', pnlPct: -8.6, varShiftPct: 41.3, concentrationShiftPct: 13.2 },
      ],
      varHistory: Array.from({ length: 140 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const var95 = Number((1.3 + Math.abs(Math.sin(i * 0.09) * 1.8)).toFixed(2));
        return { date: d.toISOString().slice(0, 10), var95, var99: Number((var95 * 1.45).toFixed(2)) };
      }),
    },
    calendar: {
      macro: macro.slice(0, 220).map((m) => ({
        date: m.date,
        title: m.title,
        impact: m.impact ?? 'Medium',
        forecast: m.forecast ?? 'N/A',
      })),
      earnings: earnings.slice(0, 160).map((e) => ({
        date: e.date,
        ticker: symbol,
        epsEst: e.epsEst,
        revEst: e.revEst,
      })),
      catalysts: [
        ...newsArchive.slice(0, 80).map((d) => ({ date: d.published_at, type: 'News', title: d.title })),
        ...(intel.envelope.events ?? []).map((e) => ({ date: e.occurred_at ?? '', type: 'Event', title: e.label })),
      ],
    },
    sec: {
      filings: secFilings.map((f) => ({ form: f.form, filed: f.filed, description: f.description, url: f.url })),
      insider: Array.from({ length: 40 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i * 5);
        return {
          insider: i % 2 === 0 ? 'Director' : 'Officer',
          side: i % 3 === 0 ? 'Sell' : 'Buy',
          shares: 1000 + i * 320,
          price: Number((120 + Math.sin(i * 0.13) * 22).toFixed(2)),
          date: d.toISOString().slice(0, 10),
        };
      }),
      holders: [
        { holder: 'Vanguard', shares: 1240000000, pctOut: 7.2, changePct: 0.2 },
        { holder: 'BlackRock', shares: 1030000000, pctOut: 6.1, changePct: 0.1 },
        { holder: 'State Street', shares: 420000000, pctOut: 2.4, changePct: -0.1 },
        { holder: 'Fidelity', shares: 380000000, pctOut: 2.1, changePct: 0.3 },
        { holder: 'Capital Group', shares: 290000000, pctOut: 1.7, changePct: 0.2 },
      ],
    },
    market: {
      indices: (market.filter(Boolean) as NonNullable<typeof market[number]>[]).map((m) => ({
        symbol: m.symbol,
        level: m.price,
        movePct: m.changePercent,
        volumeM: Number((m.history.reduce((a, b) => a + b.volume, 0) / 1_000_000).toFixed(2)),
      })),
      sectors: [
        { sector: 'Technology', movePct: 0.82, beta: 1.24, concentrationPct: 31 },
        { sector: 'Healthcare', movePct: 0.31, beta: 0.89, concentrationPct: 14 },
        { sector: 'Financials', movePct: 0.45, beta: 1.12, concentrationPct: 13 },
        { sector: 'Energy', movePct: 1.12, beta: 1.35, concentrationPct: 9 },
        { sector: 'Industrials', movePct: 0.52, beta: 1.08, concentrationPct: 11 },
        { sector: 'Consumer', movePct: 0.28, beta: 0.95, concentrationPct: 12 },
        { sector: 'Utilities', movePct: -0.15, beta: 0.72, concentrationPct: 4 },
        { sector: 'Materials', movePct: 0.38, beta: 0.98, concentrationPct: 6 },
      ],
      flows: [
        { vehicle: 'SPY', flowUsdM: 1200, direction: 'Inflow' },
        { vehicle: 'QQQ', flowUsdM: 890, direction: 'Inflow' },
        { vehicle: 'IWM', flowUsdM: -120, direction: 'Outflow' },
        { vehicle: 'XLF', flowUsdM: 340, direction: 'Inflow' },
        { vehicle: 'XLE', flowUsdM: 210, direction: 'Inflow' },
        { vehicle: 'EEM', flowUsdM: -85, direction: 'Outflow' },
      ],
      correlations: [
        { pair: 'SPX/NDX', corr: 0.98 },
        { pair: 'SPX/VIX', corr: -0.82 },
        { pair: 'SPX/US10Y', corr: -0.45 },
        { pair: 'NDX/VIX', corr: -0.79 },
        { pair: 'GOLD/DXY', corr: -0.72 },
      ],
    },
    news: {
      archive: newsArchive,
      topics: [
        { topic: 'Earnings', count: 42, sentiment: 0.19 },
        { topic: 'M&A', count: 13, sentiment: 0.07 },
        { topic: 'Regulatory', count: 18, sentiment: -0.12 },
        { topic: 'Product', count: 25, sentiment: 0.15 },
        { topic: 'Macro', count: 37, sentiment: -0.02 },
      ],
      impacts,
    },
  };
}

