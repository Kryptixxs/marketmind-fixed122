'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Shield,
  Briefcase,
  ArrowUpDown,
  Brain,
  BarChart3,
} from 'lucide-react';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { NotificationsPanel } from './notifications/NotificationsPanel';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Workspace', key: '1', fnLabel: 'F1' },
  { href: '/fi', icon: BarChart3, label: 'Fixed Income', key: '2', fnLabel: 'FI' },
  { href: '/options', icon: Zap, label: 'Derivatives', key: '3', fnLabel: 'OVME' },
  { href: '/screener', icon: Search, label: 'Screener', key: '4', fnLabel: 'EQS' },
  { href: '/fa', icon: Newspaper, label: 'Fundamentals', key: '5', fnLabel: 'FA' },
  { href: '/risk', icon: Shield, label: 'Risk', key: '6', fnLabel: 'RISK' },
  { href: '/portfolio', icon: Briefcase, label: 'Portfolio', key: '7', fnLabel: 'PORT' },
  { href: '/calendar', icon: Calendar, label: 'Calendar', key: '8', fnLabel: 'ECO' },
  { href: '/execution', icon: ArrowUpDown, label: 'Execution', key: '9', fnLabel: 'EMS' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    const item = NAV_ITEMS.find(i => i.key === e.key);
    if (item) {
      e.preventDefault();
      router.push(item.href);
    }

    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    }
  }, [router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <div
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`
          h-full bg-surface border-r border-border flex flex-col transition-all duration-200 z-50 shrink-0 select-none
          ${isExpanded ? 'w-44' : 'w-12'}
        `}
      >
        {/* Brand */}
        <div className="h-8 flex items-center px-2 border-b border-border bg-background/80">
          <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-5 bg-accent rounded-[2px] flex items-center justify-center shrink-0">
              <Terminal size={12} className="text-background" />
            </div>
            {isExpanded && (
              <span className="text-[10px] font-black tracking-tight uppercase text-text-primary whitespace-nowrap">
                VANTAGE
              </span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 flex flex-col gap-0.5 px-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-2.5 h-8 px-2 rounded-[2px] transition-all group relative
                  ${isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-highlight'}
                `}
                title={`${item.label} (${item.key})`}
              >
                {isActive && <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-accent rounded-full" />}

                <item.icon size={14} className="shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                {isExpanded && (
                  <div className="flex-1 flex justify-between items-center overflow-hidden">
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">{item.label}</span>
                    <span className={`text-[8px] font-mono px-1 py-0.5 rounded-[2px] ${isActive ? 'bg-accent/20 text-accent' : 'bg-surface-highlight text-text-muted'}`}>
                      {item.key}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="px-1 pb-2 flex flex-col gap-0.5 border-t border-border/50 pt-2">
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center gap-2.5 h-8 px-2 text-text-tertiary hover:text-text-primary hover:bg-surface-highlight transition-all rounded-[2px]"
            title="Search (Ctrl+K)"
          >
            <Search size={14} className="shrink-0" />
            {isExpanded && (
              <div className="flex-1 flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider">Search</span>
                <span className="text-[8px] font-mono text-text-muted">⌘K</span>
              </div>
            )}
          </button>
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="flex items-center gap-2.5 h-8 px-2 text-text-tertiary hover:text-text-primary hover:bg-surface-highlight transition-all rounded-[2px]"
            title="Alerts"
          >
            <Bell size={14} className="shrink-0" />
            {isExpanded && <span className="text-[10px] font-bold uppercase tracking-wider">Alerts</span>}
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2.5 h-8 px-2 text-text-tertiary hover:text-text-primary hover:bg-surface-highlight transition-all rounded-[2px]"
            title="Settings"
          >
            <Settings size={14} className="shrink-0" />
            {isExpanded && <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>}
          </button>

          <div className="h-7 flex items-center px-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-positive shrink-0" style={{ boxShadow: '0 0 4px rgba(0, 200, 83, 0.5)' }} />
            {isExpanded && (
              <span className="ml-2.5 text-[8px] font-bold text-text-muted uppercase tracking-widest">SYS.ONLINE</span>
            )}
          </div>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
}