'use client';

import React, { useCallback } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { useDrill } from '../entities/DrillContext';
import { useTerminalOS } from '../TerminalOSContext';
import { makeSecurity, makeField, makeFunction } from '../entities/types';
import type { EntityRef } from '../entities/types';
import { MNEMONIC_DEFS } from '../MnemonicRegistry';

// ── Generate dense simulated fields for any entity ───────────────────────────
function buildEntityFields(entity: EntityRef): Array<{ label: string; value: string; entity?: EntityRef }> {
  const common: Array<{ label: string; value: string; entity?: EntityRef }> = [
    { label: 'ID', value: entity.id },
    { label: 'TYPE', value: entity.kind },
    { label: 'DISPLAY', value: entity.display },
  ];

  switch (entity.kind) {
    case 'SECURITY':
    case 'INDEX':
    case 'ETF': {
      const sym = (entity.payload as { sym: string }).sym;
      const ticker = sym.split(' ')[0] ?? sym;
      return [
        ...common,
        { label: 'TICKER', value: ticker, entity: makeSecurity(sym) },
        { label: 'LAST PX', value: (175 + (ticker.charCodeAt(0) % 50)).toFixed(2) },
        { label: 'MARKET CAP', value: '$' + (2.3 + (ticker.charCodeAt(0) % 20) / 10).toFixed(1) + 'T' },
        { label: 'P/E RATIO', value: (22 + (ticker.charCodeAt(0) % 18)).toFixed(1) + 'x', entity: makeField('PE_RATIO') },
        { label: 'DIV YIELD', value: (1.5 + (ticker.charCodeAt(0) % 15) / 10).toFixed(2) + '%', entity: makeField('DIV_YIELD') },
        { label: 'BETA', value: (0.8 + (ticker.charCodeAt(0) % 12) / 10).toFixed(2), entity: makeField('BETA') },
        { label: '52W HIGH', value: (200 + ticker.charCodeAt(0) % 80).toFixed(2) },
        { label: '52W LOW', value: (120 + ticker.charCodeAt(0) % 60).toFixed(2) },
        { label: 'AVG VOL', value: (30 + ticker.charCodeAt(0) % 50) + 'M' },
        { label: 'EXCHANGE', value: ticker.charCodeAt(0) % 2 === 0 ? 'NASDAQ' : 'NYSE', entity: makeField('PRIMARY_EXCHANGE') },
      ];
    }
    case 'FIELD': {
      const fp = entity.payload as { fieldName: string; value?: unknown };
      return [
        ...common,
        { label: 'FIELD NAME', value: fp.fieldName },
        { label: 'VALUE', value: String(fp.value ?? '—') },
        { label: 'TYPE', value: 'NUMBER' },
        { label: 'SOURCE', value: 'B-PIPE SIM' },
        { label: 'LAST UPDATE', value: new Date().toISOString().slice(0, 19) },
        { label: 'RELATED FN', value: 'DES', entity: makeFunction('DES', 'Description') },
        { label: 'RELATED FN', value: 'FA', entity: makeFunction('FA', 'Financial Analysis') },
      ];
    }
    case 'PERSON': {
      const pp = entity.payload as { name: string; title?: string; company?: string };
      return [
        ...common,
        { label: 'NAME', value: pp.name },
        { label: 'TITLE', value: pp.title ?? '—' },
        { label: 'COMPANY', value: pp.company ?? '—', entity: pp.company ? makeSecurity(`${pp.company} US Equity`) : undefined },
      ];
    }
    case 'NEWS': {
      const np = entity.payload as { headline: string; src?: string; ts?: string };
      return [
        ...common,
        { label: 'HEADLINE', value: np.headline },
        { label: 'SOURCE', value: np.src ?? '—' },
        { label: 'TIME', value: np.ts ?? '—' },
      ];
    }
    case 'SECTOR': {
      const sp = entity.payload as { name: string };
      return [
        ...common,
        { label: 'SECTOR', value: sp.name },
        { label: 'FUNCTION', value: 'IMAP', entity: makeFunction('IMAP', 'Sector Heatmap') },
        { label: 'FUNCTION', value: 'RELS', entity: makeFunction('RELS', 'Related Securities') },
        { label: 'FUNCTION', value: 'WEI', entity: makeFunction('WEI', 'World Indices') },
      ];
    }
    case 'FUNCTION': {
      const fp = entity.payload as { code: string; title?: string };
      const def = MNEMONIC_DEFS[fp.code];
      return [
        ...common,
        { label: 'CODE', value: fp.code },
        { label: 'TITLE', value: fp.title ?? def?.title ?? '—' },
        { label: 'CATEGORY', value: def?.layoutType ?? '—' },
        { label: 'RELATED', value: (def?.relatedCodes ?? []).join(', ') },
      ];
    }
    default:
      return common;
  }
}

