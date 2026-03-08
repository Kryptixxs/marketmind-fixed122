'use client';

import React, { useMemo, useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader, StatusBadge } from '../primitives';
import { useTerminalStore } from '../../store/TerminalStore';

const SOURCES = ['BBG', 'RTRS', 'DJ', 'AP', 'FT', 'WSJ', 'CNBC', 'NHK', 'AFP', 'BLO', 'PAD', 'SPX', 'EVS', 'FLR', 'MNI'];
const TAGS = ['RATES', 'FX', 'EQUITIES', 'MACRO', 'ENERGY', 'TECH', 'BANKS', 'EMERGING', 'CREDIT', 'POLICY'];
const URGENCY_CYCLE = ['normal','normal','normal','normal','normal','top','normal','normal','flash','normal'] as const;

const BASE_HEADLINES = [
  'FED SPEAKERS MAINTAIN CAUTIOUS TONE AHEAD OF CPI PRINT',
  'ECB HOLDS RATES AT 4.50% — SIGNALS PATIENT APPROACH TO CUTS',
  'CHINA PMI BEATS EXPECTATIONS AT 50.4 IN FIRST EXPANSION IN 5 MONTHS',
  'OIL PRICES RISE 1.3% ON MIDDLE EAST SUPPLY DISRUPTION RISK',
  'TECH EARNINGS SEASON BEGINS WITH MIXED RESULTS FROM MEGA-CAPS',
  'US TREASURY 10Y YIELD CLIMBS TO 4.73% ON STRONG JOBS DATA',
  'GOLD HITS RECORD $2,320/OZ ON SAFE-HAVEN AND CENTRAL BANK BUYING',
  'JAPAN INTERVENES IN FX MARKET AS USD/JPY BREAKS 155 LEVEL',
  'UK INFLATION FALLS TO 3.2%, BELOW BOE TARGET FOR FIRST TIME',
  'SEMICONDUCTOR STOCKS RALLY AS AI SERVER DEMAND OUTLOOK UPGRADED',
  'EMERGING MARKET BONDS SEE LARGEST WEEKLY INFLOWS IN SIX MONTHS',
  'CORPORATE BOND SPREADS NARROW TO PRE-COVID LOWS IN INVESTMENT GRADE',
  'BITCOIN ETF VOLUMES REACH $14.4B DAILY RECORD ON HALVING WEEK',
  'EUROPEAN AUTO SECTOR FACES HEADWINDS FROM ACCELERATING EV COST TRANSITION',
  'US BANKING SECTOR REPORTS STRONG Q1 LOAN GROWTH ON CONSUMER CREDIT',
  'BRENT CRUDE FALLS TO $82.30 ON CEASEFIRE TALKS PROGRESS',
  'CHINA ANNOUNCES ADDITIONAL FISCAL STIMULUS OF CNY 2T FOR H2 2024',
  'IMF UPGRADES GLOBAL GROWTH FORECAST TO 3.2% FOR 2024',
  'BOJ HINTS AT FURTHER RATE HIKE AS INFLATION TARGETS REACHED',
  'ARGENTINA PESO STABILIZES AFTER SHARP DEVALUATION IN REFORM PACKAGE',
  'SEMICONDUCTOR SHORTAGE EASES AS TSMC RAMPS ADVANCED NODE PRODUCTION',
  'ESG BONDS REACH $500B ISSUANCE MILESTONE IN JANUARY-MARCH QUARTER',
  'PRIVATE EQUITY DEALFLOW RECOVERS IN Q1 ON RATE STABILIZATION',
  'ENERGY TRANSITION CAPEX HITS RECORD $1.8T IN 2023 — BNEF REPORT',
  'US CONSUMER CONFIDENCE FALLS TO 99.3 AS INFLATION ANXIETY PERSISTS',
  'BITCOIN HALVING COMPLETED — BLOCK REWARD NOW 3.125 BTC',
  'NIKKEI 225 HITS 40,000 FOR FIRST TIME ON YEN WEAKNESS + BUYBACKS',
  'APPLE REPORTS RECORD SERVICE REVENUE IN Q1 AT $23.9B',
  'NVIDIA ANNOUNCES H200 MEMORY UPGRADE FOR GRACE HOPPER SUPERCHIPS',
  'META RAISES CAPEX GUIDANCE TO $37B ON AI INFRASTRUCTURE EXPANSION',
  'AMAZON AWS REVENUE GROWS 17% YOY TO $25B IN QUARTERLY RESULTS',
  'US SMALL CAP RALLY FADES AS REGIONAL BANK CONCERNS RE-EMERGE',
  'GERMANY INDUSTRIAL PRODUCTION FALLS -0.8% MOM — THIRD MISS IN ROW',
  'INFLATION-LINKED BOND ISSUANCE RISES AS HEDGE DEMAND GROWS',
  'HEDGE FUNDS INCREASE SHORT POSITIONS IN EUR AHEAD OF ECB MEETING',
  'TAIWAN ELECTION RESULT LIFTS TAIEX 2.1% ON REDUCED GEOPOLITICAL RISK',
  'OPEC+ AGREES TO EXTEND PRODUCTION CUTS THROUGH Q3 2024',
  'VANGUARD LAUNCHES NEW FACTOR ETF SUITE WITH $0 MANAGEMENT FEE',
  'PALANTIR AWARDED $178M US ARMY DATA ANALYTICS CONTRACT',
  'TESLA CUTS PRICES IN CHINA FOR THIRD TIME THIS YEAR — MODEL 3 DOWN 8%',
  'BUYBACKS REMAIN DOMINANT CAPITAL RETURN METHOD FOR S&P 500 CONSTITUENTS',
  'GOLDMAN SACHS RAISES YEAR-END S&P TARGET TO 5,200 FROM 4,700',
  'CREDIT SUISSE ASSET SALE COMPLETES — UBS INTEGRATION ON TRACK',
  'WORLD BANK ISSUES $4.5B SUSTAINABLE DEVELOPMENT BOND IN DOLLARS',
  'NASDAQ 100 COMPONENTS AVERAGE P/E RATIO REACHES 29X ON FORWARD BASIS',
  'KOREAN WON DROPS TO 3-YEAR LOW AS CAPITAL OUTFLOWS ACCELERATE',
  'RUSSIA RUBLE STABILIZES AFTER CENTRAL BANK EMERGENCY RATE HIKE TO 16%',
  'FRENCH OAT-BUND SPREAD WIDENS 4BP ON POLITICAL UNCERTAINTY HEADLINES',
  'COPPER FUTURES HIT $9,500/T ON CHILE SUPPLY DISRUPTION REPORTS',
  'INDIAN EQUITY MARKET SEES RECORD $8.2B FOREIGN INFLOW IN MARCH',
  'TURKISH LIRA HITS ALL-TIME LOW VS USD AS INFLATION HITS 68% ANNUAL',
  'HONG KONG IPO PIPELINE GROWS AS RISK APPETITE RECOVERS IN ASIA',
  'INDONESIA CENTRAL BANK HOLDS RATES — VIGILANT ON RUPIAH MOVES',
  'SOUTH AFRICAN RAND WEAKENS ON LOAD SHEDDING CRISIS AND ELECTION RISK',
  'CRUDE PALM OIL FUTURES RISE 2.4% ON INDONESIA EXPORT CURB CONCERNS',
  'LITHIUM PRICES STABILIZE AFTER 70% DRAWDOWN — EV DEMAND FLOOR FOUND',
  'SWISS NATIONAL BANK CUTS RATES 25BP — FIRST MAJOR CENTRAL BANK TO ACT',
  'EUROPEAN UTILITIES RALLY ON CAPACITY PAYMENT REFORM DISCUSSIONS',
  'UK GILT YIELDS FALL TO 4-MONTH LOW ON SOFTER WAGE DATA PRINT',
  'CANADIAN REAL ESTATE SECTOR UNDER PRESSURE AS MORTGAGE RENEWALS LOOM',
  'BRAZIL SELECTS PETROBRAS PARTNER FOR DEEPWATER OFFSHORE BLOCK 11',
  'US ELECTION POLLING NARROWS — MARKET PRICING IN ELEVATED UNCERTAINTY',
  'US CPI COMES IN AT 3.5% YOY — CORE REMAINS STICKY AT 3.8%',
  'FOMC MINUTES REVEAL CONCERN ABOUT LAST-MILE DISINFLATION DIFFICULTY',
  'BANK OF ENGLAND SIGNALS SUMMER RATE CUT IF JUNE CPI COOPERATES',
  'VIETNAMESE DONG FALLS ON CAPITAL FLIGHT — CENTRAL BANK SELLS FX',
  'MEXICO NEARSHORING BOOM DRIVES 14% JUMP IN INDUSTRIAL REAL ESTATE RENTS',
  'TAIWAN SEMICONDUCTOR CAPEX GUIDANCE $38B FOR 2024 — UP FROM $32.5B',
  'JAPANESE AUTOMAKERS WARN OF HIGHER OPERATING COSTS ON YEN WEAKNESS',
  'EU CARBON ALLOWANCES RECOVER TO €63/TON AFTER POLICY CLARIFICATION',
  'SINGAPORE MONETARY AUTHORITY MAINTAINS SGD BAND SETTINGS AT REVIEW',
];

