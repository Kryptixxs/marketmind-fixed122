'use client';

import React, { useMemo } from 'react';
import { useTerminalStore } from '../../store/TerminalStore';
import { getDesFinancialObject } from '../../services/financialDataStore';
import { getField, parseOverrides } from '../../services/fieldEngine';
import { lookupSecurity } from '../../services/securityMaster';

/**
 * DES - Security Description. 2-column layout:
 * Market Cap, P/E Ratio, Dividend Yield, 5-sentence Business Summary in Amber.
 */
export function SecurityDescription({ symbol }: { symbol?: string }) {
  const { state } = useTerminalStore();
  const ticker = symbol ?? state.activeSymbol;
  const [overrideInput, setOverrideInput] = React.useState('');
  const overrides = parseOverrides(overrideInput);
  const data = useMemo(() => getDesFinancialObject(ticker), [ticker]);
  const masterNode = useMemo(() => lookupSecurity(ticker), [ticker]);
  const overrideMcap = getField(ticker, 'MARKET_CAP', overrides);
  const overridePe = getField(ticker, 'PE_RATIO', overrides);
  const marketCapNum = typeof overrideMcap === 'number' ? overrideMcap : data.marketCap;
  const marketCap = marketCapNum >= 1e12
    ? `${(marketCapNum / 1e12).toFixed(2)}T`
    : `${(marketCapNum / 1e9).toFixed(2)}B`;
  const shares = `${(data.sharesOutstanding / 1e9).toFixed(2)}B`;

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#000000] overflow-auto terminal-scrollbar">
      <div className="flex-none px-2 py-1 border-b border-[#333] bg-[#0a0a0a]">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#FFB000]">
          DES • Security Description • {ticker}
        </span>
      </div>
      <div className="flex-1 min-h-0 p-3 grid grid-cols-2 gap-x-6 gap-y-2" style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, Roboto Mono, monospace' }}>
        <div className="col-span-2 grid grid-cols-2 gap-4 mb-2">
          <div className="flex flex-col gap-1">
            <span className="text-[#666] text-[10px] uppercase tracking-wider">Market Cap</span>
            <span className="text-[#FFFFFF] tabular-nums">{marketCap}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#666] text-[10px] uppercase tracking-wider">P/E Ratio</span>
            <span className="text-[#FFFFFF] tabular-nums">{typeof overridePe === 'number' ? overridePe.toFixed(2) : data.peRatio}x</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#666] text-[10px] uppercase tracking-wider">Shares Outstanding</span>
            <span className="text-[#FFFFFF] tabular-nums">{shares}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[#666] text-[10px] uppercase tracking-wider">Primary Exchange</span>
            <span className="text-[#FFFFFF] tabular-nums">{data.primaryExchange}</span>
          </div>
        </div>
        <div className="col-span-2 flex flex-col gap-1 mt-2">
          <span className="text-[#666] text-[10px] uppercase tracking-wider">Business Summary</span>
          <p className="text-[#FFB000] leading-relaxed" style={{ fontSize: '11px' }}>
            {data.businessSummary}
          </p>
        </div>
        {(masterNode?.relatedBonds.length || masterNode?.relatedOptions.length) ? (
          <div className="col-span-2 mt-2 border-t border-[#333] pt-2">
            <div className="text-[#666] text-[10px] uppercase tracking-wider mb-1">Related Securities</div>
            <div className="flex flex-wrap gap-1">
              {[...(masterNode?.relatedBonds ?? []), ...(masterNode?.relatedOptions ?? [])].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="px-1 border border-[#333] bg-[#060606] text-[#d7deea] hover:text-[#FFB000]"
                  onClick={() => window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: s }))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex-none h-6 border-t border-[#333] px-2 flex items-center gap-2">
        <span className="text-[#FFB000] text-[9px] uppercase">Override</span>
        <input
          value={overrideInput}
          onChange={(e) => setOverrideInput(e.target.value.toUpperCase())}
          placeholder="PX=200"
          className="h-4 flex-1 bg-[#111] border border-[#333] px-1 text-[10px] text-[#FFB000] outline-none"
        />
      </div>
    </div>
  );
}
