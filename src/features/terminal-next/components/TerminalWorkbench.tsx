'use client';

import React from 'react';
import { TerminalProvider } from '../store/TerminalStore';
import { TerminalLayoutProvider } from '../context/TerminalLayoutContext';
import { TerminalHotkeys } from './TerminalHotkeys';
import { CommandCenterLayout } from '../layout/CommandCenterLayout';

export function TerminalWorkbench() {
  return (
    <TerminalLayoutProvider>
      <TerminalProvider>
        <TerminalHotkeys />
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
          <CommandCenterLayout />
        </div>
      </TerminalProvider>
    </TerminalLayoutProvider>
  );
}
