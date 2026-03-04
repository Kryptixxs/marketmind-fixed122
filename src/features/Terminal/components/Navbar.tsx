'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Home, Calendar, LineChart, Wrench, Settings, TrendingUp } from 'lucide-react';
import { SettingsModal } from '@/components/ui/SettingsModal';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Market' },
  { href: '/calendar', icon: Calendar, label: 'Calendar' },
  { href: '/charts', icon: LineChart, label: 'Charts' },
  { href: '/tools', icon: Wrench, label: 'Tools' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 h-[50px] bg-background/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
           <div className="w-7 h-7 bg-gradient-to-br from-accent to-blue-700 rounded-md flex items-center justify-center shadow-lg shadow-accent/20">
             <TrendingUp size={16} className="text-white" />
           </div>
           <span className="font-bold text-text-primary tracking-tight">MarketMind</span>
        </Link>

        {/* Center Nav */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center bg-surface/50 border border-border rounded-full p-1 gap-1">
           {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
             const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
             return (
               <Link
                 key={href}
                 href={href}
                 className={`
                   flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                   ${isActive 
                     ? 'bg-accent/10 text-accent shadow-sm ring-1 ring-accent/20' 
                     : 'text-text-secondary hover:text-text-primary hover:bg-surface'}
                 `}
               >
                 <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                 <span>{label}</span>
               </Link>
             );
           })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-2 py-1 bg-surface border border-border rounded text-[10px] font-mono text-text-secondary">
             <span className="w-1.5 h-1.5 rounded-full bg-positive animate-pulse"></span>
             US MARKET OPEN
          </div>
          <button
            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-md hover:bg-surface-hover transition-colors text-xs text-text-secondary hover:text-text-primary"
          >
            <span className="font-medium">Search</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface text-text-secondary hover:text-text-primary transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}