function hash(s: string, i: number) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0) + i * 17; }

export function FnTOP({ panelIdx, companyFilter }: { panelIdx: number; companyFilter?: string }) {
  const { state } = useTerminalStore();
  const [filter, setFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  const headlines = useMemo(() => {
    // Merge live + base headlines
    const live = state.headlines ?? [];
    const merged = [...live, ...BASE_HEADLINES].slice(0, 150);
    return merged.map((h, i) => {
      const hv = hash(h, i);
      const src = SOURCES[hv % SOURCES.length]!;
      const tag = TAGS[hv % TAGS.length]!;
      const urgency = URGENCY_CYCLE[i % URGENCY_CYCLE.length]!;
      const now = new Date();
      const minOff = i * 3;
      const ts = new Date(now.getTime() - minOff * 60000);
      const time = `${ts.toISOString().slice(0, 10).slice(5)} ${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`;
      return { id: `hl-${i}`, title: companyFilter ? h : h, time, src, tag, urgency };
    });
  }, [state.headlines, companyFilter]);

  const uniqueTags = ['ALL', ...Array.from(new Set(headlines.map((h) => h.tag)))];
  const uniqueSources = ['ALL', ...Array.from(new Set(headlines.map((h) => h.src)))];

  const filtered = headlines.filter((h) =>
    (filter === 'ALL' || h.tag === filter) &&
    (sourceFilter === 'ALL' || h.src === sourceFilter)
  );

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: DENSITY.fontFamily }}>
      <PanelSubHeader title={`TOP • Top News — ${filtered.length} headlines`} right={<StatusBadge label="LIVE" variant="live" />} />
      {/* Filter bar */}
      <div className="flex items-center flex-none overflow-x-auto" style={{ height: 16, background: DENSITY.bgSurface, borderBottom: `1px solid ${DENSITY.gridlineColor}`, gap: 0 }}>
        {uniqueTags.slice(0, 8).map((t) => (
          <button key={t} type="button" onClick={() => setFilter(t)}
            style={{ padding: `0 4px`, height: '100%', background: filter === t ? '#1a2a3a' : 'none', color: filter === t ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: '8px', border: 'none', borderRight: `1px solid ${DENSITY.gridlineColor}`, cursor: 'pointer', flexShrink: 0 }}>
            {t}
          </button>
        ))}
        <div style={{ width: 1, background: DENSITY.borderColor, height: 10, margin: '0 2px' }} />
        {uniqueSources.slice(0, 6).map((s) => (
          <button key={s} type="button" onClick={() => setSourceFilter(s)}
            style={{ padding: `0 4px`, height: '100%', background: sourceFilter === s ? '#1a2a3a' : 'none', color: sourceFilter === s ? DENSITY.accentCyan : DENSITY.textMuted, fontSize: '8px', border: 'none', borderRight: `1px solid ${DENSITY.gridlineColor}`, cursor: 'pointer', flexShrink: 0 }}>
            {s}
          </button>
        ))}
      </div>
      {/* Headlines */}
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        {filtered.map((h, i) => (
          <div key={h.id} className="flex items-start gap-1"
            style={{ padding: `${DENSITY.pad2}px ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: i % 2 === 1 ? '#060606' : DENSITY.bgBase, minHeight: DENSITY.rowHeightPx }}>
            <span className="shrink-0 tabular-nums" style={{ color: DENSITY.accentAmber, width: 75, fontSize: DENSITY.fontSizeTiny }}>{h.time}</span>
            <span className="shrink-0" style={{ color: DENSITY.accentCyan, width: 28, fontSize: DENSITY.fontSizeTiny }}>{h.src}</span>
            <span className="shrink-0" style={{ color: DENSITY.textMuted, width: 44, fontSize: '8px' }}>{h.tag}</span>
            {h.urgency === 'flash' && <span style={{ color: '#fff', background: DENSITY.accentRed, fontSize: '8px', fontWeight: 700, padding: '0 2px', flexShrink: 0 }}>FLASH</span>}
            {h.urgency === 'top' && <span style={{ color: DENSITY.accentRed, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, flexShrink: 0 }}>TOP</span>}
            <span className="flex-1" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, lineHeight: 1.1 }}>{h.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FnCN({ panelIdx }: { panelIdx: number }) {
  // Reuse TOP with a thin company-specific filter framing
  return <FnTOP panelIdx={panelIdx} />;
}