function relatedFunctions(entity: EntityRef): string[] {
  switch (entity.kind) {
    case 'SECURITY': case 'INDEX': case 'ETF':
      return ['DES', 'HP', 'GP', 'GIP', 'FA', 'CN', 'OWN', 'RELS', 'MGMT', 'DVD', 'ALRT'];
    case 'FIELD': return ['DES', 'FA'];
    case 'PERSON': return ['MGMT', 'OWN', 'DES'];
    case 'NEWS': return ['TOP', 'CN', 'N'];
    case 'SECTOR': case 'INDUSTRY': return ['IMAP', 'RELS', 'WEI'];
    case 'FUNCTION': return ['MENU', 'HL'];
    default: return ['DES', 'TOP'];
  }
}

export function TerminalInspector() {
  const { inspector, closeInspector, pinInspector, drill } = useDrill();
  const { focusedPanel } = useTerminalOS();

  if (!inspector.open || !inspector.entity) return null;

  const entity = inspector.entity;
  const fields = buildEntityFields(entity);
  const relFns = relatedFunctions(entity);

  return (
    <div
      className="fixed z-50"
      style={{
        right: 0, top: 0, bottom: 16, width: 280,
        background: '#050505',
        border: `1px solid ${DENSITY.borderColor}`,
        borderRight: 'none',
        fontFamily: DENSITY.fontFamily,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ height: DENSITY.panelHeaderHeightPx, background: DENSITY.bgHeader, padding: `0 ${DENSITY.pad4}px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, fontWeight: 700, textTransform: 'uppercase' }}>
          INSPECT — {entity.kind}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => pinInspector(!inspector.pinned)}
            style={{ color: inspector.pinned ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }}
            title="Pin inspector open"
          >
            {inspector.pinned ? '📌 PIN' : 'PIN'}
          </button>
          <button
            type="button"
            onClick={closeInspector}
            style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }}
          >✕</button>
        </div>
      </div>

      {/* Entity display */}
      <div style={{ padding: `${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.borderColor}`, flexShrink: 0 }}>
        <div style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, fontWeight: 700, marginBottom: 1 }}>{entity.display}</div>
        <div style={{ color: DENSITY.textDim, fontSize: DENSITY.fontSizeTiny }}>
          {entity.kind} • SIM • {new Date().toISOString().slice(11, 19)} UTC
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} className="terminal-scrollbar">
        {fields.map((f, i) => (
          <div
            key={`${f.label}-${i}`}
            className="flex items-center"
            style={{ height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, background: i % 2 === 1 ? '#060606' : DENSITY.bgBase }}
          >
            <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, width: 90, flexShrink: 0, textTransform: 'uppercase' }}>{f.label}</span>
            {f.entity ? (
              <button
                type="button"
                className="truncate text-left hover:underline"
                style={{ color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeDefault, background: 'none', border: 'none', cursor: 'pointer', flex: 1, padding: 0 }}
                title={`Click: open | Shift+Click: send to panel | Alt+Click: inspect`}
                onClick={(e) => {
                  e.stopPropagation();
                  const intent = e.shiftKey ? 'OPEN_IN_NEW_PANEL' : e.altKey ? 'INSPECT_OVERLAY' : 'OPEN_IN_PLACE';
                  drill(f.entity!, intent, focusedPanel);
                }}
              >{f.value}</button>
            ) : (
              <span className="truncate tabular-nums" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, flex: 1 }}>{f.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Related functions */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${DENSITY.borderColor}`, padding: DENSITY.pad4 }}>
        <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, marginBottom: 3 }}>RELATED FUNCTIONS</div>
        <div className="flex flex-wrap gap-1">
          {relFns.map((fn) => (
            <button
              key={fn}
              type="button"
              style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny, border: `1px solid ${DENSITY.borderColor}`, padding: '0 3px', background: '#111', cursor: 'pointer' }}
              onClick={() => {
                const sym = 'sym' in entity.payload ? (entity.payload as { sym: string }).sym : undefined;
                drill(makeFunction(fn), 'OPEN_IN_PLACE', focusedPanel);
              }}
            >{fn}</button>
          ))}
        </div>

        {/* Send to panel button */}
        <div className="flex gap-1 mt-1">
          <button
            type="button"
            style={{ flex: 1, background: '#0a1a2a', color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, border: `1px solid ${DENSITY.accentCyan}`, padding: '1px 4px', cursor: 'pointer' }}
            onClick={() => drill(entity, 'OPEN_IN_PLACE', focusedPanel)}
          >OPEN IN P{focusedPanel + 1}</button>
          <button
            type="button"
            style={{ flex: 1, background: '#0a1a2a', color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny, border: `1px solid ${DENSITY.accentGreen}`, padding: '1px 4px', cursor: 'pointer' }}
            onClick={() => drill(entity, 'OPEN_IN_NEW_PANEL', focusedPanel)}
          >SEND TO PANEL</button>
        </div>
      </div>
    </div>
  );
}
