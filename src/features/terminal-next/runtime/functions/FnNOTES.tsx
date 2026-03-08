'use client';

import React, { useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { EmptyFill, PanelSubHeader } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { addSecurityNote, deleteSecurityNote, listSecurityNotes } from '../securityNotesStore';
import { appendAuditEvent } from '../commandAuditStore';

export function FnNOTES({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const security = panels[panelIdx]!.activeSecurity;
  const [input, setInput] = useState('');
  const [, setRefreshTick] = useState(0);
  const notes = listSecurityNotes(security);

  const add = () => {
    const note = addSecurityNote(security, input);
    if (!note) return;
    appendAuditEvent({ panelIdx, type: 'NOTE_ADD', actor: 'USER', detail: `NOTES ${security}` });
    setInput('');
    setRefreshTick((v) => v + 1);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`NOTES • ${security}`} />
      <div className="flex items-center flex-none" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 4 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="Type note and press Enter"
          className="flex-1 bg-transparent outline-none"
          style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }} />
        <button type="button" onClick={add} style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny }}>ADD</button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
        {notes.length === 0 ? (
          <EmptyFill hint="NO NOTES FOR THIS SECURITY" />
        ) : notes.map((n, i) => (
          <div key={n.id} className="flex items-center gap-1"
            style={{ minHeight: DENSITY.rowHeightPx + 2, padding: `0 ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}`, background: i % 2 ? DENSITY.rowZebra : DENSITY.bgBase }}>
            <span className="flex-1" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>{n.text}</span>
            <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>{new Date(n.updatedAt).toLocaleDateString()}</span>
            <button type="button" onClick={() => { deleteSecurityNote(security, n.id); setRefreshTick((v) => v + 1); }}
              style={{ color: DENSITY.accentRed, fontSize: DENSITY.fontSizeTiny, background: 'none', border: 'none', cursor: 'pointer' }}>DEL</button>
          </div>
        ))}
      </div>
    </div>
  );
}
