'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';
import { MNEMONIC_DEFS } from './MnemonicRegistry';
import type { MarketSector } from './panelState';

const SECURITIES = [
  { sym: 'AAPL US Equity', name: 'Apple Inc', sector: 'EQUITY', desc: 'Consumer hardware + services ecosystem' },
  { sym: 'MSFT US Equity', name: 'Microsoft Corp', sector: 'EQUITY', desc: 'Enterprise cloud + productivity leader' },
  { sym: 'NVDA US Equity', name: 'NVIDIA Corp', sector: 'EQUITY', desc: 'Semiconductor + AI computing platform' },
  { sym: 'GOOGL US Equity', name: 'Alphabet Inc', sector: 'EQUITY', desc: 'Search, cloud, advertising conglomerate' },
  { sym: 'AMZN US Equity', name: 'Amazon.com', sector: 'EQUITY', desc: 'E-commerce + cloud (AWS) leader' },
  { sym: 'META US Equity', name: 'Meta Platforms', sector: 'EQUITY', desc: 'Social media + AR/VR investments' },
  { sym: 'TSLA US Equity', name: 'Tesla Inc', sector: 'EQUITY', desc: 'EV manufacturer + energy storage' },
  { sym: 'JPM US Equity', name: 'JPMorgan Chase', sector: 'EQUITY', desc: 'Largest US bank by assets' },
  { sym: 'BAC US Equity', name: 'Bank of America', sector: 'EQUITY', desc: 'Consumer + investment banking' },
  { sym: 'GS US Equity', name: 'Goldman Sachs', sector: 'EQUITY', desc: 'Investment bank + asset management' },
  { sym: 'XOM US Equity', name: 'ExxonMobil Corp', sector: 'EQUITY', desc: 'Integrated oil and gas major' },
  { sym: 'CVX US Equity', name: 'Chevron Corp', sector: 'EQUITY', desc: 'Global energy company' },
  { sym: 'WMT US Equity', name: 'Walmart Inc', sector: 'EQUITY', desc: 'World\'s largest retailer' },
  { sym: 'IBM US Equity', name: 'IBM Corp', sector: 'EQUITY', desc: 'Enterprise IT services and cloud' },
  { sym: 'INTC US Equity', name: 'Intel Corp', sector: 'EQUITY', desc: 'Semiconductor manufacturer' },
  { sym: 'AMD US Equity', name: 'AMD Inc', sector: 'EQUITY', desc: 'CPU and GPU semiconductor' },
  { sym: 'SPX Index', name: 'S&P 500', sector: 'INDEX', desc: 'US large-cap equity benchmark' },
  { sym: 'INDU Index', name: 'Dow Jones 30', sector: 'INDEX', desc: 'US price-weighted blue chip index' },
  { sym: 'CCMP Index', name: 'NASDAQ Composite', sector: 'INDEX', desc: 'US tech-heavy composite index' },
  { sym: 'EURUSD Curncy', name: 'EUR/USD', sector: 'CURNCY', desc: 'Euro vs US Dollar spot rate' },
  { sym: 'GBPUSD Curncy', name: 'GBP/USD', sector: 'CURNCY', desc: 'Sterling vs US Dollar spot rate' },
  { sym: 'USDJPY Curncy', name: 'USD/JPY', sector: 'CURNCY', desc: 'US Dollar vs Japanese Yen' },
  { sym: 'CL1 Comdty', name: 'WTI Crude Oil', sector: 'COMDTY', desc: 'Front-month crude oil futures' },
  { sym: 'GC1 Comdty', name: 'Gold Futures', sector: 'COMDTY', desc: 'Front-month gold futures' },
  { sym: 'AAPL 2.5 05/25', name: 'Apple 2.5% 05/2025', sector: 'CORP', desc: 'Apple Inc investment-grade bond' },
  { sym: 'T US Corp', name: 'AT&T 4.5 2030', sector: 'CORP', desc: 'AT&T Inc corporate bond' },
];

type ResultItem =
  | { kind: 'security'; sym: string; name: string; sector: string; desc: string }
  | { kind: 'function'; code: string; title: string; category: string; helpText: string };

