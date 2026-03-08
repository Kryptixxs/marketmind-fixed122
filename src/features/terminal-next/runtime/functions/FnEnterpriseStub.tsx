'use client';

import React from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { useTerminalOS } from '../TerminalOSContext';
import { MNEMONIC_DEFS } from '../MnemonicRegistry';
import { getCatalogMnemonic } from '../../mnemonics/catalog';
import { NextActionsStrip } from '../ui/NextActionsStrip';

export function FnEnterpriseStub({ panelIdx }: { panelIdx: number }) {
  const { panels, navigatePanel, dispatchPanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const code = p.activeMnemonic;
  const def = MNEMONIC_DEFS[code];
  const catDef = getCatalogMnemonic(code);
  const title = catDef?.title ?? def?.title ?? code;
  const related = (catDef?.relatedCodes ?? def?.relatedCodes ?? ['DES', 'TOP', 'MON', 'WEI', 'ECO']).slice(0, 8);
  const help = catDef?.helpMarkdown ?? null;
  const D = DENSITY;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: D.fontFamily }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        background: D.bgSurface,
        borderBottom: `1px solid ${D.borderColor}`,
      }}>
        <div style={{ color: D.accentAmber, fontSize: '13px', fontWeight: 700 }}>{code}</div>
        <div style={{ color: D.textPrimary, fontSize: D.fontSizeDefault, marginTop: 2 }}>{title}</div>
        {catDef && (
          <div style={{ color: D.textDim, fontSize: D.fontSizeTiny, marginTop: 2 }}>
            {catDef.category} · {catDef.functionType} · {catDef.scope.replace(/_/g, ' ')}
          </div>
        )}
      </div>

      <NextActionsStrip panelIdx={panelIdx} />

      {/* Help content */}
      <div className="flex-1 min-h-0 overflow-auto" style={{ padding: '10px 12px' }}>
        {help && (
          <div style={{ marginBottom: 12, padding: '8px 10px', background: D.bgSurfaceAlt, border: `1px solid ${D.borderColor}` }}>
            {help.split('\n').slice(0, 8).map((line, i) => (
              <div key={i} style={{
                color: line.startsWith('#') ? D.textPrimary : D.textSecondary,
                fontSize: D.fontSizeDefault,
                fontWeight: line.startsWith('#') ? 700 : 400,
                marginBottom: 2,
              }}>
                {line.replace(/^#+\s*/, '')}
              </div>
            ))}
          </div>
        )}

        {/* Related functions */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ color: D.textDim, fontSize: D.fontSizeTiny, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Related Functions — click to open
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {related.map((c) => (
              <button key={c} type="button"
                onClick={() => navigatePanel(panelIdx, c, p.activeSecurity, p.marketSector)}
                style={{
                  color: D.accentCyan,
                  background: D.bgSurfaceAlt,
                  border: `1px solid ${D.borderColor}`,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontSize: D.fontSizeTiny,
                  fontFamily: D.fontFamily,
                  fontWeight: 600,
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[
            { label: 'Open MENU for next actions', icon: 'F2', action: () => dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'menu' }) },
            { label: 'Search all functions (HL)', icon: 'Ctrl+K', action: () => dispatchPanel(panelIdx, { type: 'SET_OVERLAY', mode: 'search' }) },
            { label: 'Browse function catalog', icon: 'NAVTREE', action: () => navigatePanel(panelIdx, 'NAVTREE') },
            { label: 'Contextual help', icon: 'F1', action: () => dispatchPanel(panelIdx, { type: 'PRESS_HELP' }) },
          ].map(({ label, icon, action }) => (
            <button key={icon} type="button" onClick={action} style={{
              background: D.bgSurfaceAlt,
              border: `1px solid ${D.borderColor}`,
              padding: '8px 10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: D.fontFamily,
            }}>
              <div style={{ color: D.accentAmber, fontSize: D.fontSizeTiny, fontWeight: 700, marginBottom: 2 }}>{icon}</div>
              <div style={{ color: D.textSecondary, fontSize: D.fontSizeDefault }}>{label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
