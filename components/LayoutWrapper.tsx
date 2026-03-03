'use client';

import { useEffect } from 'react';
import { useSettings } from '@/context/SettingsContext';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    document.body.className = `theme-${settings.uiTheme} bg-background text-text-primary overflow-hidden`;
  }, [settings.uiTheme]);

  return (
    <main className="h-screen w-screen flex flex-col bg-background">
      {children}
    </main>
  );
}