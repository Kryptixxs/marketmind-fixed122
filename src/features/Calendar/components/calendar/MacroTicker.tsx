'use client';

import React from 'react';
import { Activity } from 'lucide-react';

// Hardcoded latest historical prints for the requested US metrics
// In a fully productionized app, these would be fetched/cached from a DB, 
// but for a UI ticker, static recent values provide the exact aesthetic needed.
const MACRO_DATA = [
  { label: 'US GDP (QoQ)', value: '+3.2%', status: 'positive' },
  { label: 'Unemployment Rate', value: '3.9%', status: 'negative' },
  { label: 'US CPI (YoY)', value: '+3.1%', status: 'warning' },
  { label: 'US PPI (MoM)', value: '+0.3%', status: 'warning' },
  { label: 'Ind. Production', value: '+0.1%', status: 'neutral' },
  { label: 'Retail Sales (MoM)', value: '+0.6%', status: 'positive' },
  { label: 'Nonfarm Payrolls', value: '275K', status: 'positive' },
];

export function MacroTicker() {
  return (
    <div className="flex-1 h-full min-w-0 bg-surface-highlight/30 border border-border/50 rounded-md relative overflow-hidden flex items-center">
      {/* Left Static Badge */}
      <div className="absolute left-0 top-0 bottom-0 z-10 bg-surface-highlight border-r border-border/50 px-3 flex items-center shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
        <Activity size={12} className="text-accent mr-2 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary">US Macro</span>
      </div>

      {/* Scrolling Text Container */}
      <div className="flex items-center animate-ticker whitespace-nowrap pl-[120px] hover:[animation-play-state:paused] cursor-default">
        {MACRO_DATA.map((item, i) => (
          <div key={i} className="flex items-center mx-4">
            <span className="text-[10px] font-bold text-text-secondary uppercase mr-2 tracking-wider">
              {item.label}
            </span>
            <span className={`text-[11px] font-mono font-bold ${
              item.status === 'positive' ? 'text-positive' :
              item.status === 'negative' ? 'text-negative' :
              item.status === 'warning' ? 'text-warning' : 'text-text-primary'
            }`}>
              {item.value}
            </span>
            {i < MACRO_DATA.length - 1 && (
              <span className="ml-8 text-border-highlight">|</span>
            )}
          </div>
        ))}
        
        {/* Duplicate the array right after to make the loop seamless if the screen is very wide */}
        <span className="ml-8 text-border-highlight">|</span>
        {MACRO_DATA.map((item, i) => (
          <div key={`dup-${i}`} className="flex items-center mx-4">
            <span className="text-[10px] font-bold text-text-secondary uppercase mr-2 tracking-wider">
              {item.label}
            </span>
            <span className={`text-[11px] font-mono font-bold ${
              item.status === 'positive' ? 'text-positive' :
              item.status === 'negative' ? 'text-negative' :
              item.status === 'warning' ? 'text-warning' : 'text-text-primary'
            }`}>
              {item.value}
            </span>
            {i < MACRO_DATA.length - 1 && (
              <span className="ml-8 text-border-highlight">|</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}