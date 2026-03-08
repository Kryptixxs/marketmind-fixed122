'use client';

import React, { useMemo } from 'react';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { getEntitlementRole, listEntitlementRoles } from '../entitlementsStore';
import { loadPolicyState, savePolicyState } from '../policyStore';
import { DENSITY } from '../../constants/layoutDensity';
import { appendAuditEvent } from '../commandAuditStore';
import { makeFunction } from '../entities/types';

const COLS: DenseColumn[] = [
  { key: 'role', header: 'Role', width: '110px' },
  { key: 'export', header: 'Export', width: '70px' },
  { key: 'message', header: 'Message', width: '80px' },
  { key: 'alerts', header: 'Alerts', width: '70px' },
  { key: 'send', header: 'Send', width: '60px' },
  { key: 'copy', header: 'Copy', width: '60px' },
  { key: 'admin', header: 'PolAdm', width: '70px' },
  { key: 'notes', header: 'Rationale', width: '1fr' },
];

export function FnENT({ panelIdx = 0 }: { panelIdx?: number }) {
  const [, setRefresh] = React.useState(0);
  const policy = loadPolicyState();
  const roles = listEntitlementRoles();
  const activeRole = getEntitlementRole(policy.activeRole);
  const rows = useMemo(() => roles.map((r) => ({
    id: r.id,
    role: r.id,
    export: r.canExport ? 'ALLOW' : 'DENY',
    message: r.canMessage ? 'ALLOW' : 'DENY',
    alerts: r.canAlerts ? 'ALLOW' : 'DENY',
    send: r.permissions.includes('SEND_TO_PANEL') ? 'Y' : 'N',
    copy: r.permissions.includes('COPY') ? 'Y' : 'N',
    admin: r.permissions.includes('POLICY_ADMIN') ? 'Y' : 'N',
    notes: r.notes,
  })), [roles]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="ENT • Entitlements Matrix" right={<StatusBadge label={policy.activeRole} variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: 17, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <span style={{ color: DENSITY.textSecondary, fontSize: 9 }}>Active role:</span>
        <select
          value={policy.activeRole}
          onChange={(e) => {
            savePolicyState({ ...policy, activeRole: e.target.value });
            appendAuditEvent({ panelIdx, type: 'POLICY_CHANGE', actor: 'USER', detail: `ENT active role ${e.target.value}`, mnemonic: 'ENT' });
            setRefresh((v) => v + 1);
          }}
          style={{ background: DENSITY.bgBase, border: `1px solid ${DENSITY.borderColor}`, color: DENSITY.textPrimary, fontSize: 9 }}
        >
          {roles.map((r) => <option key={r.id} value={r.id}>{r.id}</option>)}
        </select>
        <span style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny }}>
          {activeRole?.notes ?? 'No rationale'}
        </span>
      </div>
      <DenseTable
        columns={COLS}
        rows={rows}
        rowKey="id"
        panelIdx={panelIdx}
        className="flex-1 min-h-0"
        rowEntity={(r) => makeFunction('POL', `Role ${String(r.role)} policy view`)}
      />
    </div>
  );
}
