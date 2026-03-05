'use client';

import React from 'react';
import { MiniCalendar } from './widgets/MiniCalendar';

export function FXMacroPanel() {
  return (
    <div className="h-full flex flex-col bg-surface border-b border-border">
      <div className="fx-grid-header">Macro Drivers & Rate Expectations</div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        <section>
          <h3 className="text-[9px] font-bold uppercase text-text-tertiary mb-2">Implied Rate Path (Fed Funds)</h3>
          <div className="grid grid-cols-3 gap-1">
            {['MAY 24', 'JUN 24', 'JUL 24'].map(m => (
              <div key={m} className="bg-background border border-border p-2 rounded-sm text-center">
                <div className="text-[8px] text-text-tertiary mb-1">{m}</div>
                <div className="text-xs font-bold">5.25%</div>
                <div className="text-[8px] text-negative">-25bps</div>
              </div>
            ))}
          </div>
        </section>
        <section className="flex-1">
          <MiniCalendar />
        </section>
      </div>
    </div>
  );
}