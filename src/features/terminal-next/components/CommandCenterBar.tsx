'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { useTerminalStore } from '../store/TerminalStore';
import { usePanelFocus } from '../context/PanelFocusContext';
import { parseCommand } from '../services/commandParser';
import { getSuggestions, MNEMONIC_REGISTRY } from '../services/MnemonicEngine';
import { useTerminalContextMenu } from '../context/TerminalContextMenuContext';
import { useTerminalLayout } from '../context/TerminalLayoutContext';
import { loadWorkspace, saveWorkspace, workspaceExists } from '../services/workspaceManager';
import type { PanelFunction } from '../context/PanelFocusContext';

export const COMMAND_CENTER_INPUT_ID = 'command-center-input';

/** Map FunctionCode from parseCommand to PanelFunction */
function toPanelFunction(code: string): PanelFunction {
  const c = code.toUpperCase();
  const valid: PanelFunction[] = ['WEI', 'GP', 'N', 'MKT', 'EXEC', 'DES', 'FA', 'HP', 'YAS', 'OVME', 'PORT', 'NEWS', 'CAL', 'SEC', 'INTEL', 'IMAP', 'ECO', 'FXC', 'GC', 'IB'];
  if (valid.includes(c as PanelFunction)) return c as PanelFunction;
  if (c === 'GIP' || c === 'GCDS') return 'MKT';
  if (c === 'CN') return 'NEWS';
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
  const {
    activePanelIndex,
    panelFunctions,
    setPanelFunction,
    setPanelFunctions,
    pushPanelState,
    popPanelState,
  } = usePanelFocus();
  const { zoomedQuadrant, setZoomedQuadrant, panelSizes, setPanelSizes } = useTerminalLayout();

  const activeFunction = activePanelIndex !== null ? panelFunctions[activePanelIndex] ?? 'MKT' : 'MKT';

  const historyRef = useRef<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isInvalidCommand, setIsInvalidCommand] = useState(false);

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

  const suggestions = useMemo(() => getSuggestions(suggestionPrefix), [suggestionPrefix]);

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

      let command = '';
      const tokens = trimmed.split(/\s+/);
      const hasGo = tokens[tokens.length - 1] === 'GO';
      const fnFromInput = hasGo && tokens.length >= 2 ? tokens[tokens.length - 2] : null;
      const firstToken = tokens[0] ?? '';
      const isMnemonicOnly = MNEMONIC_REGISTRY.some((m) => m.code === firstToken) && tokens.length <= 2;
      const match = state.quotes.find(
        (q) =>
          q.symbol.toUpperCase().startsWith(tokens[0] ?? '') ||
          q.symbol.toUpperCase().includes(tokens[0] ?? '') ||
          q.name.toUpperCase().includes(tokens[0] ?? '')
      );
      const symbol = isMnemonicOnly
        ? state.activeSymbol
        : match?.symbol ?? (tokens[0]?.includes(' ') ? tokens[0] : `${tokens[0] ?? trimmed} US`);
      const panelToCode = (p: PanelFunction) => (p === 'GP' ? 'MKT' : p === 'N' ? 'NEWS' : p);
      const fn = hasGo && fnFromInput ? fnFromInput : isMnemonicOnly ? firstToken : panelToCode(activeFunction);
      command = `${symbol} ${fn} GO`;
      const parsed = parseCommand(command);
      const newFn = parsed.ok ? toPanelFunction(parsed.functionCode) : activeFunction;

      if (activePanelIndex !== null) {
        pushPanelState(activePanelIndex, activeFunction, state.activeSymbol);
      }
      if (command && command !== 'GRAB GO') {
        const h = historyRef.current;
        if (h[h.length - 1] !== command) {
          h.push(command);
          if (h.length > 50) h.shift();
        }
        setHistoryIndex(-1);
      }
      dispatch({ type: 'TICKER_SELECTED', payload: symbol });
      dispatch({ type: 'SET_COMMAND', payload: command });
      dispatch({ type: 'EXECUTE_COMMAND', payload: command });
      if (activePanelIndex !== null) {
        setPanelFunction(activePanelIndex, newFn);
      }
    },
    [state.quotes, state.activeSymbol, activeFunction, activePanelIndex, panelFunctions, zoomedQuadrant, panelSizes, setPanelFunction, setPanelFunctions, setZoomedQuadrant, setPanelSizes, pushPanelState, dispatch]
  );

  useEffect(() => {
    if (registerExecuteCommand) {
      return registerExecuteCommand(executeCommand);
    }
  }, [registerExecuteCommand, executeCommand]);

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
    (code: string) => {
      const tokens = displayValue.trim().split(/\s+/);
      const hasMultiple = tokens.length > 1;
      const base = hasMultiple ? tokens.slice(0, -1).join(' ') : state.activeSymbol;
      const newVal = `${base} ${code}`;
      dispatch({ type: 'SET_COMMAND', payload: `${newVal} GO` });
      setSuggestionIndex(0);
      setShowSuggestions(false);
    },
    [displayValue, state.activeSymbol, dispatch]
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
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-none flex flex-col shrink-0 border-b border-[#333]"
      style={{
        backgroundColor: '#333',
        fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
        fontSize: '11px',
        color: 'var(--color-bbg-amber, #FFB000)',
      }}
    >
      <div className="h-[28px] flex items-center gap-3 px-3">
        <span className="font-bold uppercase tracking-wider shrink-0" style={{ color: '#FFB000' }}>
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
                  executeCommand(`${base} ${sel.code}`);
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
            style={{ color: isInvalidCommand ? '#FF0000' : '#FFB000', fontSize: '11px' }}
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full mt-0.5 z-50 border border-[#444] bg-[#1a1a1a] max-h-[200px] overflow-y-auto terminal-scrollbar"
              style={{ fontSize: '10px' }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={s.code}
                  type="button"
                  onClick={() => applySuggestion(s.code)}
                  className={`
                    w-full text-left px-3 py-1.5 flex items-center gap-2
                    ${i === suggestionIndex ? 'bg-[#0068FF]/30 text-[#FFB000]' : 'text-[#999] hover:bg-[#222]'}
                  `}
                >
                  <span className="font-mono font-bold text-[#FFB000] w-12 shrink-0">{s.code}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="shrink-0" style={{ color: '#666', fontSize: '9px' }}>
          Enter=GO • Esc=MENU • Panel {activePanelIndex !== null ? activePanelIndex + 1 : '-'} • {activeFunction}
        </span>
      </div>
    </div>
  );
}
