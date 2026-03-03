'use client';

import React, { useEffect, useState } from 'react';
import { useSettings } from '@/context/SettingsContext';
import { fetchNews } from '@/app/actions/fetchNews';

export function RightStack({ activeSymbol }: { activeSymbol: string }) {
  const { settings } = useSettings();
  const isTerminal = settings.uiTheme === 'terminal';
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    fetchNews('General').then(n => setNews(n.slice(0, 10)));
  }, []);

  return (
    <div className="w-[24%] min-w-[250px] flex flex-col gap-[var(--layout-gap)] h-full">
      
      {/* AI Bias Module */}
      <div className="region-panel shrink-0">
        <div className="region-header">
          <span>{isTerminal ? 'SYS_BIAS // CALC' : 'Algorithmic Bias'}</span>
        </div>
        <div className="p-3">
          {isTerminal ? (
            <div className="font-mono text-[10px] space-y-1">
              <div className="flex justify-between"><span>[DIR]</span> <span className="text-negative font-bold">SHORT_EXPANSION</span></div>
              <div className="flex justify-between"><span>[CNF]</span> <span>87.4%</span></div>
              <div className="flex justify-between"><span>[TGT]</span> <span>18,240.50</span></div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] text-text-secondary uppercase">Directional Bias</div>
              <div className="text-lg font-bold text-negative tracking-tight">BEARISH EXPANSION</div>
              <div className="w-full h-1 bg-background rounded overflow-hidden mt-1">
                <div className="h-full bg-negative w-[87%]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Macro Wire */}
      <div className="region-panel flex-1">
        <div className="region-header">
          <span>{isTerminal ? 'MACRO_WIRE // LIVE' : 'Intelligence Wire'}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {news.map((item, i) => (
            isTerminal ? (
              <div key={i} className="font-mono text-[9px] leading-tight flex gap-1 hover:bg-border cursor-pointer">
                <span className="text-text-dim">[{item.time.padStart(6)}]</span>
                <span className="text-text-primary">{item.title.toUpperCase()}</span>
              </div>
            ) : (
              <div key={i} className="flex flex-col gap-1 p-2 bg-background border border-border rounded-sm hover:border-text-dim cursor-pointer">
                <div className="flex justify-between text-[9px] text-text-tertiary">
                  <span className="font-bold">{item.source}</span>
                  <span>{item.time}</span>
                </div>
                <span className="text-[11px] leading-snug">{item.title}</span>
              </div>
            )
          ))}
        </div>
      </div>

    </div>
  );
}