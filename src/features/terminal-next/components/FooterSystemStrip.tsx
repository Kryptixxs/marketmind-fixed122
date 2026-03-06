'use client';

import React, { useState, useEffect } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const stripStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1px 8px',
  background: '#060a13',
  borderTop: '1px solid #1e293b',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 9,
  fontVariantNumeric: 'tabular-nums',
  color: '#94a3b8',
  height: 20,
  flexShrink: 0,
};

const sep: React.CSSProperties = {
  margin: '0 6px',
  color: '#334155',
  userSelect: 'none',
};

const toggleBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #334155',
  borderRadius: 2,
  padding: '0 5px',
  cursor: 'pointer',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 9,
  lineHeight: '14px',
  fontWeight: 600,
};

export default function FooterSystemStrip() {
  const running = useTerminalStore((s) => s.running);
  const toggleRunning = useTerminalStore((s) => s.toggleRunning);
  const clock = useTerminalStore((s) => s.clock);
  const activeSymbol = useTerminalStore((s) => s.activeSymbol);

  const [utc, setUtc] = useState('');

  useEffect(() => {
    const update = () => {
      setUtc(new Date().toISOString().slice(11, 19));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={stripStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span>
          UTC <span style={{ color: '#e2e8f0' }}>{utc}</span>
        </span>
        <span style={sep}>|</span>
        <button
          onClick={toggleRunning}
          style={{
            ...toggleBtn,
            color: running ? '#10b981' : '#ef4444',
            borderColor: running ? '#10b98144' : '#ef444444',
          }}
        >
          {running ? 'RUNNING' : 'PAUSED'}
        </button>
        <span style={sep}>|</span>
        <span>
          TICK RATE: <span style={{ color: '#e2e8f0' }}>{clock.cadenceMs}ms</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>
          CONTEXT: <span style={{ color: '#3b82f6', fontWeight: 600 }}>{activeSymbol}</span>
        </span>
      </div>
    </div>
  );
}
export { FooterSystemStrip };
