'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutGrid, LineChart, Newspaper, Settings, Terminal, 
  Cpu, Search, Bell, Calendar, Zap, Monitor, Code
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { NotificationsPanel } from './notifications/NotificationsPanel';
import { useSettings } from '@/context/SettingsContext';

const NAV_ITEMS = [
  { href: '/', icon: LayoutGrid, label: 'Workspace', key: '1' },
  { href: '/calendar', icon: Calendar, label: 'Calendar', key: '2' },
  { href: '/charts', icon: LineChart, label: 'Technical', key: '3' },
  { href: '/news', icon: Newspaper, label: 'Wire', key: '5' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { settings, setUITheme } = useSettings();

  const isTerminal = settings.uiTheme === 'terminal';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const item = NAV_ITEMS.find(i => i.key === e.key);
      if (item) { e.preventDefault(); router.push(item.href); }
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setIsSettingsOpen(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <>
      <div className={`w-full h-14 md:w-16 md:h-full flex flex-row md:flex-col items-center md:py-4 z-50 shrink-0 overflow-x-auto md:overflow-x-visible hide-scrollbar ${isTerminal ? 'border-t md:border-t-0 md:border-r border-border bg-black' : 'bg-surface/50 backdrop-blur-xl border-border'}`}>
        
        {/* Brand Icon */}
        <Link href="/" className="hidden md:flex mb-8 text-text-primary hover:text-accent transition-colors">
          <Terminal size={24} strokeWidth={1.5} />
        </Link>

        {/* Nav Items */}
        <nav className="flex flex-row md:flex-col gap-4 px-4 flex-1 md:flex-none justify-evenly md:justify-start w-full min-w-max">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center justify-center w-10 h-10 md:w-10 md:h-10 transition-all duration-300
                  ${isActive 
                    ? isTerminal ? 'bg-accent text-accent-text' : 'bg-accent/10 text-accent shadow-[0_0_12px_rgba(45,212,191,0.2)] rounded-lg' 
                    : isTerminal ? 'text-text-secondary hover:text-accent hover:bg-border' : 'text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg'}
                `}
              >
                <item.icon size={18} strokeWidth={isActive && isTerminal ? 2.5 : 1.5} />
              </Link>
            );
          })}
        </nav>

        {/* Bottom / Right Control Center */}
        <div className="flex flex-row md:flex-col gap-4 px-4 md:mt-auto items-center min-w-max border-l md:border-l-0 md:border-t border-border/50 pl-4 md:pl-0 md:pt-6">
           
           {/* Theme Toggle */}
           <div className={`flex flex-row md:flex-col p-1 gap-1 mb-2 ${isTerminal ? 'border border-border' : 'bg-background rounded-full border border-border/50'}`}>
              <button 
                onClick={() => setUITheme('architect')}
                className={`p-2 transition-all ${!isTerminal ? 'bg-surface rounded-full text-accent shadow-sm' : 'text-text-tertiary hover:text-text-primary'}`}
                title="Architect Theme"
              >
                <Monitor size={14} />
              </button>
              <button 
                onClick={() => setUITheme('terminal')}
                className={`p-2 transition-all ${isTerminal ? 'bg-accent text-accent-text' : 'text-text-tertiary hover:text-text-primary rounded-full'}`}
                title="Terminal Theme"
              >
                <Code size={14} />
              </button>
           </div>

           <button onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))} className="text-text-secondary hover:text-text-primary transition-colors">
             <Search size={18} />
           </button>
           <button onClick={() => setIsNotificationsOpen(true)} className="text-text-secondary hover:text-text-primary transition-colors">
             <Bell size={18} />
           </button>
           <button onClick={() => setIsSettingsOpen(true)} className="text-text-secondary hover:text-text-primary transition-colors">
             <Settings size={18} />
           </button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
}