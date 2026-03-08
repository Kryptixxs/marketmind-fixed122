'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useTerminalStore } from '../store/TerminalStore';
import { usePanelFocus } from '../context/PanelFocusContext';
import { getSuggestions } from '../services/MnemonicEngine';
import { useTerminalContextMenu } from '../context/TerminalContextMenuContext';
import { parseTerminalCommand, type YellowKey } from '../services/terminalParser';
import { addAlertRule } from '../services/alertMonitor';
import { searchSecurityMaster } from '../services/securityMaster';
import { useTerminalLayout } from '../context/TerminalLayoutContext';
import { loadWorkspace, saveWorkspace, workspaceExists } from '../services/workspaceManager';
import type { PanelFunction } from '../context/PanelFocusContext';

export const COMMAND_CENTER_INPUT_ID = 'command-center-input';

function terminalBeep() {
  try {
    const AudioCtx = (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    g.gain.value = 0.015;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.06);
  } catch {
    // ignore beep failures
  }
}

/** Map FunctionCode from parseCommand to PanelFunction */
function toPanelFunction(code: string): PanelFunction {
  const c = code.toUpperCase();
  const valid: PanelFunction[] = ['WEI', 'GP', 'N', 'MKT', 'EXEC', 'DES', 'FA', 'HP', 'YAS', 'OVME', 'PORT', 'NEWS', 'CAL', 'SEC', 'INTEL', 'IMAP', 'ECO', 'FXC', 'GC', 'IB'];
  if (valid.includes(c as PanelFunction)) return c as PanelFunction;
  if (c === 'GIP' || c === 'GCDS') return 'MKT';
  if (c === 'CN') return 'NEWS';
  if (c === 'TOP') return 'N';
  if (c === 'ANR') return 'MKT';
  if (c === 'DVD' || c === 'MGMT' || c === 'OWN' || c === 'RELS') return 'DES';
  if (c === 'OQ') return 'OVME';
  return 'MKT';
}

