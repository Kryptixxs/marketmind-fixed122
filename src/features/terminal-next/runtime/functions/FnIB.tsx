'use client';

import React, { useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader } from '../primitives';

const MESSAGES = [
  { from: 'DESK', time: '14:32', text: 'Heads up — large block crossing in NVDA' },
  { from: 'SALES', time: '14:28', text: 'Client looking for 50K AAPL US @ mkt' },
  { from: 'RISK', time: '14:15', text: 'Notional limit 80% utilized. Reduce if possible.' },
  { from: 'DESK', time: '13:58', text: 'ECB decision in 2 min. Expect vol spike in EUR pairs' },
  { from: 'SALES', time: '13:45', text: 'Can you run a TCA on last week MSFT fills?' },
  { from: 'SYS', time: '13:30', text: 'B-PIPE reconnected. Latency normalized.' },
];

export function FnIB() {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState(MESSAGES);

  const send = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setMsgs([{ from: 'YOU', time, text: input.trim() }, ...msgs]);
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
      <div className="flex items-center flex-none" style={{ height: DENSITY.commandBarHeightPx, background: '#111', borderTop: `1px solid ${DENSITY.gridlineColor}`, padding: `0 ${DENSITY.pad4}px`, gap: 4 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Type message..." className="flex-1 bg-transparent outline-none" style={{ color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily }} />
        <button type="button" onClick={send} style={{ color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny }}>SEND</button>
      </div>
    </div>
  );
}
