'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { DENSITY } from '../../constants/layoutDensity';
import { appendAuditEvent } from '../commandAuditStore';
import { makeFunction } from '../entities/types';
import { checkPolicy, loadPolicyState } from '../policyStore';
import { appendErrorEntry } from '../errorConsoleStore';

const COLS: DenseColumn[] = [
  { key: 'panel', header: 'Panel', width: '50px' },
  { key: 'time', header: 'Time', width: '80px' },
  { key: 'mnemonic', header: 'Mnemonic', width: '90px' },
  { key: 'security', header: 'Security', width: '1fr' },
  { key: 'idx', header: 'Idx', width: '50px', align: 'right' },
];

export function FnNAV({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels, navigatePanel, setFocusedPanel } = useTerminalOS();
  const [selectedPanel, setSelectedPanel] = useState<'ALL' | '1' | '2' | '3' | '4'>('ALL');

  const rows = useMemo(() => {
    const flat = panels.flatMap((panel, idx) => panel.history.map((h, hIdx) => ({
      id: `${idx}-${hIdx}-${h.ts}`,
      panel: `P${idx + 1}`,
      panelIdx: idx,
      idx: hIdx,
      time: new Date(h.ts).toISOString().slice(11, 19),
      mnemonic: h.mnemonic,
      security: h.security,
      sector: h.sector,
      active: panel.historyIdx === hIdx ? 'YES' : 'NO',
    })));
    const filtered = selectedPanel === 'ALL'
      ? flat
      : flat.filter((r) => r.panel === `P${selectedPanel}`);
    return filtered.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 400);
  }, [panels, selectedPanel]);

  const jump = (row: Record<string, unknown>) => {
    const policy = loadPolicyState();
    const gate = checkPolicy('SEND_TO_PANEL', policy.activeRole);
    if (!gate.allowed) {
      appendAuditEvent({
        panelIdx,
        type: 'POLICY_BLOCK',
        actor: policy.activeRole,
        detail: `Blocked NAV jump: ${gate.reason ?? 'Policy denied'}`,
        mnemonic: 'NAV',
        security: String(row.security),
      });
      appendErrorEntry({
        panelIdx,
        kind: 'POLICY',
        message: 'Navigation jump blocked by policy.',
        recovery: 'Review COMP/POL restrictions for SEND_TO_PANEL.',
        entity: 'NAV',
      });
      return;
    }
    const targetPanel = Number(row.panelIdx);
    navigatePanel(targetPanel, String(row.mnemonic), String(row.security), row.sector as never);
    setFocusedPanel(targetPanel);
    appendAuditEvent({
      panelIdx,
      type: 'NAV_JUMP',
      actor: 'USER',
      detail: `NAV jump to P${targetPanel + 1} ${String(row.mnemonic)} ${String(row.security)}`,
      mnemonic: 'NAV',
      security: String(row.security),
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="NAV • Navigation Graph" right={<StatusBadge label={`${rows.length} NODES`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>Scope</span>
        <select
          value={selectedPanel}
          onChange={(e) => setSelectedPanel(e.target.value as typeof selectedPanel)}
          style={{ background: '#000', color: DENSITY.textPrimary, border: `1px solid ${DENSITY.borderColor}`, fontSize: DENSITY.fontSizeTiny }}
        >
          <option value="ALL">ALL</option>
          <option value="1">Panel 1</option>
          <option value="2">Panel 2</option>
          <option value="3">Panel 3</option>
          <option value="4">Panel 4</option>
        </select>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>Click row to jump and replay context.</span>
      </div>
      {rows.length > 0 ? (
        <DenseTable
          columns={COLS}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          rowEntity={(r) => makeFunction(String(r.mnemonic), 'Navigation Target')}
          onRowClick={jump}
          keyboardNav
        />
      ) : (
        <EmptyFill hint="NO NAVIGATION TRAIL YET — USE GO/DRILL TO BUILD GRAPH" />
      )}
    </div>
  );
}
