'use client';

import dynamic from 'next/dynamic';

const TerminalWorkbench = dynamic(
  () => import('@/features/terminal-next/components/TerminalWorkbench'),
  { ssr: false }
);

export default function TerminalPage() {
  return (
    <div className="h-full w-full overflow-hidden">
      <TerminalWorkbench />
    </div>
  );
}
