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

const FUNCTION_CODES: TerminalFunction[] = ['EXEC', 'DES', 'FA', 'HP', 'WEI', 'YAS', 'OVME', 'PORT'];

export function CommandKeyBar() {
  const { state, dispatch } = useTerminalStore();

  const applyAsset = (assetClass: AssetClass) => {
    const security = { ...state.security, assetClass };
    const normalized = `${security.ticker}${security.market ? ` ${security.market}` : ''} ${state.activeFunction} GO`;
    dispatch({ type: 'SET_COMMAND', payload: normalized });
    dispatch({ type: 'EXECUTE_COMMAND', payload: normalized });
  };

  return (
    <div className="h-7 border-b border-[#1a2433] bg-[#090f1a] px-1 flex items-center gap-1 overflow-x-auto custom-scrollbar">
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
          className={`h-5 px-1.5 border text-[9px] font-bold tracking-wide shrink-0 ${
            k.role === 'go'
              ? 'bg-[#123547] border-[#2a779b] text-[#a7dfff]'
              : k.role === 'danger'
                ? 'bg-[#411b2a] border-[#8d3c59] text-[#ffc0d5]'
                : 'bg-[#221a3b] border-[#4d3f81] text-[#d1c8ff]'
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
          className={`h-5 px-1 border text-[9px] font-bold shrink-0 ${state.activeFunction === f ? 'bg-[#113328] border-[#2a7b60] text-[#99f1d6]' : 'bg-[#0e1522] border-[#28344a] text-[#9eb3cf]'}`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
