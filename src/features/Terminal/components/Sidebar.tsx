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
  Database,
  Globe,
  BarChart3
} from 'lucide-react';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { NotificationsPanel } from './notifications/NotificationsPanel';

const MODULES = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Workspace', key: '1' },
  { href: '/calendar', icon: Calendar, label: 'Economy', key: '2' },
  { href: '/charts', icon: LineChart, label: 'Stocks', key: '3' },
  { href: '/confluences', icon: Zap, label: 'Quant', key: '4' },
  { href: '/news', icon: Newspaper, label: 'News', key: '5' },
  { href: '/algo', icon: Cpu, label: 'Algos', key: '6' },
  { href: '/tools', icon: Database, label: 'Fundamental', key: '7' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          h-full bg-surface border-r border-border flex flex-col transition-all duration-300 z-50 shrink-0
          ${isHovered ? 'w-48 shadow-2xl' : 'w-12'}
        `}
      >
        <div className="h-12 flex items-center px-3 border-b border-border bg-background">
          <Link href="/dashboard" className="flex items-center gap-2 text-accent hover:opacity-80 transition-opacity overflow-hidden">
            <Terminal size={20} className="shrink-0" />
            {isHovered && <span className="font-black tracking-tighter text-sm uppercase">Vantage</span>}
          </Link>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {MODULES.map((item) => {
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
                {isHovered && (
                  <div className="flex-1 flex justify-between items-center overflow-hidden">
                    <span className="text-[11px] font-bold uppercase tracking-wider truncate">{item.label}</span>
                    <span className="text-[9px] font-mono opacity-40 group-hover:opacity-100">{item.key}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 flex flex-col gap-1 border-t border-border/50">
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="flex items-center gap-3 h-9 px-2 text-text-tertiary hover:text-text-primary hover:bg-surface-highlight transition-all rounded-[2px]"
          >
            <Bell size={16} className="shrink-0" />
            {isHovered && <span className="text-[11px] font-bold uppercase tracking-wider">Alerts</span>}
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 h-9 px-2 text-text-tertiary hover:text-text-primary hover:bg-surface-highlight transition-all rounded-[2px]"
          >
            <Settings size={16} className="shrink-0" />
            {isHovered && <span className="text-[11px] font-bold uppercase tracking-wider">Settings</span>}
          </button>
        </div>
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
}