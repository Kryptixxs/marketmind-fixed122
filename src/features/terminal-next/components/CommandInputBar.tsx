'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useTerminalStore } from '../store/TerminalStore';

const barStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 6px',
  background: '#0c1221',
  borderTop: '1px solid #1e293b',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#e2e8f0',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  fontVariantNumeric: 'tabular-nums',
  padding: 0,
  caretColor: '#3b82f6',
};

export default function CommandInputBar() {
  const [value, setValue] = useState('');
  const [lastResult, setLastResult] = useState('');
  const executeCommand = useTerminalStore((s) => s.executeCommand);
  const commandLog = useTerminalStore((s) => s.commandLog);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      executeCommand(trimmed);
      setLastResult(trimmed);
      setValue('');
    },
    [value, executeCommand],
  );

  return (
    <div style={barStyle}>
      <span style={{ color: '#3b82f6', fontWeight: 700, userSelect: 'none' }}>&gt;</span>
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex' }}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          style={inputStyle}
          placeholder="ENTER COMMAND..."
          spellCheck={false}
          autoComplete="off"
        />
      </form>
      {lastResult && (
        <span style={{ color: '#475569', fontSize: 9, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          LAST: {lastResult}
        </span>
      )}
      <span style={{ color: '#475569', fontSize: 9 }}>
        [{commandLog.length}]
      </span>
    </div>
  );
}
