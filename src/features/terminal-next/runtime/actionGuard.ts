'use client';

import { appendAuditEvent } from './commandAuditStore';
import { isAllowedByRole } from './entitlementsStore';
import { appendErrorEntry } from './errorConsoleStore';
import { checkPolicy, loadPolicyState } from './policyStore';

type GuardPermission = 'SEND_TO_PANEL' | 'COPY' | 'ALERT_CREATE' | 'EXPORT' | 'MESSAGE';

export function guardRuntimeAction(params: {
  panelIdx: number;
  permission: GuardPermission;
  mnemonic?: string;
  security?: string;
  detail: string;
  deniedMessage: string;
  deniedRecovery: string;
  actorOverride?: string;
}): boolean {
  const policy = loadPolicyState();
  const actor = params.actorOverride ?? policy.activeRole;
  const roleAllowed = isAllowedByRole(actor, params.permission);
  const policyGate = checkPolicy(params.permission, actor);
  if (roleAllowed && policyGate.allowed) return true;

  const policyReason = !roleAllowed
    ? `Role denied ${params.permission}`
    : (policyGate.reason ?? `${params.permission} denied`);
  appendAuditEvent({
    panelIdx: params.panelIdx,
    type: 'POLICY_BLOCK',
    actor,
    detail: params.detail,
    mnemonic: params.mnemonic,
    security: params.security,
    policyReason,
  });
  appendErrorEntry({
    panelIdx: params.panelIdx,
    kind: !roleAllowed ? 'PERMISSION' : 'POLICY',
    message: params.deniedMessage,
    recovery: params.deniedRecovery,
    entity: params.mnemonic,
  });
  return false;
}

