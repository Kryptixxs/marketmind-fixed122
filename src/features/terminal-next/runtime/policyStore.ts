'use client';

export interface ComplianceLocks {
  disableExport: boolean;
  disableMessaging: boolean;
  requireOverrideReasonCodes: boolean;
  noCopyOnSensitivePanels: boolean;
  disableSendToPanel: boolean;
}

export interface PolicyRule {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  effect: 'allow' | 'deny';
  action: 'EXPORT' | 'MESSAGE' | 'ALERT_CREATE' | 'SEND_TO_PANEL' | 'COPY' | 'POLICY_CHANGE';
  roles: string[];
}

export interface PolicyState {
  mode: 'normal' | 'restricted' | 'frozen';
  activeRole: string;
  locks: ComplianceLocks;
  rules: PolicyRule[];
}

const KEY = 'vantage-policy-state-v1';

const DEFAULT_STATE: PolicyState = {
  mode: 'normal',
  activeRole: 'TRADER',
  locks: {
    disableExport: false,
    disableMessaging: false,
    requireOverrideReasonCodes: false,
    noCopyOnSensitivePanels: false,
    disableSendToPanel: false,
  },
  rules: [
    {
      id: 'rule-export-restricted',
      name: 'Exports restricted by role',
      enabled: true,
      description: 'Only OPS, ADMIN, PM can export.',
      effect: 'deny',
      action: 'EXPORT',
      roles: ['ANALYST'],
    },
    {
      id: 'rule-alert-limited',
      name: 'Alert creation limited',
      enabled: false,
      description: 'Alert creation disabled for interns.',
      effect: 'deny',
      action: 'ALERT_CREATE',
      roles: ['INTERN'],
    },
    {
      id: 'rule-send-panel-intern',
      name: 'Send-to-panel denied for interns',
      enabled: true,
      description: 'Intern role cannot fan-out context to other panels.',
      effect: 'deny',
      action: 'SEND_TO_PANEL',
      roles: ['INTERN'],
    },
    {
      id: 'rule-policy-change-admin',
      name: 'Policy changes require admin/ops',
      enabled: true,
      description: 'Only ADMIN and OPS can modify compliance policy controls.',
      effect: 'deny',
      action: 'POLICY_CHANGE',
      roles: ['PM', 'TRADER', 'ANALYST', 'INTERN'],
    },
  ],
};

export function loadPolicyState(): PolicyState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PolicyState) : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export function savePolicyState(state: PolicyState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('vantage-policy-changed', { detail: state.mode }));
  } catch {
    // Ignore persistence failures.
  }
}

export function updatePolicyState(mutator: (prev: PolicyState) => PolicyState): PolicyState {
  const next = mutator(loadPolicyState());
  savePolicyState(next);
  return next;
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
  policyId?: string;
  mode?: PolicyState['mode'];
}

export function checkPolicy(action: PolicyRule['action'], roleOverride?: string): PolicyCheckResult {
  const state = loadPolicyState();
  const role = roleOverride ?? state.activeRole;
  if (state.mode === 'frozen' && action !== 'COPY') {
    return { allowed: false, reason: 'System frozen by compliance mode.', mode: state.mode };
  }
  if (state.mode === 'restricted') {
    if (action === 'EXPORT' && (role === 'ANALYST' || role === 'INTERN')) {
      return { allowed: false, reason: 'Restricted mode: exports limited to PM/TRADER/OPS/ADMIN.', mode: state.mode };
    }
    if (action === 'SEND_TO_PANEL' && role === 'INTERN') {
      return { allowed: false, reason: 'Restricted mode: intern send-to-panel disabled.', mode: state.mode };
    }
  }
  if (action === 'EXPORT' && state.locks.disableExport) return { allowed: false, reason: 'Export disabled by compliance lock.', mode: state.mode };
  if (action === 'MESSAGE' && state.locks.disableMessaging) return { allowed: false, reason: 'Messaging disabled by compliance lock.', mode: state.mode };
  if (action === 'SEND_TO_PANEL' && state.locks.disableSendToPanel) return { allowed: false, reason: 'Send-to-panel disabled by compliance lock.', mode: state.mode };
  if (action === 'COPY' && state.locks.noCopyOnSensitivePanels) return { allowed: false, reason: 'Copy disabled on sensitive panels.', mode: state.mode };

  const deny = state.rules.find(
    (r) => r.enabled && r.action === action && r.effect === 'deny' && r.roles.includes(role),
  );
  if (deny) return { allowed: false, reason: deny.description, policyId: deny.id, mode: state.mode };
  return { allowed: true, mode: state.mode };
}
