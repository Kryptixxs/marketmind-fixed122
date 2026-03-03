'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { SettingsModal } from './SettingsModal';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <Sidebar onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="flex-1 flex flex-col min-w-0 bg-background relative">
        {children}
      </main>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
