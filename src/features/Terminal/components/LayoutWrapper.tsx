'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { LayoutSettingsModal } from '@/components/ui/LayoutSettingsModal';
import { CommandPalette } from './CommandPalette';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleOpenLayout = () => setIsLayoutOpen(true);

    window.addEventListener('vantage-open-settings', handleOpenSettings);
    window.addEventListener('vantage-open-layout', handleOpenLayout);

    return () => {
      window.removeEventListener('vantage-open-settings', handleOpenSettings);
      window.removeEventListener('vantage-open-layout', handleOpenLayout);
    };
  }, []);

  const isPublicPage = pathname === '/' || pathname === '/login' || pathname === '/register';

  if (isPublicPage) {
    return (
      <main className="w-full min-h-[100dvh] bg-background text-text-primary overflow-x-hidden">
        {children}
      </main>
    );
  }

  // Terminal shell: sidebar + content + status bar
  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-background relative overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          {children}
        </main>
        <StatusBar />
      </div>
      <CommandPalette />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <LayoutSettingsModal isOpen={isLayoutOpen} onClose={() => setIsLayoutOpen(false)} />
    </>
  );
}