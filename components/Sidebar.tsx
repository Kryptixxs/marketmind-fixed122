'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutGrid, 
  LineChart, 
  Newspaper, 
  Settings, 
  Terminal, 
  Cpu,
  Search,
  Bell,
  Calendar,
  Zap
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { NotificationsPanel } from './notifications/NotificationsPanel';

const NAV_ITEMS = [
  { href: '/', icon: LayoutGrid, label: 'Workspace', key: '1' },
  { href: '/calendar', icon: Calendar, label: 'Calendar', key: '2' },
  { href: '/charts', icon: LineChart, label: 'Technical', key: '3' },
  { href: '/confluences', icon: Zap, label: 'Confluences', key: '4' },
  { href: '/news', icon: Newspaper, label: 'Wire', key: '5' },
  { href: '/algo', icon: Cpu, label: 'Algos', key: '6' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const item = NAV_ITEMS.find(i => i.key === e.key);
      if (item) {
        e.preventDefault();
        router.push(item.href);
      }

      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <>
      <div className="w-full h-14 md:w-12 md:h-full bg-surface border-t md:border-t-0 md:border-r border-border flex flex-row md:flex-col items-center md:py-3 z-50 shrink-0 overflow-x-auto md:overflow-x-visible hide-scrollbar">
        {/* Brand Icon - Hidden on mobile to save nav space */}
        <Link href="/" className="hidden md:flex mb-6 text-accent hover:opacity-80 transition-opacity">
          <Terminal size={20} />
        </Link>

        {/* Nav Items */}
        <nav className="flex flex-row md:flex-col gap-2 md:gap-2 px-2 flex-1 md:flex-none justify-evenly md:justify-start w-full min-w-max">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center justify-center w-10 h-10 md:w-8 md:h-8 rounded-[2px] transition-colors
                  ${isActive 
                    ? 'bg-accent/10 text-accent border border-accent/20' 
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-highlight'}
                `}
                title={`${item.label} (${item.key})`}
              >
                <item.icon size={18} className="md:w-4 md:h-4" strokeWidth={1.5} />
                <span className="hidden md:block absolute left-full ml-2 px-1.5 py-0.5 bg-surface border border-border text-[8px] text-text-secondary rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100]">
                  {item.label} <span className="text-accent ml-1">{item.key}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom / Right Action Icons */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-2 px-2 md:mt-auto justify-evenly md:justify-start w-full md:w-auto items-center min-w-max border-l md:border-l-0 md:border-t border-border/50 pl-2 md:pl-0 md:pt-4 ml-2 md:ml-0">
           <button 
             onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
             className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 text-text-secondary hover:text-text-primary transition-colors"
           >
             <Search size={18} className="md:w-4 md:h-4" />
           </button>
           <button 
             onClick={() => setIsNotificationsOpen(true)}
             className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 text-text-secondary hover:text-text-primary transition-colors"
           >
             <Bell size={18} className="md:w-4 md:h-4" />
           </button>
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="flex items-center justify-center w-10 h-10 md:w-8 md:h-8 text-text-secondary hover:text-text-primary transition-colors"
           >
             <Settings size={18} className="md:w-4 md:h-4" />
           </button>
           
           <div className="hidden md:block w-full h-[1px] bg-border my-1"></div>
           
           {/* Connection Status */}
           <div className="hidden md:flex w-full flex-col items-center gap-2 py-2">
              <div className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse" title="System Status: Connected"></div>
              <div className="text-[8px] font-mono text-text-tertiary rotate-90 mt-2">V4.0</div>
           </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
}