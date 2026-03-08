'use client';

import React, {
  useRef, useEffect, useCallback, useState, useMemo,
} from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { useTerminalOS } from './TerminalOSContext';
import type { MarketSector } from './panelState';
import { MNEMONIC_DEFS } from './MnemonicRegistry';
import { saveWorkspace, loadWorkspace } from './workspaceManager';

// ── universe for autocomplete ─────────────────────────────────────────────────
const SECURITY_UNIVERSE = [
  { sym: 'AAPL US Equity', name: 'Apple Inc', sector: 'EQUITY' },
  { sym: 'MSFT US Equity', name: 'Microsoft Corp', sector: 'EQUITY' },
  { sym: 'NVDA US Equity', name: 'NVIDIA Corp', sector: 'EQUITY' },
  { sym: 'GOOGL US Equity', name: 'Alphabet Inc', sector: 'EQUITY' },
  { sym: 'AMZN US Equity', name: 'Amazon.com', sector: 'EQUITY' },
  { sym: 'META US Equity', name: 'Meta Platforms', sector: 'EQUITY' },
  { sym: 'TSLA US Equity', name: 'Tesla Inc', sector: 'EQUITY' },
  { sym: 'JPM US Equity', name: 'JPMorgan Chase', sector: 'EQUITY' },
  { sym: 'BAC US Equity', name: 'Bank of America', sector: 'EQUITY' },
  { sym: 'GS US Equity', name: 'Goldman Sachs', sector: 'EQUITY' },
  { sym: 'MS US Equity', name: 'Morgan Stanley', sector: 'EQUITY' },
  { sym: 'WFC US Equity', name: 'Wells Fargo', sector: 'EQUITY' },
  { sym: 'IBM US Equity', name: 'IBM Corp', sector: 'EQUITY' },
  { sym: 'INTC US Equity', name: 'Intel Corp', sector: 'EQUITY' },
  { sym: 'AMD US Equity', name: 'AMD Inc', sector: 'EQUITY' },
  { sym: 'AVGO US Equity', name: 'Broadcom Inc', sector: 'EQUITY' },
  { sym: 'CRM US Equity', name: 'Salesforce', sector: 'EQUITY' },
  { sym: 'ORCL US Equity', name: 'Oracle Corp', sector: 'EQUITY' },
  { sym: 'ADBE US Equity', name: 'Adobe Inc', sector: 'EQUITY' },
  { sym: 'NFLX US Equity', name: 'Netflix Inc', sector: 'EQUITY' },
  { sym: 'DIS US Equity', name: 'Walt Disney Co', sector: 'EQUITY' },
  { sym: 'WMT US Equity', name: 'Walmart Inc', sector: 'EQUITY' },
  { sym: 'XOM US Equity', name: 'ExxonMobil Corp', sector: 'EQUITY' },
  { sym: 'CVX US Equity', name: 'Chevron Corp', sector: 'EQUITY' },
  { sym: 'SPX Index', name: 'S&P 500 Index', sector: 'INDEX' },
  { sym: 'INDU Index', name: 'Dow Jones Industrial', sector: 'INDEX' },
  { sym: 'CCMP Index', name: 'NASDAQ Composite', sector: 'INDEX' },
  { sym: 'EURUSD Curncy', name: 'EUR/USD', sector: 'CURNCY' },
  { sym: 'GBPUSD Curncy', name: 'GBP/USD', sector: 'CURNCY' },
  { sym: 'USDJPY Curncy', name: 'USD/JPY', sector: 'CURNCY' },
  { sym: 'T US Corp', name: 'AT&T Inc 4.5 2030', sector: 'CORP' },
  { sym: 'AAPL 2.5 05/25', name: 'Apple 2.5% 2025 Bond', sector: 'CORP' },
  { sym: 'CL1 Comdty', name: 'WTI Crude Oil Futures', sector: 'COMDTY' },
  { sym: 'GC1 Comdty', name: 'Gold Futures', sector: 'COMDTY' },
  { sym: 'NG1 Comdty', name: 'Natural Gas Futures', sector: 'COMDTY' },
];

const MNEMONIC_LIST = Object.values(MNEMONIC_DEFS).map((m) => ({
  code: m.code,
  title: m.title,
}));

