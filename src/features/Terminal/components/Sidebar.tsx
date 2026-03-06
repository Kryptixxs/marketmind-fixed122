'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  LineChart,
  Newspaper,
  Settings,
  Cpu,
  Bell,
  Calendar,
  Zap,
  Search,
  Briefcase,
  Filter,
  Wrench,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { NotificationsPanel } from './notifications/NotificationsPanel';
import { useAuth } from '@/services/context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard', shortcut: '1' },
      { href: '/charts', icon: LineChart, label: 'Markets', shortcut: '2' },
      { href: '/screener', icon: Filter, label: 'Screener', shortcut: '3' },
      { href: '/portfolio', icon: Briefcase, label: 'Portfolio', shortcut: '4' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { href: '/calendar', icon: Calendar, label: 'Calendar', shortcut: '5' },
      { href: '/news', icon: Newspaper, label: 'News', shortcut: '6' },
    ],
  },
  {
    label: 'Quantitative',
    items: [
      { href: '/confluences', icon: Zap, label: 'Quant', shortcut: '7' },
      { href: '/algo', icon: Cpu, label: 'Algo Lab', shortcut: '8' },
      { href: '/tools', icon: Wrench, label: 'Tools', shortcut: '9' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const allItems = NAV_SECTIONS.flatMap(s => s.items);
        const idx = parseInt(e.key) - 1;
        if (allItems[idx]) {
          window.location.href = allItems[idx].href;
        }
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <div className={`
        h-full bg-surface border-r border-border flex flex-col transition-all duration-200 shrink-0 overflow-hidden
        ${expanded ? 'w-48' : 'w-12'}
      `}>
        {/* Logo */}
        <div className="h-11 flex items-center justify-center border-b border-border bg-background shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 group overflow-hidden">
            <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <span className="text-accent font-black text-[10px]">V</span>
            </div>
            {expanded && (
              <span className="text-[11px] font-black tracking-tight text-text-primary uppercase animate-fade-in">
                Vantage
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label}>
              {si > 0 && <div className="h-px bg-border/50 mx-3 my-1.5" />}
              {expanded && (
                <div className="px-3 py-1 text-[8px] font-bold uppercase tracking-[0.15em] text-text-muted animate-fade-in">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2.5 mx-1.5 px-2 h-8 rounded transition-all group relative
                      ${isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-highlight'}
                    `}
                    title={!expanded ? item.label : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-accent rounded-r" />
                    )}
                    <item.icon size={15} className="shrink-0" strokeWidth={isActive ? 2.5 : 1.5} />
                    {expanded && (
                      <div className="flex-1 flex justify-between items-center min-w-0 animate-fade-in">
                        <span className="text-[10px] font-semibold uppercase tracking-wider truncate">{item.label}</span>
                        <kbd className="text-[8px] font-mono opacity-30 group-hover:opacity-60 bg-background px-1 py-0.5 rounded border border-border/50">
                          {item.shortcut}
                        </kbd>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border p-1.5 flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="flex items-center gap-2.5 px-2 h-8 rounded text-text-tertiary hover:text-text-secondary hover:bg-surface-highlight transition-all mx-0"
            title="Alerts"
          >
            <Bell size={15} className="shrink-0" />
            {expanded && <span className="text-[10px] font-semibold uppercase tracking-wider animate-fade-in">Alerts</span>}
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2.5 px-2 h-8 rounded text-text-tertiary hover:text-text-secondary hover:bg-surface-highlight transition-all mx-0"
            title="Settings"
          >
            <Settings size={15} className="shrink-0" />
            {expanded && <span className="text-[10px] font-semibold uppercase tracking-wider animate-fade-in">Settings</span>}
          </button>
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-2 h-8 rounded text-text-tertiary hover:text-negative hover:bg-negative/5 transition-all mx-0"
            title="Sign Out"
          >
            <LogOut size={15} className="shrink-0" />
            {expanded && <span className="text-[10px] font-semibold uppercase tracking-wider animate-fade-in">Logout</span>}
          </button>
        </div>

        {/* Expand Toggle */}
        <div className="border-t border-border shrink-0">
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-center h-7 text-text-tertiary hover:text-text-primary hover:bg-surface-highlight transition-colors"
          >
            {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
}
