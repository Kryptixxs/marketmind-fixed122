'use client';

import React, { useCallback } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { useDrill } from '../entities/DrillContext';
import { makeFunction } from '../entities/types';
import { MNEMONIC_DEFS } from '../MnemonicRegistry';
import type { MarketSector } from '../panelState';
import { intentFromMouseEvent } from '../interaction';
import { openContextMenu } from './ContextMenu';

// Context-aware next actions based on current mnemonic + sector
function getNextActions(mnemonic: string, sector: MarketSector): Array<{ code: string; tip: string }> {
  const def = MNEMONIC_DEFS[mnemonic];
  const related = (def?.relatedCodes ?? []).slice(0, 5);

  const sectorDefaults: Record<MarketSector, string[]> = {
    EQUITY: ['DES', 'GP', 'HP', 'CN', 'OWN'],
    CORP: ['DES', 'HP', 'GC', 'CN'],
    CURNCY: ['DES', 'GP', 'FXC'],
    COMDTY: ['DES', 'GP', 'CN'],
    INDEX: ['DES', 'GP', 'WEI', 'IMAP'],
    GOVT: ['DES', 'HP', 'GC'],
    MUNI: ['DES', 'HP'],
    MTGE: ['DES', 'HP'],
  };

  const defaults = sectorDefaults[sector] ?? ['DES', 'GP', 'HP', 'CN'];
  const merged = [...new Set([...related, ...defaults])].filter((c) => c !== mnemonic).slice(0, 6);
  return merged.map((code) => ({ code, tip: MNEMONIC_DEFS[code]?.title ?? code }));
}

export function NextActionsStrip({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const { drill } = useDrill();
  const p = panels[panelIdx]!;
  const actions = getNextActions(p.activeMnemonic, p.marketSector);
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const handleAction = useCallback((code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const fn = makeFunction(code, MNEMONIC_DEFS[code]?.title);
    drill(fn, intentFromMouseEvent(e), panelIdx);
  }, [drill, panelIdx]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      const focused = document.activeElement;
      if (focused !== el && !el.contains(focused)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIdx((v) => Math.min(actions.length - 1, v + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIdx((v) => Math.max(0, v - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const code = actions[selectedIdx]?.code;
        if (!code) return;
        drill(makeFunction(code, MNEMONIC_DEFS[code]?.title), e.shiftKey ? 'OPEN_IN_NEW_PANEL' : e.altKey ? 'INSPECT_OVERLAY' : 'OPEN_IN_PLACE', panelIdx);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, selectedIdx, drill, panelIdx]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      className="flex items-center flex-none overflow-x-auto select-none"
      style={{ height: 15, background: DENSITY.panelBgAlt, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 1, fontFamily: DENSITY.fontFamily, fontSize: '8px' }}
    >
      <span style={{ color: DENSITY.textDim, marginRight: 3, flexShrink: 0 }}>NEXT:</span>
      {actions.map((a, i) => (
        <button
          key={a.code}
          type="button"
          onClick={(e) => handleAction(a.code, e)}
          onFocus={() => setSelectedIdx(i)}
          onMouseEnter={() => setSelectedIdx(i)}
          onContextMenu={(e) => {
            e.preventDefault();
            openContextMenu(e, makeFunction(a.code, a.tip), panelIdx);
          }}
          title={`${a.tip} — Click: open here  •  Shift+Click: send to panel`}
          className="hover:bg-[#1a2a3a]"
          style={{
            color: DENSITY.accentAmber, fontSize: '8px', border: `1px solid ${DENSITY.groupSeparator}`,
            padding: '0 3px', background: i === selectedIdx ? DENSITY.rowSelectedBg : 'none', cursor: 'pointer', flexShrink: 0, height: 12,
          }}
        >
          {a.code}
        </button>
      ))}
      <span style={{ color: DENSITY.textDim, marginLeft: 'auto', flexShrink: 0, fontSize: '8px' }}>F2=MENU Shift+Click→Panel</span>
    </div>
  );
}