interface SuggestItem {
  kind: 'security' | 'mnemonic';
  code: string;
  label: string;
  sub: string;
}

function getSuggestions(input: string): SuggestItem[] {
  const q = input.trim().toUpperCase();
  if (!q) return [];

  const secMatches = SECURITY_UNIVERSE.filter(
    (s) => s.sym.toUpperCase().includes(q) || s.name.toUpperCase().includes(q),
  ).slice(0, 8).map((s) => ({ kind: 'security' as const, code: s.sym, label: s.sym, sub: s.name }));

  const mnMatches = MNEMONIC_LIST.filter(
    (m) => m.code.startsWith(q) || m.title.toUpperCase().includes(q),
  ).slice(0, 6).map((m) => ({ kind: 'mnemonic' as const, code: m.code, label: m.code, sub: m.title }));

  return [...secMatches, ...mnMatches].slice(0, 12);
}

const KNOWN_MNEMONICS = new Set(MNEMONIC_LIST.map((m) => m.code));

const SECTOR_KEYS: Record<string, MarketSector> = {
  EQUITY: 'EQUITY', CORP: 'CORP', CURNCY: 'CURNCY', COMDTY: 'COMDTY',
  INDEX: 'INDEX', GOVT: 'GOVT', MUNI: 'MUNI', MTGE: 'MTGE',
};

export interface ParsedGo {
  security?: string;
  mnemonic?: string;
  sector?: MarketSector;
  timeframe?: string;
}

export function parseGoCommand(input: string, _currentSecurity: string, _currentMnemonic: string): ParsedGo {
  const raw = input.toUpperCase().replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = raw.split(' ').filter(Boolean);
  if (tokens[tokens.length - 1] === 'GO') tokens.pop();
  if (tokens.length === 0) return {};

  const tf = tokens.find((t) => /^(1D|5D|1M|3M|6M|1Y|3Y|5Y|10Y|YTD|MAX)$/.test(t));
  const filtered = tokens.filter((t) => t !== tf);

  let mnemonic: string | undefined;
  let sector: MarketSector | undefined;
  const secTokens: string[] = [];

  for (const t of filtered) {
    if (KNOWN_MNEMONICS.has(t) && !mnemonic) { mnemonic = t; continue; }
    if (SECTOR_KEYS[t] && !sector) { sector = SECTOR_KEYS[t]; continue; }
    secTokens.push(t);
  }

  let security: string | undefined;
  if (secTokens.length > 0) {
    security = secTokens.join(' ');
    if (sector) security += ` ${sector}`;
    else if (
      !security.includes('Equity') && !security.includes('Curncy') &&
      !security.includes('Index') && !security.includes('Corp') &&
      !security.includes('Comdty')
    ) {
      security += ' Equity';
    }
  }

  return { security, mnemonic, sector, timeframe: tf };
}

const COMMAND_INPUT_IDS = ['terminal-cmd-0', 'terminal-cmd-1', 'terminal-cmd-2', 'terminal-cmd-3'];