export function HLSearchOverlay({ panelIdx }: { panelIdx: number }) {
  const { dispatchPanel, navigatePanel, panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toUpperCase();
    if (!q) {
      // Show popular functions + recent securities when no query
      const fns: ResultItem[] = Object.values(MNEMONIC_DEFS).slice(0, 8).map((m) => ({
        kind: 'function', code: m.code, title: m.title, category: m.layoutType, helpText: `${m.relatedCodes.join(' ')}`,
      }));
      const secs: ResultItem[] = SECURITIES.slice(0, 6).map((s) => ({ kind: 'security', ...s }));
      return [...fns, ...secs];
    }
    const fnRes: ResultItem[] = Object.values(MNEMONIC_DEFS)
      .filter((m) => m.code.includes(q) || m.title.toUpperCase().includes(q))
      .slice(0, 8).map((m) => ({ kind: 'function', code: m.code, title: m.title, category: m.layoutType, helpText: m.relatedCodes.join(' ') }));
    const secRes: ResultItem[] = SECURITIES
      .filter((s) => s.sym.toUpperCase().includes(q) || s.name.toUpperCase().includes(q))
      .slice(0, 10).map((s) => ({ kind: 'security', ...s }));
    return [...fnRes, ...secRes];
  }, [query]);

  useEffect(() => { setCursor(0); }, [results.length]);

  const select = useCallback((item: ResultItem) => {
    if (item.kind === 'function') {
      navigatePanel(panelIdx, item.code);
    } else {
      navigatePanel(panelIdx, p.activeMnemonic, item.sym, item.sector as MarketSector);
    }
    dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' });
  }, [panelIdx, p.activeMnemonic, navigatePanel, dispatchPanel]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' }); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); return; }
    if (e.key === 'Enter') { e.preventDefault(); if (results[cursor]) select(results[cursor]!); return; }
  }, [panelIdx, dispatchPanel, results, cursor, select]);

  return (
    <div className="absolute inset-0 z-40" style={{ background: '#000000e8', fontFamily: DENSITY.fontFamily }}>
      <div style={{ padding: DENSITY.pad4, borderBottom: `1px solid ${DENSITY.borderColor}` }}>
        <div style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, marginBottom: 2 }}>HL — SECURITY / FUNCTION SEARCH</div>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type security name, ticker, or function code..."
          className="w-full outline-none border-none bg-transparent"
          style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, borderBottom: `1px solid ${DENSITY.borderColor}`, paddingBottom: 2 }}
          autoComplete="off"
        />
      </div>

      {/* Column headers */}
      <div className="grid" style={{ gridTemplateColumns: '30px 1fr 2fr 80px', padding: `1px ${DENSITY.pad4}px`, fontSize: DENSITY.fontSizeTiny, color: DENSITY.textMuted, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <span>T</span><span>CODE / TICKER</span><span>NAME / DESCRIPTION</span><span>CATEGORY</span>
      </div>

      <div style={{ overflowY: 'auto', maxHeight: 'calc(100% - 80px)' }}>
        {results.map((item, i) => {
          const isCur = i === cursor;
          return (
            <div
              key={item.kind === 'function' ? `fn-${item.code}` : `sec-${item.sym}`}
              className="grid cursor-pointer"
              style={{
                gridTemplateColumns: '30px 1fr 2fr 80px',
                height: DENSITY.rowHeightPx + 2,
                background: isCur ? '#1a2a3a' : i % 2 === 1 ? '#060606' : DENSITY.bgBase,
                borderBottom: `1px solid ${DENSITY.gridlineColor}`,
                alignItems: 'center',
                padding: `0 ${DENSITY.pad4}px`,
              }}
              onMouseEnter={() => setCursor(i)}
              onClick={() => select(item)}
            >
              <span style={{ fontSize: DENSITY.fontSizeTiny, color: item.kind === 'function' ? DENSITY.accentAmber : DENSITY.accentCyan }}>
                {item.kind === 'function' ? 'fn' : '→'}
              </span>
              <span style={{ fontSize: DENSITY.fontSizeDefault, color: DENSITY.textPrimary, fontWeight: 700 }}>
                {item.kind === 'function' ? item.code : item.sym}
              </span>
              <span className="truncate" style={{ fontSize: DENSITY.fontSizeTiny, color: DENSITY.textDim }}>
                {item.kind === 'function' ? item.title : item.name + ' — ' + item.desc}
              </span>
              <span style={{ fontSize: DENSITY.fontSizeTiny, color: DENSITY.textMuted }}>
                {item.kind === 'function' ? item.category : item.sector}
              </span>
            </div>
          );
        })}
        {results.length === 0 && (
          <div style={{ padding: DENSITY.pad4, color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>No results for "{query}"</div>
        )}
      </div>
      <div style={{ padding: `2px ${DENSITY.pad4}px`, color: DENSITY.textMuted, fontSize: '8px', borderTop: `1px solid ${DENSITY.gridlineColor}`, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        ↑↓ navigate  •  Enter select  •  Esc close  •  Type to search
      </div>
    </div>
  );
}
