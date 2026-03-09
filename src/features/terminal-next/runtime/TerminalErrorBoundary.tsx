'use client';

import React from 'react';
import { DENSITY } from '../constants/layoutDensity';

type State = { hasError: boolean; message: string };

export class TerminalErrorBoundary extends React.Component<React.PropsWithChildren<{ panelIdx: number }>, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unknown runtime error' };
  }

  componentDidCatch(error: unknown) {
    // Keep workspace alive; function-level errors should not blank the full terminal.
    console.error(`Panel ${this.props.panelIdx + 1} runtime error`, error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="h-full w-full flex flex-col min-h-0" style={{ fontFamily: DENSITY.fontFamily, background: DENSITY.panelBg, color: DENSITY.textPrimary }}>
        <div style={{ borderBottom: `1px solid ${DENSITY.borderColor}`, padding: '4px 6px', color: DENSITY.accentRed, fontWeight: 700 }}>
          Panel Runtime Error
        </div>
        <div className="p-2 text-xs space-y-1">
          <div style={{ color: DENSITY.textSecondary }}>This function failed in pane {this.props.panelIdx + 1}. Other panes remain active.</div>
          <div style={{ color: DENSITY.textDim }}>Message: {this.state.message || 'No message available'}</div>
        </div>
      </div>
    );
  }
}
