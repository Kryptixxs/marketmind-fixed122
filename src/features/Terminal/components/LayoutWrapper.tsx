'use client';

import { usePathname } from 'next/navigation';
import { TerminalWorkbench } from '@/features/terminal-next/components/TerminalWorkbench';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return (
      <main className="w-full min-h-[100dvh] bg-background text-text-primary overflow-x-hidden">
        {children}
      </main>
    );
  }

  return (
    <main className="w-full h-full min-h-0 overflow-hidden bg-[#05080d]">
      <TerminalWorkbench />
    </main>
  );
}
