'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { addPinItem, listPinItems, removePinItem } from '../pinboardStore';
import { appendAuditEvent } from '../commandAuditStore';
import { makeSecurity } from '../entities/types';
import { useTerminalOS } from '../TerminalOSContext';
import { checkPolicy, loadPolicyState } from '../policyStore';
import { getEntitlementRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';

const COLS: DenseColumn[] = [
  { key: 'label', header: 'Pin', width: '1fr' },
  { key: 'value', header: 'Value', width: '120px' },
  { key: 'provenance', header: 'Prov', width: '70px' },
  { key: 'target', header: 'Target', width: '110px' },
];

export function FnPIN({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels, navigatePanel } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [refresh, setRefresh] = useState(0);

  const pins = listPinItems(400);
  const rows = useMemo(() => pins.map((pin) => ({
    id: pin.id,
    label: pin.label,
    value: pin.value,
    provenance: pin.provenance,
    target: pin.targetMnemonic,
    targetMnemonic: pin.targetMnemonic,
    targetSecurity: pin.targetSecurity ?? '',
  })), [pins]);

  const addCurrent = () => {
    const policy = loadPolicyState();
    const role = getEntitlementRole(policy.activeRole);
    const gate = checkPolicy('COPY', policy.activeRole);
    if (!gate.allowed || !(role?.permissions.includes('COPY') ?? false)) {
      appendAuditEvent({
        panelIdx,
        type: 'POLICY_BLOCK',
        actor: policy.activeRole,
        detail: `Blocked pin add: ${gate.reason ?? 'Role denied'}`,
        mnemonic: 'PIN',
        security: p.activeSecurity,
        policyReason: gate.reason,
      });
      appendErrorEntry({
        panelIdx,
        kind: 'POLICY',
        message: 'Pinboard update blocked.',
        recovery: 'Check COMP/POL copy restrictions.',
        entity: 'PIN',
      });
      return;
    }
    addPinItem({
      label: label.trim() || `${p.activeMnemonic} ${p.activeSecurity}`,
      value: value.trim() || p.activeSecurity,
      provenance: 'SIM',
      targetMnemonic: p.activeMnemonic,
      targetSecurity: p.activeSecurity,
      fieldId: undefined,
    });
    appendAuditEvent({
      panelIdx,
      type: 'PIN_UPDATE',
      actor: 'USER',
      detail: `PIN add ${p.activeMnemonic} ${p.activeSecurity}`,
      mnemonic: 'PIN',
      security: p.activeSecurity,
    });
    setLabel('');
    setValue('');
    setRefresh((v) => v + 1);
  };

  const deleteSelected = (id: string) => {
    const policy = loadPolicyState();
    const gate = checkPolicy('COPY', policy.activeRole);
    if (!gate.allowed) {
      appendAuditEvent({
        panelIdx,
        type: 'POLICY_BLOCK',
        actor: policy.activeRole,
        detail: `Blocked pin remove: ${gate.reason ?? 'Policy denied'}`,
        mnemonic: 'PIN',
        security: p.activeSecurity,
        policyReason: gate.reason,
      });
      appendErrorEntry({
        panelIdx,
        kind: 'POLICY',
        message: 'Pinboard delete blocked.',
        recovery: 'Adjust no-copy lock in COMP.',
        entity: 'PIN',
      });
      return;
    }
    removePinItem(id);
    appendAuditEvent({
      panelIdx,
      type: 'PIN_UPDATE',
      actor: 'USER',
      detail: `PIN remove ${id}`,
      mnemonic: 'PIN',
      security: p.activeSecurity,
    });
    setRefresh((v) => v + 1);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="PIN • Pinboard Strip" right={<StatusBadge label={`${rows.length} PINS`} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className="flex-1 bg-transparent outline-none" />
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value" className="flex-1 bg-transparent outline-none" />
        <button type="button" onClick={addCurrent}>PIN CURRENT</button>
      </div>
      {rows.length > 0 ? (
        <DenseTable
          columns={COLS}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          keyboardNav
          rowEntity={(r) => makeSecurity(String(r.targetSecurity || p.activeSecurity))}
          onRowClick={(r) => navigatePanel(panelIdx, String(r.targetMnemonic), String(r.targetSecurity || p.activeSecurity), p.marketSector)}
        />
      ) : (
        <EmptyFill hint="NO PINS YET — PIN CURRENT CONTEXT TO BUILD STRIP" />
      )}
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderTop: `1px solid ${DENSITY.gridlineColor}` }}>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>Quick delete:</span>
        <select
          defaultValue=""
          onChange={(e) => {
            if (!e.target.value) return;
            deleteSelected(e.target.value);
            e.target.value = '';
          }}
          style={{ background: DENSITY.bgBase, color: DENSITY.textPrimary, border: `1px solid ${DENSITY.borderColor}`, fontSize: DENSITY.fontSizeTiny }}
        >
          <option value="">Select pin id...</option>
          {rows.map((r) => <option key={String(r.id)} value={String(r.id)}>{String(r.id)} {String(r.label)}</option>)}
        </select>
      </div>
    </div>
  );
}
