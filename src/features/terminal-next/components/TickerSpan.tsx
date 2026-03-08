'use client';

import React from 'react';

export interface TickerSpanProps {
  ticker: string;
  children?: React.ReactNode;
  className?: string;
}

/** Wraps ticker text so right-click opens TerminalContextMenu */
export function TickerSpan({ ticker, children, className = '' }: TickerSpanProps) {
  return (
    <span data-ticker={ticker} className={className}>
      {children ?? ticker}
    </span>
  );
}
