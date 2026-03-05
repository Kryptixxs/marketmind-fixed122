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
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { NotificationsPanel } from './notifications/NotificationsPanel';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Workspace', key: '1' },
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
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const item = NAV_ITEMS.find(i => i.key === e.key);
      if (item) {
        e.preventDefault();
        router.push(item.href);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <>
      <div className={`
        h-full bg-surface border-r border-border flex flex-col transition-all duration-300 z-50 shrink-0
        ${isExpanded ? 'w-48' : 'w-12'}
      `}>
        {/* Brand Header */}
        <div className="h-12 flex items-center px-3 border-b border-border bg-background justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-accent hover:opacity-80 transition-opacity overflow-hidden">
            <Terminal size={20} className="shrink-0" />
            {isExpanded && <span className="font-black tracking-tighter text-sm uppercase">Vantage</span>}
          </Link>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-surface-highlight rounded text-text-tertiary hover:text-text-primary transition-colors"
          >
            {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 h-9 px-2 rounded-[2px] transition-all group
                  ${isActive
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-highlight'}
                `}
                title={item.label}
              >
                <item.icon size={16} className="shrink-0" strokeWidth={isActive ? 2.5 : 1.5} />
                {isExpanded && (
                  <div className="flex-1 flex justify-between items-center overflow-hidden">
                    <span className="text-[11px] font-bold uppercase tracking-wider truncate">{item.label}</span>
                    <span className="text-[9px] font-mono opacity-40 group-hover:opacity-100">{item.key}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 flex flex-col gap-1 border-t border-border/50">
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center gap-3 h-9 px-2 text-text-tertiary hover:text-text-primary hover:bg-surface-highlight transition-all rounded-[2px]"
          >
            <Search size={16} className="shrink-0" />
            {isExpanded && <span className="text-[11px] font-bold uppercase tracking-wider">Search</span>}
          </button>
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="flex items-center gap-3 h-9 px-2 text-text-tertiary hover:text-text-primary hover:bg-surface-highlight transition-all rounded-[2px]"
          >
            <Bell size={16} className="shrink-0" />
            {isExpanded && <span className="text-[11px] font-bold uppercase tracking-wider">Alerts</span>}
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 h-9 px-2 text-text-tertiary hover:text-text-primary hover:bg-surface-highlight transition-all rounded-[2px]"
          >
            <Settings size={16} className="shrink-0" />
            {isExpanded && <span className="text-[11px] font-bold uppercase tracking-wider">Settings</span>}
          </button>
          
          <div className="h-8 flex items-center px-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse shrink-0" />
            {isExpanded && <span className="ml-3 text-[8px] font-bold text-text-tertiary uppercase tracking-widest">System Live</span>}
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
}