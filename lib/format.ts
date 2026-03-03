/**
 * Centralized formatting utilities for the MarketMind terminal.
 */

export type AssetType = 'index' | 'fx' | 'commodity' | 'crypto' | 'equity';

export function formatPrice(n: number | undefined | null, type: AssetType = 'equity'): string {
  if (n === undefined || n === null || isNaN(n)) return '---';

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };

  if (type === 'fx') {
    options.minimumFractionDigits = 4;
    options.maximumFractionDigits = 5;
  } else if (type === 'crypto') {
    if (n < 1) {
      options.minimumFractionDigits = 6;
      options.maximumFractionDigits = 8;
    } else {
      options.minimumFractionDigits = 2;
      options.maximumFractionDigits = 4;
    }
  } else if (type === 'commodity') {
    options.minimumFractionDigits = 2;
    options.maximumFractionDigits = 3;
  }

  return n.toLocaleString(undefined, options);
}

export function formatPercent(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return '0.00%';
  return `${n.toFixed(2)}%`;
}

export function formatInt(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return '0';
  return Math.round(n).toString();
}

export function formatMaybeNumber(val: any): string {
  if (val === undefined || val === null || val === '') return '---';
  
  // If it's already a string with a unit (like '250k' or '1.2%'), return as is
  if (typeof val === 'string' && /[kMB%]$/i.test(val)) return val;
  
  const n = typeof val === 'number' ? val : parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
  if (isNaN(n)) return val.toString() || '---';
  
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}