'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { SettingsModal } from './SettingsModal';
import { useSettings } from '@/context/SettingsContext';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    window.addEventListener('vantage-open-settings', handleOpenSettings);
    return () => window.removeEventListener('vantage-open-settings', handleOpenSettings);
  }, []);

  // Sync theme to document body
  useEffect(() => {
    document.body.className = `flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden text-text-primary antialiased theme-${settings.uiTheme}`;
  }, [settings.uiTheme]);

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden bg-background">
        {children}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}