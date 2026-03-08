'use client';

export interface EntitlementRole {
  id: string;
  label: string;
  canExport: boolean;
  canMessage: boolean;
  canAlerts: boolean;
  notes: string;
  permissions: Array<'EXPORT' | 'MESSAGE' | 'ALERT_CREATE' | 'SEND_TO_PANEL' | 'COPY' | 'POLICY_ADMIN'>;
}

const ROLES: EntitlementRole[] = [
  { id: 'ADMIN', label: 'Admin', canExport: true, canMessage: true, canAlerts: true, notes: 'Full access', permissions: ['EXPORT', 'MESSAGE', 'ALERT_CREATE', 'SEND_TO_PANEL', 'COPY', 'POLICY_ADMIN'] },
  { id: 'OPS', label: 'Operations', canExport: true, canMessage: true, canAlerts: true, notes: 'Ops and reliability access', permissions: ['EXPORT', 'MESSAGE', 'ALERT_CREATE', 'SEND_TO_PANEL', 'COPY', 'POLICY_ADMIN'] },
  { id: 'PM', label: 'Portfolio Manager', canExport: true, canMessage: true, canAlerts: true, notes: 'Portfolio workflow', permissions: ['EXPORT', 'MESSAGE', 'ALERT_CREATE', 'SEND_TO_PANEL', 'COPY'] },
  { id: 'TRADER', label: 'Trader', canExport: true, canMessage: true, canAlerts: true, notes: 'Execution workflow', permissions: ['EXPORT', 'MESSAGE', 'ALERT_CREATE', 'SEND_TO_PANEL', 'COPY'] },
  { id: 'ANALYST', label: 'Analyst', canExport: false, canMessage: true, canAlerts: true, notes: 'No direct export', permissions: ['MESSAGE', 'ALERT_CREATE', 'SEND_TO_PANEL', 'COPY'] },
  { id: 'INTERN', label: 'Intern', canExport: false, canMessage: false, canAlerts: false, notes: 'Restricted', permissions: ['COPY'] },
];

export function listEntitlementRoles(): EntitlementRole[] {
  return ROLES;
}

export function isAllowedByRole(
  role: string,
  action: 'EXPORT' | 'MESSAGE' | 'ALERT_CREATE' | 'SEND_TO_PANEL' | 'COPY' | 'POLICY_ADMIN',
): boolean {
  const r = ROLES.find((item) => item.id === role);
  if (!r) return false;
  if (action === 'EXPORT') return r.canExport;
  if (action === 'MESSAGE') return r.canMessage;
  if (action === 'ALERT_CREATE') return r.canAlerts;
  return r.permissions.includes(action);
}

export function getEntitlementRole(role: string): EntitlementRole | undefined {
  return ROLES.find((r) => r.id === role);
}
