'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, LineChart, Newspaper, Settings, Terminal, 
  Search, Bell, Calendar, Monitor, Code
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
  const [isHovered, setIsHovered] = useState(false);
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
      <motion.div 
        onMouseEnter={() => !isTerminal && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={false}
        animate={{ 
          width: isTerminal ? 64 : (isHovered ? 200 : 64) 
        }}
        transition={{ 
          type: "spring", 
          stiffness: 120, 
          damping: 20, 
          mass: 1 
        }}
        className={`h-14 w-full md:h-full flex flex-row md:flex-col items-center md:items-start py-0 md:py-6 z-50 shrink-0 overflow-hidden ${
          isTerminal 
            ? 'border-t md:border-t-0 md:border-r border-border bg-black' 
            : 'bg-surface/30 backdrop-blur-3xl border-r border-border shadow-[1px_0_24px_rgba(0,0,0,0.5)]'
        }`}
      >
        <div className="hidden md:flex items-center px-5 mb-10 text-text-primary w-full">
          <Terminal size={24} strokeWidth={isTerminal ? 2 : 1.5} className="shrink-0" />
          {!isTerminal && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="ml-4 font-bold tracking-widest text-[10px] uppercase whitespace-nowrap text-text-secondary"
            >
              Vantage
            </motion.span>
          )}
        </div>

        <nav className="flex flex-row md:flex-col gap-2 px-2 flex-1 md:flex-none w-full">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  btn-haptic group flex items-center w-full p-3 transition-colors duration-200
                  ${isTerminal ? 'rounded-none border border-transparent' : 'rounded-lg'}
                  ${isActive 
                    ? isTerminal 
                      ? 'bg-accent text-accent-text border-accent' 
                      : 'bg-white/10 text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' 
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}
                `}
              >
                <item.icon size={20} strokeWidth={isActive && isTerminal ? 2.5 : 1.5} className="shrink-0 mx-auto md:mx-0" />
                {!isTerminal && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                    className="ml-4 font-medium tracking-wide text-xs whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-row md:flex-col gap-2 px-2 md:mt-auto w-full items-center md:items-start border-l md:border-l-0 md:border-t border-border/50 pl-2 md:pl-2 md:pt-4">
           {/* Theme Toggle Segmented Control */}
           <div className={`flex w-full p-1 gap-1 mb-2 ${isTerminal ? 'flex-col border border-border bg-black' : 'bg-black/50 rounded-lg shadow-inner'}`}>
              <button 
                onClick={() => setUITheme('architect')}
                className={`flex items-center justify-center p-2 flex-1 btn-haptic ${!isTerminal ? 'bg-surface-highlight rounded-md text-text-primary shadow-sm' : 'text-text-tertiary hover:text-accent'}`}
                title="Workspace Mode"
              >
                <Monitor size={16} strokeWidth={1.5} />
              </button>
              <button 
                onClick={() => setUITheme('terminal')}
                className={`flex items-center justify-center p-2 flex-1 btn-haptic ${isTerminal ? 'bg-accent text-accent-text' : 'text-text-tertiary hover:text-text-primary rounded-md'}`}
                title="Terminal Mode"
              >
                <Code size={16} strokeWidth={1.5} />
              </button>
           </div>

           {[
             { icon: Search, action: () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true })), label: "Search" },
             { icon: Bell, action: () => setIsNotificationsOpen(true), label: "Alerts" },
             { icon: Settings, action: () => setIsSettingsOpen(true), label: "Settings" }
           ].map((btn, i) => (
             <button 
               key={i} onClick={btn.action} 
               className={`btn-haptic flex items-center w-full p-3 text-text-secondary hover:text-text-primary transition-colors ${isTerminal ? 'rounded-none hover:bg-border' : 'rounded-lg hover:bg-white/5'}`}
             >
               <btn.icon size={20} strokeWidth={1.5} className="shrink-0 mx-auto md:mx-0" />
               {!isTerminal && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                    className="ml-4 font-medium tracking-wide text-xs whitespace-nowrap"
                  >
                    {btn.label}
                  </motion.span>
               )}
             </button>
           ))}
        </div>
      </motion.div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
    </>
  );
}