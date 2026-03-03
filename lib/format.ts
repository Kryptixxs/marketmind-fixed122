/**
 * Centralized formatting utilities for the MarketMind terminal.
 */

export type AssetType = 'index' | 'fx' | 'commodity' | 'crypto' | 'equity';

export function formatPrice(n: number | undefined | null, type: AssetType = 'equity', decimals?: number): string {
  if (n === undefined || n === null || isNaN(n)) return '---';

  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: decimals !== undefined ? decimals : 2,
    maximumFractionDigits: decimals !== undefined ? decimals : 2,
  };

  // Fallback logic if decimals not provided
  if (decimals === undefined) {
    if (type === 'fx') {
      options.minimumFractionDigits = 5;
      options.maximumFractionDigits = 5;
    } else if (type === 'crypto') {
      if (n < 1) {
        options.minimumFractionDigits = 6;
        options.maximumFractionDigits = 8;
      } else {
        options.minimumFractionDigits = 2;
        options.maximumFractionDigits = 2;
      }
    } else if (type === 'index') {
      options.minimumFractionDigits = 2;
      options.maximumFractionDigits = 2;
    }
  }

  return n.toLocaleString(undefined, options);
}

export function formatPercent(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return '0.00%';
  // Ensure we show the sign and 2 decimals
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function formatInt(n: number | undefined | null): string {
  if (n === undefined || n === null || isNaN(n)) return '0';
  return Math.round(n).toString();
}

export function formatMaybeNumber(val: any): string {
  if (val === undefined || val === null || val === '') return '---';
  
  if (typeof val === 'string' && /[kMB%]$/i.test(val)) return val;
  
  const n = typeof val === 'number' ? val : parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
  if (isNaN(n)) return val.toString() || '---';
  
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}