'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { LayoutSettingsModal } from '@/components/ui/LayoutSettingsModal';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);

  useEffect(() => {
    // Listen for custom events
    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleOpenLayout = () => setIsLayoutOpen(true);

    window.addEventListener('vantage-open-settings', handleOpenSettings);
    window.addEventListener('vantage-open-layout', handleOpenLayout);

    return () => {
      window.removeEventListener('vantage-open-settings', handleOpenSettings);
      window.removeEventListener('vantage-open-layout', handleOpenLayout);
    };
  }, []);

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background relative overflow-hidden">
        {children}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <LayoutSettingsModal isOpen={isLayoutOpen} onClose={() => setIsLayoutOpen(false)} />
    </>
  );
}