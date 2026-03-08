'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { FIELD_CATALOG } from '../../services/fieldCatalog';
import { appendAuditEvent } from '../commandAuditStore';
import { makeField } from '../entities/types';
import { getActiveColumnSet, listColumnSetFields, setActiveColumnSet, type ColumnSetName, updateColumnSetFields } from '../columnSetStore';
import { MNEMONIC_DEFS } from '../MnemonicRegistry';
import { checkPolicy, loadPolicyState } from '../policyStore';
import { getEntitlementRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';

const SETS: ColumnSetName[] = ['default', 'risk', 'flow', 'fundamental'];

const COLS: DenseColumn[] = [
  { key: 'field', header: 'Field', width: '120px' },
  { key: 'label', header: 'Definition', width: '1fr' },
  { key: 'provenance', header: 'Prov', width: '70px' },
];

export function FnCOLS({ panelIdx = 0 }: { panelIdx?: number }) {
  const [mnemonic, setMnemonic] = useState('DES');
  const [activeSet, setActiveSet] = useState<ColumnSetName>(() => getActiveColumnSet('DES'));
  const [editFields, setEditFields] = useState('');
  const [refresh, setRefresh] = useState(0);

  const fields = listColumnSetFields(mnemonic, activeSet);

  const rows = useMemo(() => fields.map((field) => {
    const def = FIELD_CATALOG[field];
    return {
      id: field,
      field,
      label: def?.label ?? field,
      provenance: def?.provenance ?? 'SIM',
    };
  }), [fields]);

  const applySet = (nextSet: ColumnSetName) => {
    const policy = loadPolicyState();
    const role = getEntitlementRole(policy.activeRole);
    const gate = checkPolicy('COPY', policy.activeRole);
    if (!gate.allowed || !(role?.permissions.includes('COPY') ?? false)) {
      appendAuditEvent({
        panelIdx,
        type: 'POLICY_BLOCK',
        actor: policy.activeRole,
        detail: `Blocked COLS set change: ${gate.reason ?? 'Role denied'}`,
        mnemonic: 'COLS',
        security: '',
        policyReason: gate.reason,
      });
      appendErrorEntry({
        panelIdx,
        kind: 'POLICY',
        message: 'Column set switch blocked.',
        recovery: 'Check COMP/POL copy restrictions.',
        entity: 'COLS',
      });
      return;
    }
    setActiveSet(nextSet);
    setActiveColumnSet(mnemonic, nextSet);
    appendAuditEvent({
      panelIdx,
      type: 'POLICY_CHANGE',
      actor: 'USER',
      detail: `COLS active set ${nextSet} for ${mnemonic}`,
      mnemonic: 'COLS',
      security: '',
    });
    setRefresh((v) => v + 1);
  };

  const saveFields = () => {
    const policy = loadPolicyState();
    const role = getEntitlementRole(policy.activeRole);
    const gate = checkPolicy('COPY', policy.activeRole);
    if (!gate.allowed || !(role?.permissions.includes('COPY') ?? false)) {
      appendAuditEvent({
        panelIdx,
        type: 'POLICY_BLOCK',
        actor: policy.activeRole,
        detail: `Blocked COLS save: ${gate.reason ?? 'Role denied'}`,
        mnemonic: 'COLS',
        security: '',
        policyReason: gate.reason,
      });
      appendErrorEntry({
        panelIdx,
        kind: 'POLICY',
        message: 'Column set update blocked.',
        recovery: 'Review COMP no-copy lock and retry.',
        entity: 'COLS',
      });
      return;
    }
    const nextFields = editFields
      .split(',')
      .map((f) => f.trim().toUpperCase())
      .filter(Boolean);
    if (nextFields.length === 0) return;
    updateColumnSetFields(mnemonic, activeSet, nextFields);
    appendAuditEvent({
      panelIdx,
      type: 'POLICY_CHANGE',
      actor: 'USER',
      detail: `COLS fields updated for ${mnemonic}/${activeSet}`,
      mnemonic: 'COLS',
      security: '',
    });
    setEditFields('');
    setRefresh((v) => v + 1);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="COLS • Column Sets" right={<StatusBadge label={activeSet.toUpperCase()} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>Mnemonic</span>
        <select
          value={mnemonic}
          onChange={(e) => {
            const next = e.target.value;
            setMnemonic(next);
            setActiveSet(getActiveColumnSet(next));
            setRefresh((v) => v + 1);
          }}
          style={{ background: DENSITY.bgBase, color: DENSITY.textPrimary, border: `1px solid ${DENSITY.borderColor}`, fontSize: DENSITY.fontSizeTiny }}
        >
          {Object.values(MNEMONIC_DEFS).slice(0, 60).map((m) => <option key={m.code} value={m.code}>{m.code}</option>)}
        </select>
        {SETS.map((setName) => (
          <button
            key={setName}
            type="button"
            onClick={() => applySet(setName)}
            style={{ color: activeSet === setName ? DENSITY.accentAmber : DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}
          >
            {setName.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input
          value={editFields}
          onChange={(e) => setEditFields(e.target.value)}
          placeholder="Edit set fields comma-separated (e.g. PX_LAST,VWAP,BETA)"
          className="flex-1 bg-transparent outline-none"
        />
        <button type="button" onClick={saveFields}>SAVE SET</button>
      </div>
      <DenseTable
        columns={COLS}
        rows={rows}
        rowKey="id"
        panelIdx={panelIdx}
        className="flex-1 min-h-0"
        rowEntity={(r) => makeField(String(r.field))}
      />
    </div>
  );
}
