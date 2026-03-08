'use client';

import React, { useMemo } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { KeyValueGrid, PanelSubHeader, StatusBadge, type KVPair } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { useDrill } from '../entities/DrillContext';
import { makeSecurity, makeSector, makeField } from '../entities/types';

function h(s: string) { return Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0); }
function fmtB(n: number) { return n >= 1e12 ? (n / 1e12).toFixed(2) + 'T' : n >= 1e9 ? (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n.toLocaleString(); }

const SUMMARIES = [
  'Global technology and consumer platform company with diversified revenue streams across hardware, software, and services.',
  'Enterprise cloud and productivity software leader with strong recurring revenue and expanding AI capabilities.',
  'Semiconductor and AI computing platform company driving accelerated computing adoption worldwide.',
  'Diversified financial services holding company with operations in banking, insurance, and investments.',
];

export function FnDES({ panelIdx }: { panelIdx: number }) {
  const { panels, navigatePanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const sec = p.activeSecurity;
  const ticker = sec.split(' ')[0] ?? 'AAPL';

  const data = useMemo(() => {
    const seed = h(ticker);
    const mcap = 500e9 + (seed % 30) * 100e9;
    const pe = 15 + (seed % 25);
    const shares = mcap / (100 + (seed % 200));
    return {
      ticker,
      name: `${ticker} Inc`,
      exchange: seed % 2 === 0 ? 'NASDAQ' : 'NYSE',
      sector: 'Technology',
      industry: 'Software & Services',
      mcap,
      pe,
      eps: (100 + seed % 200) / pe,
      divYield: (1 + (seed % 40)) / 10,
      shares,
      avgVol: 30e6 + (seed % 50) * 1e6,
      beta: 0.8 + (seed % 15) / 10,
      high52: 100 + seed % 200 + 30,
      low52: 100 + seed % 200 - 50,
      summary: SUMMARIES[seed % SUMMARIES.length]!,
      relatedBonds: [`${ticker} 2.5 05/25`, `${ticker} 3.1 08/27`],
      relatedOptions: [`${ticker} 180C 06/21`],
      peers: ['MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'CRM', 'ORCL', 'ADBE'].filter((t) => t !== ticker),
    };
  }, [ticker]);

  const pairs: KVPair[] = [
    { label: 'Market Cap', value: fmtB(data.mcap), entity: makeField('MARKET_CAP', data.mcap) },
    { label: 'P/E Ratio', value: data.pe.toFixed(1) + 'x', entity: makeField('PE_RATIO', data.pe) },
    { label: 'EPS (TTM)', value: '$' + data.eps.toFixed(2), entity: makeField('EPS', data.eps) },
    { label: 'Div Yield', value: data.divYield.toFixed(2) + '%', entity: makeField('DIV_YIELD', data.divYield) },
    { label: 'Shares Out', value: fmtB(data.shares), entity: makeField('SHARES_OUT', data.shares) },
    { label: 'Avg Vol', value: fmtB(data.avgVol), entity: makeField('AVG_VOL', data.avgVol) },
    { label: 'Beta', value: data.beta.toFixed(2), entity: makeField('BETA', data.beta) },
    { label: '52W High', value: data.high52.toFixed(2), entity: makeField('52W_HIGH', data.high52) },
    { label: '52W Low', value: data.low52.toFixed(2), entity: makeField('52W_LOW', data.low52) },
    { label: 'Exchange', value: data.exchange },
    { label: 'Sector', value: data.sector, entity: makeSector(data.sector) },
    { label: 'Industry', value: data.industry },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`DES • ${data.name} (${data.ticker})`} right={<StatusBadge label="SIM" variant="sim" />} />
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        <KeyValueGrid pairs={pairs} columns={2} panelIdx={panelIdx} />
        <div style={{ padding: DENSITY.pad4, borderTop: `1px solid ${DENSITY.borderColor}` }}>
          <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase', marginBottom: 2 }}>Business Summary</div>
          <div style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily, lineHeight: 1.3 }}>{data.summary}</div>
        </div>
        <div style={{ padding: DENSITY.pad4, borderTop: `1px solid ${DENSITY.borderColor}` }}>
          <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase', marginBottom: 2 }}>Related Securities</div>
          <div className="flex flex-wrap gap-1">
            {[...data.relatedBonds, ...data.relatedOptions].map((s) => {
              const ent = makeSecurity(s + ' Corp', s);
              return (
                <button key={s} type="button" className="px-1 hover:text-white"
                  style={{ border: `1px solid ${DENSITY.borderColor}`, background: DENSITY.bgSurface, color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily, cursor: 'pointer' }}
                  onClick={(e) => { const intent = e.shiftKey ? 'OPEN_IN_NEW_PANEL' as const : 'OPEN_IN_PLACE' as const; navigatePanel(panelIdx, 'DES', s + ' Corp', 'CORP'); }}
                >{s}</button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: DENSITY.pad4, borderTop: `1px solid ${DENSITY.borderColor}` }}>
          <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, textTransform: 'uppercase', marginBottom: 2 }}>Peers</div>
          <div className="flex flex-wrap gap-1">
            {data.peers.map((t) => {
              const ent = makeSecurity(`${t} US Equity`, t);
              return (
                <button key={t} type="button" className="px-1 hover:text-white"
                  style={{ border: `1px solid ${DENSITY.borderColor}`, background: DENSITY.bgSurface, color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily, cursor: 'pointer' }}
                  onClick={(e) => { const intent = e.shiftKey ? 'OPEN_IN_NEW_PANEL' as const : 'OPEN_IN_PLACE' as const; /* use drill */ navigatePanel(panelIdx, 'DES', `${t} US Equity`); }}
                >{t}</button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
