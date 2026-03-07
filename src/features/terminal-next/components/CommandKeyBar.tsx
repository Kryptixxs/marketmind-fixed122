'use client';

import { AssetClass, FunctionCode, TerminalFunction } from '../types';
import { useTerminalStore } from '../store/TerminalStore';

const KEYBAR = [
  { label: 'CANCEL', role: 'danger' },
  { label: 'EQUITY', role: 'sector' },
  { label: 'CORP', role: 'sector' },
  { label: 'GOVT', role: 'sector' },
  { label: 'CMDTY', role: 'sector' },
  { label: 'CURNCY', role: 'sector' },
  { label: 'GO', role: 'go' },
] as const;

const FUNCTION_CODES: TerminalFunction[] = ['EXEC', 'DES', 'FA', 'HP', 'WEI', 'YAS', 'OVME', 'PORT', 'INTEL', 'NEWS', 'CAL', 'SEC', 'MKT'];
const OPERATOR_KEYS = ['ESC', 'DEPTH', 'TAPE', 'ALERTS', 'RISK', 'NEWS', 'SYSTEM'] as const;

export function CommandKeyBar() {
  const { state, dispatch } = useTerminalStore();

  const applyAsset = (assetClass: AssetClass) => {
    const security = { ...state.security, assetClass };
    const normalized = `${security.ticker}${security.market ? ` ${security.market}` : ''} ${state.activeFunction} GO`;
    dispatch({ type: 'SET_COMMAND', payload: normalized });
    dispatch({ type: 'EXECUTE_COMMAND', payload: normalized });
  };

  return (
    <div className="h-[16px] border-b border-[#111] bg-black px-[2px] flex items-center gap-[2px] overflow-x-auto custom-scrollbar font-mono tracking-tight uppercase tabular-nums">
      {KEYBAR.map((k) => (
        <button
          key={k.label}
          onClick={() => {
            if (k.label === 'GO') dispatch({ type: 'EXECUTE_COMMAND' });
            if (k.label === 'CANCEL') dispatch({ type: 'SET_COMMAND', payload: '' });
            if (k.label === 'EQUITY' || k.label === 'CORP' || k.label === 'GOVT' || k.label === 'CMDTY' || k.label === 'CURNCY') {
              applyAsset(k.label);
            }
          }}
          className={`h-[12px] px-[2px] border text-[7px] font-bold tracking-tight leading-none shrink-0 active:translate-y-px ${
            k.role === 'go'
              ? 'bg-[#0d5e2a] border-[#2fd370] text-[#dbffe7]'
              : k.role === 'danger'
                ? 'bg-[#6b1f2f] border-[#ff7ca3] text-[#ffd9e5]'
                : 'bg-[#4f3a18] border-[#d4a74a] text-[#ffeab7]'
          }`}
        >
          {k.label}
        </button>
      ))}
      {FUNCTION_CODES.map((f) => (
        <button
          key={f}
          onClick={() => {
            if (f === 'EXEC') {
              dispatch({ type: 'SET_ACTIVE_FUNCTION', payload: 'EXEC' });
              dispatch({ type: 'SET_COMMAND', payload: `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} EXEC GO` });
              dispatch({ type: 'EXECUTE_COMMAND' });
            } else {
              dispatch({ type: 'SET_FUNCTION', payload: f as FunctionCode });
              dispatch({ type: 'EXECUTE_COMMAND' });
            }
          }}
          className={`h-[12px] px-[2px] border text-[7px] font-bold leading-none shrink-0 active:translate-y-px ${
            state.activeFunction === f
              ? 'bg-[#0d1f0d] border-green-600 text-green-400'
              : 'bg-[#0a0a0a] border-[#262626] text-gray-400'
          }`}
        >
          {f}
        </button>
      ))}
      {OPERATOR_KEYS.map((k) => (
        <button
          key={k}
          onClick={() => {
            if (k === 'DEPTH') {
              dispatch({ type: 'SET_RIGHT_TAB', payload: 'DEPTH' });
              dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: 'MICROSTRUCTURE' });
            }
            if (k === 'ESC') {
              const escCmd = `${state.security.ticker}${state.security.market ? ` ${state.security.market}` : ''} ESC GO`;
              dispatch({ type: 'SET_COMMAND', payload: escCmd });
              dispatch({ type: 'EXECUTE_COMMAND', payload: escCmd });
            }
            if (k === 'TAPE') {
              dispatch({ type: 'SET_RIGHT_TAB', payload: 'TAPE' });
              dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: 'EVENTS' });
            }
            if (k === 'ALERTS') {
              dispatch({ type: 'SET_RIGHT_TAB', payload: 'ALERTS' });
              dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: 'EVENTS' });
            }
            if (k === 'RISK') {
              dispatch({ type: 'SET_ANALYTICS_TAB', payload: 'FACTORS' });
              if (state.activeFunction === 'EXEC') dispatch({ type: 'SET_ACTIVE_SUBTAB', payload: 'FACTORS' });
            }
            if (k === 'NEWS') dispatch({ type: 'SET_FEED_TAB', payload: 'NEWS' });
            if (k === 'SYSTEM') dispatch({ type: 'SET_FEED_TAB', payload: 'SYSTEM' });
          }}
          className={`h-[12px] px-[2px] border text-[7px] font-bold leading-none shrink-0 active:translate-y-px ${
            (k === 'DEPTH' && state.rightRailTab === 'DEPTH')
            || (k === 'ESC' && state.activeFunction === 'EXEC' && state.activeSubTab === 'ESC')
            || (k === 'TAPE' && state.rightRailTab === 'TAPE')
            || (k === 'ALERTS' && state.rightRailTab === 'ALERTS')
            || (k === 'RISK' && state.analyticsTab === 'FACTORS')
            || (k === 'NEWS' && state.feedTab === 'NEWS')
            || (k === 'SYSTEM' && state.feedTab === 'SYSTEM')
              ? 'bg-[#0d1f0d] border-green-600 text-green-400'
              : 'bg-[#0a0a0a] border-[#262626] text-gray-400'
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  );
}
