'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, LifeBuoy, ShieldCheck, TerminalSquare } from 'lucide-react';

const NAV = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/security', label: 'Security' },
  { href: '/status', label: 'Status' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <TerminalSquare size={16} className="text-accent" />
            <span>MarketMind</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-4">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`text-xs font-semibold uppercase tracking-wider ${pathname === n.href ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}`}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/docs" className="text-xs px-3 py-1 border border-border hover:border-border-highlight text-text-secondary hover:text-text-primary">Docs</Link>
            <Link href="/app?onboarding=1" className="text-xs px-3 py-1 border border-accent text-accent hover:bg-accent/10 inline-flex items-center gap-1"><BookOpen size={12} />Tutorial</Link>
            <Link href="/login" className="text-xs px-3 py-1 border border-border hover:border-border-highlight">Login</Link>
            <Link href="/signup" className="text-xs px-3 py-1 bg-accent text-black font-bold">Request Access</Link>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">{title}</h1>
          <p className="text-sm text-text-secondary mt-2 max-w-3xl">{subtitle}</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>

      <footer className="border-t border-border bg-surface/40 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-5 grid md:grid-cols-3 gap-4 text-xs text-text-secondary">
          <div className="space-y-1">
            <div className="font-semibold text-text-primary">MarketMind Terminal</div>
            <div>Institutional workflow platform with integrated terminal, provenance, and governance controls.</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-text-primary inline-flex items-center gap-1"><ShieldCheck size={12} />Trust</div>
            <div>Simulated feeds clearly labeled. Role-based controls, policy, and audit-ready workflows.</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-text-primary inline-flex items-center gap-1"><LifeBuoy size={12} />Need help?</div>
            <div><Link href="/docs" className="text-accent hover:underline">Read docs</Link> or <Link href="/contact" className="text-accent hover:underline">contact our team</Link>.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

