'use client';

import React, { createContext, useContext, useRef, useCallback } from 'react';

type ExecuteCommandFn = (cmd: string) => void;

interface TerminalContextMenuContextValue {
  registerExecuteCommand: (fn: ExecuteCommandFn) => () => void;
  executeCommand: ExecuteCommandFn;
}

const TerminalContextMenuContext = createContext<TerminalContextMenuContextValue | null>(null);

export function TerminalContextMenuProvider({ children }: { children: React.ReactNode }) {
  const executeRef = useRef<ExecuteCommandFn | null>(null);

  const registerExecuteCommand = useCallback((fn: ExecuteCommandFn) => {
    executeRef.current = fn;
    return () => { executeRef.current = null; };
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    executeRef.current?.(cmd);
  }, []);

  const value: TerminalContextMenuContextValue = { registerExecuteCommand, executeCommand };
  return (
    <TerminalContextMenuContext.Provider value={value}>
      {children}
    </TerminalContextMenuContext.Provider>
  );
}

export function useTerminalContextMenu() {
  return useContext(TerminalContextMenuContext);
}
