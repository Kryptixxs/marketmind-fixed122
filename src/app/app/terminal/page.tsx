'use client';

import { NewTerminalWorkbench } from '@/features/terminal-next/runtime/NewTerminalWorkbench';
import { FunctionExplorer } from '@/app/_components/FunctionExplorer';

export default function AppTerminalPage() {
  return (
    <div className="space-y-3">
      <section className="border border-border p-2 bg-surface/20">
        <div className="text-xs font-semibold mb-2">Terminal Workspace</div>
        <div className="h-[78vh] border border-border overflow-hidden">
          <NewTerminalWorkbench />
        </div>
      </section>
      <FunctionExplorer limit={20} />
    </div>
  );
}