export function CommandCenterBar() {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const { state, dispatch } = useTerminalStore();
  const { registerExecuteCommand } = useTerminalContextMenu() ?? {};
  const { zoomedQuadrant, setZoomedQuadrant, panelSizes, setPanelSizes } = useTerminalLayout();
  const {
    activePanelIndex,
    panelFunctions,
    panelLinkGroups,
    quadrantStates,
    setPanelFunction,
    setPanelFunctions,
    setQuadrantState,
    pushPanelState,
    popPanelState,
  } = usePanelFocus();
  const activeFunction = activePanelIndex !== null ? panelFunctions[activePanelIndex] ?? 'MKT' : 'MKT';

  const historyRef = useRef<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isInvalidCommand, setIsInvalidCommand] = useState(false);
  const [yellowKeyMode, setYellowKeyMode] = useState<YellowKey>('EQUITY');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vantage-command-history');
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      historyRef.current = parsed.slice(-20);
    } catch {
      // ignore
    }
  }, []);

  const displayValue = useMemo(() => {
    const parts = state.commandInput.trim().split(/\s+/);
    if (parts[parts.length - 1]?.toUpperCase() === 'GO') parts.pop();
    return parts.join(' ') || state.activeSymbol;
  }, [state.commandInput, state.activeSymbol]);

  const suggestionPrefix = useMemo(() => {
    const tokens = state.commandInput.trim().split(/\s+/);
    if (tokens[tokens.length - 1]?.toUpperCase() === 'GO') tokens.pop();
    return tokens.length >= 2 ? (tokens[tokens.length - 2] ?? '') : tokens[0] ?? '';
  }, [state.commandInput]);

  const suggestions = useMemo(() => {
    const mnemonic = getSuggestions(suggestionPrefix).map((m) => ({
      key: `m-${m.code}`,
      code: m.code,
      label: m.label,
      kind: 'mnemonic' as const,
    }));
    const sec = searchSecurityMaster(displayValue).map((s) => ({
      key: `s-${s.symbol}`,
      code: s.symbol,
      label: `${s.securityName} • ${s.assetClass}`,
      kind: 'security' as const,
    }));
    return [...mnemonic, ...sec].slice(0, 14);
  }, [suggestionPrefix, displayValue]);

  const executeCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim().toUpperCase();
      if (!trimmed) return;

      if (trimmed === 'GRAB' || trimmed === 'GRAB GO') {
        const data = state.quotes.slice(0, 50).map((q) => ({
          symbol: q.symbol,
          name: q.name,
          last: q.last,
          pct: q.pct,
          abs: q.abs,
          high: q.high,
          low: q.low,
          volumeM: q.volumeM,
        }));
        const json = JSON.stringify(data, null, 2);
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(`<pre style="margin:0;padding:12px;font:11px monospace;background:#000;color:#FFF;">${json.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`);
          w.document.title = 'GRAB Export';
        }
        return;
      }

      if (trimmed.startsWith('W ')) {
        const wsName = trimmed.replace(/\s+GO$/, '').slice(2).trim();
        if (wsName) {
          if (workspaceExists(wsName)) {
            const loaded = loadWorkspace(wsName);
            if (loaded) {
              setPanelFunctions(loaded.panelFunctions);
              setZoomedQuadrant(loaded.zoomedQuadrant as 0 | 1 | 2 | 3 | null);
              setPanelSizes(loaded.panelSizes);
            }
          } else {
            saveWorkspace(wsName, { panelFunctions, zoomedQuadrant, panelSizes });
          }
        }
        dispatch({ type: 'SET_COMMAND', payload: '' });
        return;
      }

      if (trimmed.startsWith('ALERT IF ')) {
        const rule = addAlertRule(trimmed.replace(/\s+GO$/, ''));
        if (!rule) {
          setIsInvalidCommand(true);
          setTimeout(() => setIsInvalidCommand(false), 220);
          return;
        }
        dispatch({ type: 'SET_COMMAND', payload: '' });
        return;
      }

      const currentQuadrant = activePanelIndex !== null ? quadrantStates[activePanelIndex] : undefined;
      const parsedCli = parseTerminalCommand(trimmed, yellowKeyMode, currentQuadrant?.activeMnemonic ?? activeFunction);
      if (!parsedCli.ok) {
        setIsInvalidCommand(true);
        terminalBeep();
        setTimeout(() => setIsInvalidCommand(false), 220);
        return;
      }
      const command = parsedCli.value.normalizedCommand;
      const newFn = toPanelFunction(parsedCli.value.function);
      const symbol = parsedCli.value.normalizedSecurity;

      if (activePanelIndex !== null) {
        pushPanelState(activePanelIndex, activeFunction, state.activeSymbol);
      }
      if (command && command !== 'GRAB GO') {
        const h = historyRef.current;
        if (h[h.length - 1] !== command) {
          h.push(command);
          if (h.length > 20) h.shift();
          try {
            localStorage.setItem('vantage-command-history', JSON.stringify(h));
          } catch {
            // ignore
          }
        }
        setHistoryIndex(-1);
      }
      dispatch({ type: 'TICKER_SELECTED', payload: symbol });
      dispatch({ type: 'SET_COMMAND', payload: command });
      dispatch({ type: 'EXECUTE_COMMAND', payload: command });
      if (activePanelIndex !== null) {
        setPanelFunction(activePanelIndex, newFn);
        const prior = quadrantStates[activePanelIndex]!;
        setQuadrantState(activePanelIndex, {
          loadedSecurity: `${parsedCli.value.ticker} ${parsedCli.value.market} ${parsedCli.value.sector}`,
          activeMnemonic: parsedCli.value.function,
          history: parsedCli.value.function !== prior.activeMnemonic
            ? [...prior.history, prior.activeMnemonic].slice(-20)
            : prior.history,
          sector: parsedCli.value.sector,
        });
        const activeLink = panelLinkGroups[activePanelIndex];
        if (activeLink) {
          panelLinkGroups.forEach((group, idx) => {
            if (idx === activePanelIndex || group !== activeLink) return;
            const target = quadrantStates[idx]!;
            setQuadrantState(idx, {
              ...target,
              loadedSecurity: `${parsedCli.value.ticker} ${parsedCli.value.market} ${parsedCli.value.sector}`,
              sector: parsedCli.value.sector,
            });
          });
        }
      }
    },
    [state.quotes, state.activeSymbol, activeFunction, activePanelIndex, panelFunctions, quadrantStates, panelLinkGroups, yellowKeyMode, setPanelFunction, setPanelFunctions, setQuadrantState, pushPanelState, zoomedQuadrant, setZoomedQuadrant, panelSizes, setPanelSizes, dispatch]
  );

  useEffect(() => {
    if (registerExecuteCommand) {
      return registerExecuteCommand(executeCommand);
    }
  }, [registerExecuteCommand, executeCommand]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleMENU = useCallback(() => {
    if (activePanelIndex === null) return;
    popPanelState(activePanelIndex, (entry) => {
      setPanelFunction(activePanelIndex, entry.fn);
      dispatch({ type: 'TICKER_SELECTED', payload: entry.symbol });
      dispatch({ type: 'SET_COMMAND', payload: `${entry.symbol} ${entry.fn} GO` });
    });
    setShowSuggestions(false);
  }, [activePanelIndex, popPanelState, setPanelFunction, dispatch]);

  const applySuggestion = useCallback(
    (code: string, kind: 'mnemonic' | 'security') => {
      const tokens = displayValue.trim().split(/\s+/);
      const newVal = kind === 'security'
        ? `${code} ${activeFunction}`
        : `${tokens.length > 1 ? tokens.slice(0, -1).join(' ') : state.activeSymbol} ${code}`;
      dispatch({ type: 'SET_COMMAND', payload: `${newVal} GO` });
      setSuggestionIndex(0);
      setShowSuggestions(false);
    },
    [displayValue, state.activeSymbol, activeFunction, dispatch]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(el)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const sectorByF: Record<string, string> = {
        F1: 'EQUITY',
        F2: 'CURNCY',
        F3: 'CMDTY',
        F4: 'INDEX',
        F5: 'GOVT',
        F6: 'CORP',
        F7: 'MUNI',
        F8: 'EQUITY',
        F9: 'COMDTY',
        F10: 'RATE',
        F11: 'VOL',
        F12: 'NEWS',
      };
      if (e.key === 'F2') {
        e.preventDefault();
        setYellowKeyMode('CURNCY');
        if (!displayValue.trim() && activePanelIndex !== null) {
          const prior = quadrantStates[activePanelIndex]!;
          setQuadrantState(activePanelIndex, { ...prior, activeMnemonic: 'MENU', sector: 'CURNCY' });
        }
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        setYellowKeyMode('CMDTY');
        if (!displayValue.trim() && activePanelIndex !== null) {
          const prior = quadrantStates[activePanelIndex]!;
          setQuadrantState(activePanelIndex, { ...prior, activeMnemonic: 'MENU', sector: 'CORP' });
        }
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        setYellowKeyMode('EQUITY');
        if (!displayValue.trim() && activePanelIndex !== null) {
          const prior = quadrantStates[activePanelIndex]!;
          setQuadrantState(activePanelIndex, { ...prior, activeMnemonic: 'MENU', sector: 'EQUITY' });
        }
        return;
      }
      if (sectorByF[e.key]) {
        e.preventDefault();
        const current = displayValue.trim();
        const next = current ? `${current} ${sectorByF[e.key]}` : sectorByF[e.key];
        dispatch({ type: 'SET_COMMAND', payload: next });
        inputRef.current?.focus();
        return;
      }
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const active = document.activeElement as HTMLElement | null;
        if (active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          (inputRef.current || document.getElementById(COMMAND_CENTER_INPUT_ID))?.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [displayValue, activePanelIndex, quadrantStates, setQuadrantState]);

  return (
    <div
      ref={containerRef}
      className="flex-none flex flex-col shrink-0 border-b border-[#333]"
      style={{
        backgroundColor: '#333',
        fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
        fontSize: '11px',
        color: '#FFD700',
      }}
    >
      <div className="h-[28px] flex items-center gap-3 px-3">
        <span className="font-bold uppercase tracking-wider shrink-0" style={{ color: '#FFD700' }}>
          Command Center
        </span>
        <div className={clsx('flex-1 min-w-0 max-w-md relative', isInvalidCommand && 'command-invalid-shake')}>
          <input
            id={COMMAND_CENTER_INPUT_ID}
            ref={inputRef}
            type="text"
            value={isInvalidCommand ? 'INVALID FUNCTION' : displayValue}
            onChange={(e) => {
              const v = e.target.value;
              dispatch({ type: 'SET_COMMAND', payload: v ? `${v} ${activeFunction} GO` : '' });
              setShowSuggestions(true);
              setSuggestionIndex(0);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (suggestions.length > 0 && suggestionIndex >= 0 && suggestionIndex < suggestions.length) {
                  const sel = suggestions[suggestionIndex];
                  const tokens = displayValue.trim().split(/\s+/).filter(Boolean);
                  const base = tokens.length > 1 ? tokens.slice(0, -1).join(' ') : state.activeSymbol;
                  executeCommand(sel.kind === 'security' ? `${sel.code} ${activeFunction}` : `${base} ${sel.code}`);
                  setShowSuggestions(false);
                  setSuggestionIndex(0);
                  return;
                }
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) executeCommand(val);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                if (showSuggestions && suggestions.length > 0) {
                  setShowSuggestions(false);
                } else {
                  handleMENU();
                }
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (showSuggestions && suggestions.length > 0) {
                  setSuggestionIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
                } else {
                  const h = historyRef.current;
                  if (h.length > 0 && historyIndex >= 0) {
                    const next = historyIndex + 1;
                    const idx = next >= h.length ? -1 : next;
                    setHistoryIndex(idx);
                    dispatch({ type: 'SET_COMMAND', payload: idx >= 0 ? h[idx]! : '' });
                  }
                }
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (showSuggestions && suggestions.length > 0) {
                  setSuggestionIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
                } else {
                  const h = historyRef.current;
                  if (h.length > 0) {
                    const idx = historyIndex < 0 ? h.length - 1 : Math.max(0, historyIndex - 1);
                    setHistoryIndex(idx);
                    dispatch({ type: 'SET_COMMAND', payload: h[idx]! });
                  }
                }
              }
            }}
            placeholder="Ticker Function GO • Esc=MENU"
            className={clsx(
              'w-full h-5 px-2 bg-[#1a1a1a] border outline-none focus:ring-1',
              isInvalidCommand
                ? 'border-[#FF0000] text-[#FF0000] focus:border-[#FF0000] focus:ring-[#FF0000]/50'
                : 'border-[#444] focus:border-[#FFB000] focus:ring-[#FFB000]/50'
            )}
            style={{ color: isInvalidCommand ? '#FF0000' : '#FFD700', fontSize: '11px' }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full mt-0.5 z-50 border border-[#444] bg-[#1a1a1a] max-h-[200px] overflow-y-auto terminal-scrollbar"
              style={{ fontSize: '10px' }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => applySuggestion(s.code, s.kind)}
                  className={`
                    w-full text-left px-3 py-1.5 flex items-center gap-2
                    ${i === suggestionIndex ? 'bg-[#0068FF]/30 text-[#FFB000]' : 'text-[#999] hover:bg-[#222]'}
                  `}
                >
                  <span className="font-mono font-bold text-[#FFB000] w-20 shrink-0">{s.code}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="shrink-0" style={{ color: '#666', fontSize: '9px' }}>
          Enter=GO • Esc=MENU • {yellowKeyMode} • Panel {activePanelIndex !== null ? activePanelIndex + 1 : '-'} • {activeFunction}
        </span>
      </div>
    </div>
  );
}
