'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  LineChart, 
  Newspaper, 
  Settings, 
  Terminal, 
  Cpu,
  Search,
  Bell,
  Calendar
} from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { NotificationsPanel } from './notifications/NotificationsPanel';

const NAV_ITEMS = [
  { href: '/', icon: LayoutGrid, label: 'Workspace' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/charts', icon: LineChart, label: 'Technical' },
  { href: '/news', icon: Newspaper, label: 'Wire' },
  { href: '/algo', icon: Cpu, label: 'Algos' },
  { href: '/account', icon: User, label: 'Account' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <>
      <div className="w-12 h-full bg-surface border-r border-border flex flex-col items-center py-3 z-50">
        {/* Brand Icon */}
        <Link href="/" className="mb-6 text-accent hover:opacity-80 transition-opacity">
          <Terminal size={20} />
        </Link>

        {/* Nav Items */}
        <nav className="flex flex-col gap-2 w-full px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-[2px] transition-colors
                  ${isActive 
                    ? 'bg-accent/10 text-accent border border-accent/20' 
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-highlight'}
                `}
                title={item.label}
              >
                <item.icon size={16} strokeWidth={1.5} />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 w-full px-2">
           <button 
             onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
             className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-text-primary transition-colors"
             title="Search (Cmd+K)"
           >
             <Search size={16} />
           </button>
           <button 
             onClick={() => setIsNotificationsOpen(true)}
             className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-text-primary transition-colors"
             title="Notifications"
           >
             <Bell size={16} />
           </button>
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-text-primary transition-colors"
             title="Settings"
           >
             <Settings size={16} />
           </button>
           
           <div className="w-full h-[1px] bg-border my-1"></div>
           
           {/* Connection Status */}
           <div className="w-full flex justify-center py-2" title="System Status: Connected">
              <div className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse"></div>
           </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
}
