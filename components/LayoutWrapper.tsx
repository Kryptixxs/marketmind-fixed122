'use client';

import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { SettingsModal } from './SettingsModal';
import { useSettings } from '@/context/SettingsContext';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings } = useSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ambient bias tracking (listens to custom event from dashboard)
  const [ambientBias, setAmbientBias] = useState<'neutral' | 'bullish' | 'bearish'>('neutral');

  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true);
    const handleBias = (e: any) => setAmbientBias(e.detail);
    
    window.addEventListener('vantage-open-settings', handleOpenSettings);
    window.addEventListener('vantage-ambient-bias', handleBias);
    
    return () => {
      window.removeEventListener('vantage-open-settings', handleOpenSettings);
      window.removeEventListener('vantage-ambient-bias', handleBias);
    };
  }, []);

  useEffect(() => {
    document.body.className = `flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden text-text-primary antialiased theme-${settings.uiTheme}`;
  }, [settings.uiTheme]);

  // Spatial Light Leak Tracking (Architect Only)
  useEffect(() => {
    if (settings.uiTheme !== 'architect') return;
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const { clientX, clientY } = e;
        containerRef.current.style.setProperty('--mouse-x', `${clientX}px`);
        containerRef.current.style.setProperty('--mouse-x', `${clientX}px`);
        containerRef.current.style.setProperty('--mouse-y', `${clientY}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [settings.uiTheme]);

  const ambientShadow = settings.uiTheme === 'architect' 
    ? ambientBias === 'bullish' ? 'inset 0 0 120px rgba(45, 212, 191, 0.03)' 
    : ambientBias === 'bearish' ? 'inset 0 0 120px rgba(251, 113, 133, 0.03)' 
    : 'none'
    : 'none';

  return (
    <div 
      ref={containerRef}
      className="flex flex-col-reverse md:flex-row h-full w-full relative transition-all duration-1000"
      style={{ boxShadow: ambientShadow }}
    >
      {/* Architect Spatial Light Leak */}
      {settings.uiTheme === 'architect' && (
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(600px circle at var(--mouse-x, 50vw) var(--mouse-y, 50vh), rgba(255,255,255,0.03), transparent 40%)'
          }}
        />
      )}
      
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 relative overflow-hidden bg-transparent z-10">
        {children}
      </main>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}