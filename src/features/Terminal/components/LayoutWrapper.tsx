'use client';

import { usePathname } from 'next/navigation';
import { TerminalWorkbench } from '@/features/terminal-next/components/TerminalWorkbench';
import { TunnelProvider } from '@/features/Terminal/context/TunnelContext';
import { CommandPalette } from '@/features/Terminal/components/CommandPalette';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return (
      <main className="w-full min-h-screen bg-background text-text-primary overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <TunnelProvider>
      <main className="w-full h-[100dvh] min-h-0 overflow-hidden bg-[#05080d] relative flex flex-col">
        <TerminalWorkbench />
        <CommandPalette />
      </main>
    </TunnelProvider>
  );
}
