'use client';

import React, { useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { appendAuditEvent } from '../commandAuditStore';
import { checkPolicy, loadPolicyState } from '../policyStore';
import { isAllowedByRole } from '../entitlementsStore';
import { appendErrorEntry } from '../errorConsoleStore';

const MESSAGES = [
  { from: 'DESK', time: '14:32', text: 'Heads up — large block crossing in NVDA' },
  { from: 'SALES', time: '14:28', text: 'Client looking for 50K AAPL US @ mkt' },
  { from: 'RISK', time: '14:15', text: 'Notional limit 80% utilized. Reduce if possible.' },
  { from: 'DESK', time: '13:58', text: 'ECB decision in 2 min. Expect vol spike in EUR pairs' },
  { from: 'SALES', time: '13:45', text: 'Can you run a TCA on last week MSFT fills?' },
  { from: 'SYS', time: '13:30', text: 'B-PIPE reconnected. Latency normalized.' },
];

export function FnIB({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState(MESSAGES);
  const [withContext, setWithContext] = useState(true);

  const send = () => {
    if (!input.trim()) return;
    const policy = loadPolicyState();
    if (!isAllowedByRole(policy.activeRole, 'MESSAGE')) {
      appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: 'Blocked message send: role denied', mnemonic: 'IB', security: p.activeSecurity, policyReason: 'Role denied MESSAGE' });
      appendErrorEntry({ panelIdx, kind: 'PERMISSION', message: 'Role cannot send messages.', recovery: 'Switch role in ENT or disable restriction.' });
      return;
    }
    const gate = checkPolicy('MESSAGE', policy.activeRole);
    if (!gate.allowed) {
      appendAuditEvent({ panelIdx, type: 'POLICY_BLOCK', actor: policy.activeRole, detail: `Blocked message send: ${gate.reason ?? 'Policy denied'}`, mnemonic: 'IB', security: p.activeSecurity, policyReason: gate.reason });
      appendErrorEntry({ panelIdx, kind: 'POLICY', message: 'Messaging blocked by compliance lock.', recovery: 'Open COMP/POL and allow messaging.' });
      return;
    }
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const context = withContext ? ` [${p.activeSecurity} ${p.activeMnemonic}]` : '';
    setMsgs([{ from: 'YOU', time, text: `${input.trim()}${context}` }, ...msgs]);
    appendAuditEvent({
      panelIdx,
      type: 'MESSAGE',
      actor: policy.activeRole,
      detail: `IB message${withContext ? ` with context ${p.activeSecurity} ${p.activeMnemonic}` : ''}`,
      mnemonic: 'IB',
      security: p.activeSecurity,
    });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="IB • Instant Bloomberg" />
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar flex flex-col-reverse" style={{ fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeDefault }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ padding: `${DENSITY.pad2}px ${DENSITY.pad4}px`, borderBottom: `1px solid ${DENSITY.gridlineColor}` }} className="flex gap-1">
            <span style={{ color: DENSITY.accentAmber, width: 40, fontSize: DENSITY.fontSizeTiny }} className="shrink-0 tabular-nums">{m.time}</span>
            <span style={{ color: DENSITY.accentCyan, width: 40, fontSize: DENSITY.fontSizeTiny }} className="shrink-0">{m.from}</span>
            <span style={{ color: m.from === 'YOU' ? '#fff' : DENSITY.textPrimary }}>{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center flex-none" style={{ height: DENSITY.commandBarHeightPx, background: DENSITY.bgSurface, borderTop: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 4 }}>
        <button type="button" onClick={() => setWithContext((v) => !v)}
          style={{ color: withContext ? DENSITY.accentCyan : DENSITY.textMuted, border: `1px solid ${withContext ? DENSITY.accentCyan : DENSITY.borderColor}`, background: 'none', fontSize: DENSITY.fontSizeTiny, padding: '0 4px', cursor: 'pointer' }}
          title="Attach current security/function context">
          CTX {withContext ? 'ON' : 'OFF'}
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Type message..." className="flex-1 bg-transparent outline-none" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }} />
        <button type="button" onClick={send} style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny }}>SEND</button>
      </div>
    </div>
  );
}
