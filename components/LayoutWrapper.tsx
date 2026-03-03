'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { SettingsModal } from './SettingsModal';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background relative overflow-hidden">
        {children}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}