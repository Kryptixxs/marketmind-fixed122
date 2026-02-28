'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Home, Calendar, DollarSign, LineChart, Wrench, Settings, TrendingUp } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/economic', icon: Calendar, label: 'Economic' },
  { href: '/earnings', icon: DollarSign, label: 'Earnings' },
  { href: '/charts', icon: LineChart, label: 'Charts' },
  { href: '/tools', icon: Wrench, label: 'Tools' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setScrolled(y > 8);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Shrink multiplier: tabs collapse to icon-only at scroll > 60
  const shrinkProgress = Math.min(scrollY / 80, 1);

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-all"
        style={{
          background: scrolled
            ? 'rgba(8, 8, 12, 0.82)'
            : 'rgba(6, 6, 8, 0.50)',
          backdropFilter: `blur(${scrolled ? 60 : 32}px) saturate(${scrolled ? 200 : 150}%)`,
          WebkitBackdropFilter: `blur(${scrolled ? 60 : 32}px) saturate(${scrolled ? 200 : 150}%)`,
          borderBottom: scrolled
            ? '1px solid rgba(255,255,255,0.10)'
            : '1px solid rgba(255,255,255,0.06)',
          boxShadow: scrolled
            ? 'inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 30px rgba(0,0,0,0.5)'
            : 'inset 0 1px 0 rgba(255,255,255,0.06)',
          transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <nav
          className="flex items-center justify-between transition-all"
          style={{
            padding: scrolled ? '10px 20px' : '14px 24px',
            transition: 'padding 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="flex items-center justify-center transition-all"
              style={{
                width: scrolled ? 28 : 34,
                height: scrolled ? 28 : 34,
                borderRadius: scrolled ? 8 : 10,
                background: 'linear-gradient(135deg, #0A84FF 0%, #0055CC 100%)',
                boxShadow: '0 0 18px rgba(10,132,255,0.40), inset 0 1px 0 rgba(255,255,255,0.30)',
                transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <TrendingUp
                style={{
                  width: scrolled ? 14 : 18,
                  height: scrolled ? 14 : 18,
                  color: '#fff',
                  transition: 'all 0.35s',
                }}
              />
            </div>
            <div
              className="overflow-hidden transition-all"
              style={{
                maxWidth: scrolled ? 0 : 160,
                opacity: scrolled ? 0 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <span className="text-[17px] font-bold tracking-tight text-white whitespace-nowrap">
                MarketMind
              </span>
            </div>
          </Link>

          {/* Tab bar — shrinks on scroll per iOS 26 spec */}
          <div
            className="flex items-center"
            style={{
              background: 'rgba(255,255,255,0.065)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 999,
              padding: scrolled ? '4px 6px' : '5px 7px',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 2px 10px rgba(0,0,0,0.35)',
              transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              gap: scrolled ? 2 : 2,
            }}
          >
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: scrolled ? 0 : 7,
                    padding: scrolled ? '7px 10px' : '7px 14px',
                    borderRadius: 999,
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    background: isActive
                      ? 'rgba(255,255,255,0.14)'
                      : 'transparent',
                    color: isActive
                      ? 'rgba(255,255,255,0.95)'
                      : 'rgba(255,255,255,0.48)',
                    border: isActive
                      ? '1px solid rgba(255,255,255,0.22)'
                      : '1px solid transparent',
                    boxShadow: isActive
                      ? 'inset 0 1px 0 rgba(255,255,255,0.28), 0 2px 8px rgba(0,0,0,0.30)'
                      : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.80)';
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.48)';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span
                    style={{
                      maxWidth: scrolled ? 0 : 80,
                      opacity: scrolled ? 0 : 1,
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: scrolled ? 34 : 38,
              height: scrolled ? 34 : 38,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.065)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 2px 8px rgba(0,0,0,0.25)',
              color: 'rgba(255,255,255,0.50)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.90)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.11)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.20)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.50)';
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.065)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
            }}
          >
            <Settings size={scrolled ? 15 : 17} strokeWidth={1.8} style={{ transition: 'all 0.3s' }} />
          </button>
        </nav>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