export function PanelCommandLine({ panelIdx, isFocused }: { panelIdx: number; isFocused: boolean }) {
  const { panels, dispatchPanel, navigatePanel, setFocusedPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestIdx, setSuggestIdx] = useState(0);
  const suggestRef = useRef<HTMLDivElement>(null);
  const f1TimerRef = useRef<number>(0);

  const suggestions = useMemo(
    () => (suggestOpen ? getSuggestions(p.commandInput) : []),
    [p.commandInput, suggestOpen],
  );

  // Focus command line when panel gains focus
  useEffect(() => {
    if (isFocused) inputRef.current?.focus();
  }, [isFocused]);

  // Global Ctrl+L = focus command line of focused panel
  useEffect(() => {
    if (!isFocused) return;
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isFocused]);

  const executeGo = useCallback(() => {
    const raw = p.commandInput.trim().toUpperCase();
    setSuggestOpen(false);

    if (raw === 'MENU' || raw === 'MENU GO') {
      dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'menu' });
      dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
      return;
    }
    if (raw === 'HELP' || raw === 'HELP GO') {
      dispatchPanel(panelIdx, { type: 'PRESS_HELP' });
      dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
      return;
    }
    if (raw === 'HL' || raw === 'HL GO' || raw === 'SEARCH' || raw === 'SEARCH GO') {
      dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'search' });
      dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
      return;
    }
    if (raw === 'GRAB' || raw === 'GRAB GO') {
      // Export: open panel HTML to new tab (stub)
      const json = JSON.stringify({
        panel: panelIdx + 1,
        security: p.activeSecurity,
        mnemonic: p.activeMnemonic,
        timeframe: p.timeframe,
        ts: new Date().toISOString(),
      }, null, 2);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<pre style="background:#000;color:#e6e6e6;font:11px monospace;padding:8px">${json}</pre>`);
        w.document.title = `GRAB P${panelIdx + 1}`;
      }
      dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
      return;
    }
    if (raw.startsWith('WS ')) {
      const wsName = raw.replace(/\s+GO$/, '').slice(3).trim();
      if (wsName) {
        try {
          const existing = loadWorkspace(wsName);
          if (existing) {
            existing.panels.forEach((panelSnap, idx) => {
              if (idx < 4) navigatePanel(idx, panelSnap.activeMnemonic, panelSnap.activeSecurity, panelSnap.marketSector as MarketSector);
            });
          } else {
            saveWorkspace(wsName, {
              panels: panels.map((pp) => ({
                activeSecurity: pp.activeSecurity,
                activeMnemonic: pp.activeMnemonic,
                marketSector: pp.marketSector,
                timeframe: pp.timeframe,
                scrollPosition: pp.scrollPosition,
                selectionCursor: pp.selectionCursor,
                historyLength: pp.history.length,
              })),
            });
          }
        } catch { /* ignore */ }
      }
      dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
      return;
    }

    const parsed = parseGoCommand(p.commandInput, p.activeSecurity, p.activeMnemonic);
    if (!parsed.mnemonic && !parsed.security && !parsed.timeframe) return;

    if (parsed.timeframe && !parsed.mnemonic && !parsed.security) {
      dispatchPanel(panelIdx, { type: 'SET_TIMEFRAME', tf: parsed.timeframe });
      dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
      return;
    }

    const mn = parsed.mnemonic ?? p.activeMnemonic;
    const sec = parsed.security ?? p.activeSecurity;
    const sector = parsed.sector ?? p.marketSector;
    navigatePanel(panelIdx, mn, sec, sector);
    if (parsed.timeframe) dispatchPanel(panelIdx, { type: 'SET_TIMEFRAME', tf: parsed.timeframe });
  }, [p.commandInput, p.activeSecurity, p.activeMnemonic, p.marketSector, p.timeframe, panelIdx, panels, dispatchPanel, navigatePanel]);

  const selectSuggestion = useCallback((item: SuggestItem) => {
    if (item.kind === 'mnemonic') {
      navigatePanel(panelIdx, item.code);
    } else {
      const parsed = parseGoCommand(item.code, p.activeSecurity, p.activeMnemonic);
      const mn = parsed.mnemonic ?? p.activeMnemonic;
      navigatePanel(panelIdx, mn, item.code, (parsed.sector ?? p.marketSector));
    }
    dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
    setSuggestOpen(false);
  }, [panelIdx, p.activeSecurity, p.activeMnemonic, p.marketSector, dispatchPanel, navigatePanel]);

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // F1 = HELP (double-tap within 600ms = HELP DESK)
    if (e.key === 'F1') {
      e.preventDefault();
      const now = Date.now();
      if (now - f1TimerRef.current < 600) {
        dispatchPanel(panelIdx, { type: 'PRESS_HELP' }); // second press → help-desk
      } else {
        dispatchPanel(panelIdx, { type: 'PRESS_HELP' });
      }
      f1TimerRef.current = now;
      return;
    }
    // F2 = MENU
    if (e.key === 'F2') {
      e.preventDefault();
      dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: p.overlayMode === 'menu' ? 'none' : 'menu' });
      return;
    }
    // Ctrl+K = SEARCH/HL
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'search' });
      return;
    }
    // Ctrl+B = back
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      dispatchPanel(panelIdx, { type: 'GO_BACK' });
      return;
    }
    // Ctrl+Shift+B = forward
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      dispatchPanel(panelIdx, { type: 'GO_FORWARD' });
      return;
    }
    // Enter = GO (or select suggestion)
    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestOpen && suggestions.length > 0 && suggestIdx < suggestions.length) {
        selectSuggestion(suggestions[suggestIdx]!);
      } else {
        executeGo();
      }
      return;
    }
    // Escape = CANCEL
    if (e.key === 'Escape') {
      e.preventDefault();
      setSuggestOpen(false);
      if (p.overlayMode !== 'none') {
        dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'none' });
        return;
      }
      dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: '' });
      return;
    }
    // Arrow keys navigate suggestions
    if (e.key === 'ArrowDown' && suggestOpen) {
      e.preventDefault();
      setSuggestIdx((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp' && suggestOpen) {
      e.preventDefault();
      setSuggestIdx((i) => Math.max(i - 1, 0));
      return;
    }
    // Tab = accept top suggestion
    if (e.key === 'Tab' && suggestOpen && suggestions.length > 0) {
      e.preventDefault();
      selectSuggestion(suggestions[suggestIdx] ?? suggestions[0]!);
      return;
    }
  }, [executeGo, selectSuggestion, suggestOpen, suggestions, suggestIdx, p.overlayMode, panelIdx, dispatchPanel]);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    dispatchPanel(panelIdx, { type: 'SET_COMMAND_INPUT', value: v });
    setSuggestOpen(v.trim().length > 0);
    setSuggestIdx(0);
  }, [panelIdx, dispatchPanel]);

  const hasSuggestions = suggestOpen && suggestions.length > 0;

  return (
    <div className="flex-none relative" style={{ zIndex: 10, fontFamily: DENSITY.fontFamily }}>
      <div
        className="flex items-center"
        style={{ height: DENSITY.commandBarHeightPx, background: '#111', borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px` }}
      >
        <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeMicro, marginRight: 4, fontWeight: 700 }}>
          {panelIdx + 1}&gt;
        </span>
        <input
          id={COMMAND_INPUT_IDS[panelIdx]}
          ref={inputRef}
          value={p.commandInput}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => { setFocusedPanel(panelIdx); if (p.commandInput) setSuggestOpen(true); }}
          placeholder={`${p.activeSecurity} ${p.activeMnemonic} GO  •  F1=HELP  F2=MENU  Ctrl+K=SEARCH`}
          className="flex-1 bg-transparent outline-none border-none truncate"
          style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault }}
          autoComplete="off"
          spellCheck={false}
        />
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, marginLeft: 4, flexShrink: 0 }}>
          {p.timeframe} {p.linkGroup ? `[${p.linkGroup.toUpperCase()}]` : ''}
        </span>
      </div>

      {/* Autocomplete dropdown */}
      {hasSuggestions && (
        <div
          ref={suggestRef}
          className="absolute left-0 right-0"
          style={{ top: DENSITY.commandBarHeightPx, background: '#0a0a0a', border: `1px solid ${DENSITY.borderColor}`, borderTop: 'none', zIndex: 50, maxHeight: 200, overflowY: 'auto' }}
        >
          {suggestions.map((s, i) => (
            <div
              key={`${s.kind}-${s.code}`}
              className="flex items-center gap-2 cursor-pointer"
              style={{ height: DENSITY.rowHeightPx + 2, padding: `0 ${DENSITY.pad4}px`, background: i === suggestIdx ? '#1a2a3a' : 'transparent', borderBottom: `1px solid ${DENSITY.gridlineColor}` }}
              onMouseEnter={() => setSuggestIdx(i)}
              onClick={() => selectSuggestion(s)}
            >
              <span style={{ color: s.kind === 'mnemonic' ? DENSITY.accentAmber : DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, width: 16 }}>
                {s.kind === 'mnemonic' ? 'fn' : '→'}
              </span>
              <span style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, fontWeight: 700, width: 120, flexShrink: 0 }}>{s.label}</span>
              <span style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>{s.sub}</span>
            </div>
          ))}
          <div style={{ padding: `1px ${DENSITY.pad4}px`, color: DENSITY.textMuted, fontSize: '8px', borderTop: `1px solid ${DENSITY.gridlineColor}` }}>
            ↑↓ navigate  •  Enter/Tab select  •  Esc close
          </div>
        </div>
      )}
    </div>
  );
}
