'use client';

import React, { useState } from 'react';
import { PanelSubHeader, StatusBadge } from '../primitives';
import { DENSITY } from '../../constants/layoutDensity';
import { checkPolicy, loadPolicyState, savePolicyState } from '../policyStore';
import { appendAuditEvent } from '../commandAuditStore';
import { getEntitlementRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';

export function FnCOMP({ panelIdx = 0 }: { panelIdx?: number }) {
  const [tick, setTick] = useState(0);
  const policy = loadPolicyState();
  const role = getEntitlementRole(policy.activeRole);

  const canChangePolicy = () => {
    const gate = checkPolicy('POLICY_CHANGE', policy.activeRole);
    const roleAllowed = role?.permissions.includes('POLICY_ADMIN') ?? false;
    if (!gate.allowed || !roleAllowed) {
      appendAuditEvent({
        panelIdx,
        type: 'POLICY_BLOCK',
        actor: policy.activeRole,
        detail: `Blocked COMP change: ${gate.reason ?? 'Role lacks POLICY_ADMIN'}`,
        mnemonic: 'COMP',
      });
      appendErrorEntry({
        panelIdx,
        kind: 'PERMISSION',
        message: 'Compliance change blocked.',
        recovery: 'Switch to ADMIN/OPS role in ENT.',
        entity: 'COMP',
      });
      return false;
    }
    return true;
  };

  const setLock = (key: keyof typeof policy.locks, value: boolean) => {
    if (!canChangePolicy()) return;
    savePolicyState({ ...policy, locks: { ...policy.locks, [key]: value } });
    appendAuditEvent({
      panelIdx,
      type: 'POLICY_CHANGE',
      actor: 'USER',
      detail: `COMP ${key}=${value ? 'LOCKED' : 'OPEN'}`,
      mnemonic: 'COMP',
    });
    setTick((v) => v + 1);
  };

  const setMode = (mode: 'normal' | 'restricted' | 'frozen') => {
    if (!canChangePolicy()) return;
    savePolicyState({ ...policy, mode });
    appendAuditEvent({
      panelIdx,
      type: 'POLICY_CHANGE',
      actor: 'USER',
      detail: `COMP mode=${mode}`,
      mnemonic: 'COMP',
    });
    setTick((v) => v + 1);
  };

  const locks = [
    { key: 'disableExport', label: 'Disable Export' },
    { key: 'disableMessaging', label: 'Disable Messaging' },
    { key: 'requireOverrideReasonCodes', label: 'Require Override Reason Codes' },
    { key: 'noCopyOnSensitivePanels', label: 'No Copy On Sensitive Panels' },
    { key: 'disableSendToPanel', label: 'Disable Send-to-Panel' },
  ] as const;

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="COMP • Compliance Lock Modes" right={<StatusBadge label={policy.mode.toUpperCase()} variant={policy.mode === 'normal' ? 'live' : 'stale'} />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <button type="button" onClick={() => setMode('normal')} style={{ color: policy.mode === 'normal' ? DENSITY.accentAmber : DENSITY.textMuted }}>NORMAL</button>
        <button type="button" onClick={() => setMode('restricted')} style={{ color: policy.mode === 'restricted' ? DENSITY.accentAmber : DENSITY.textMuted }}>RESTRICTED</button>
        <button type="button" onClick={() => setMode('frozen')} style={{ color: policy.mode === 'frozen' ? DENSITY.accentAmber : DENSITY.textMuted }}>FROZEN</button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar" style={{ padding: DENSITY.pad4 }}>
        {locks.map((lock) => (
          <div key={lock.key} className="flex items-center justify-between" style={{ height: DENSITY.rowHeightPx + 4, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
            <span style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault }}>{lock.label}</span>
            <button
              type="button"
              onClick={() => setLock(lock.key, !policy.locks[lock.key])}
              style={{ color: policy.locks[lock.key] ? DENSITY.accentRed : DENSITY.accentGreen, border: `1px solid ${policy.locks[lock.key] ? DENSITY.accentRed : DENSITY.accentGreen}`, background: 'none', padding: '0 6px', fontSize: DENSITY.fontSizeTiny }}
            >
              {policy.locks[lock.key] ? 'LOCKED' : 'OPEN'}
            </button>
          </div>
        ))}
        <div style={{ color: DENSITY.textMuted, fontSize: DENSITY.fontSizeTiny, marginTop: DENSITY.pad4 }}>
          Runtime tick: {tick} • Blocks are logged in AUD/ERR.
        </div>
      </div>
    </div>
  );
}
