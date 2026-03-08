'use client';

import React, { useState } from 'react';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { checkPolicy, loadPolicyState, savePolicyState } from '../policyStore';
import { DENSITY } from '../../constants/layoutDensity';
import { appendAuditEvent } from '../commandAuditStore';
import { makeFunction } from '../entities/types';
import { getEntitlementRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';

const COLS: DenseColumn[] = [
  { key: 'name', header: 'Rule', width: '1fr' },
  { key: 'action', header: 'Action', width: '110px' },
  { key: 'effect', header: 'Effect', width: '70px' },
  { key: 'roles', header: 'Roles', width: '160px' },
  { key: 'description', header: 'Reason', width: '1fr' },
  { key: 'enabled', header: 'Enabled', width: '80px' },
];

export function FnPOL({ panelIdx = 0 }: { panelIdx?: number }) {
  const [refresh, setRefresh] = useState(0);
  const [actionFilter, setActionFilter] = useState<'ALL' | 'EXPORT' | 'MESSAGE' | 'ALERT_CREATE' | 'SEND_TO_PANEL' | 'COPY' | 'POLICY_CHANGE'>('ALL');
  const [textFilter, setTextFilter] = useState('');
  const state = loadPolicyState();
  const role = getEntitlementRole(state.activeRole);

  const canChangePolicy = () => {
    const gate = checkPolicy('POLICY_CHANGE', state.activeRole);
    const roleAllowed = role?.permissions.includes('POLICY_ADMIN') ?? false;
    if (!gate.allowed || !roleAllowed) {
      appendAuditEvent({
        panelIdx,
        type: 'POLICY_BLOCK',
        actor: state.activeRole,
        detail: `Blocked POL change: ${gate.reason ?? 'Role lacks POLICY_ADMIN'}`,
        mnemonic: 'POL',
      });
      appendErrorEntry({
        panelIdx,
        kind: 'PERMISSION',
        message: 'Policy rule change blocked.',
        recovery: 'Switch to ADMIN/OPS role in ENT.',
        entity: 'POL',
      });
      return false;
    }
    return true;
  };

  const rows = state.rules.map((r) => ({
    id: r.id,
    name: r.name,
    action: r.action,
    effect: r.effect.toUpperCase(),
    roles: r.roles.join(','),
    description: r.description,
    enabled: r.enabled ? 'YES' : 'NO',
  }))
    .filter((r) => actionFilter === 'ALL' || r.action === actionFilter)
    .filter((r) => !textFilter.trim() || `${r.name} ${r.description} ${r.roles}`.toUpperCase().includes(textFilter.trim().toUpperCase()));

  const setMode = (mode: 'normal' | 'restricted' | 'frozen') => {
    if (!canChangePolicy()) return;
    savePolicyState({ ...state, mode });
    appendAuditEvent({ panelIdx, type: 'POLICY_CHANGE', actor: 'USER', detail: `POL mode=${mode}`, mnemonic: 'POL' });
    setRefresh((v) => v + 1);
  };

  const toggleRule = (id: string) => {
    if (!canChangePolicy()) return;
    const nextRule = state.rules.find((r) => r.id === id);
    savePolicyState({
      ...state,
      rules: state.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    });
    appendAuditEvent({
      panelIdx,
      type: 'POLICY_CHANGE',
      actor: 'USER',
      detail: `POL ${id}=${nextRule?.enabled ? 'DISABLED' : 'ENABLED'}`,
      mnemonic: 'POL',
      policyReason: nextRule?.description,
    });
    setRefresh((v) => v + 1);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="POL • Policy Rules Engine (Sim)" right={<StatusBadge label={state.mode.toUpperCase()} variant={state.mode === 'normal' ? 'live' : 'stale'} />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.rowHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>Mode</span>
        <button type="button" onClick={() => setMode('normal')}>NORMAL</button>
        <button type="button" onClick={() => setMode('restricted')}>RESTRICTED</button>
        <button type="button" onClick={() => setMode('frozen')}>FROZEN</button>
      </div>
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value as typeof actionFilter)}
          style={{ background: DENSITY.bgBase, color: DENSITY.textPrimary, border: `1px solid ${DENSITY.borderColor}`, fontSize: DENSITY.fontSizeTiny }}
        >
          <option value="ALL">ALL ACTIONS</option>
          <option value="EXPORT">EXPORT</option>
          <option value="MESSAGE">MESSAGE</option>
          <option value="ALERT_CREATE">ALERT_CREATE</option>
          <option value="SEND_TO_PANEL">SEND_TO_PANEL</option>
          <option value="COPY">COPY</option>
          <option value="POLICY_CHANGE">POLICY_CHANGE</option>
        </select>
        <input value={textFilter} onChange={(e) => setTextFilter(e.target.value)} placeholder="Filter by role/rule/reason..." className="flex-1 bg-transparent outline-none" />
      </div>
      <DenseTable
        columns={COLS}
        rows={rows}
        rowKey="id"
        panelIdx={panelIdx}
        className="flex-1 min-h-0"
        onRowClick={(r) => toggleRule(String(r.id))}
        rowEntity={(r) => makeFunction('AUD', `Policy trace ${String(r.id)}`)}
      />
    </div>
  );
}
