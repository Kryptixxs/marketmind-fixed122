'use client';

import { NewTerminalWorkbench } from '@/features/terminal-next/runtime/NewTerminalWorkbench';

export function TerminalRuntimeView({ bootCommand }: { bootCommand?: string }) {
  return (
    <div className="h-full w-full min-h-0 min-w-0 overflow-hidden">
      <NewTerminalWorkbench bootCommand={bootCommand} />
    </div>
  );
}
