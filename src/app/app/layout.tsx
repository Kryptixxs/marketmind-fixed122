import Link from 'next/link';
import { BookOpen, Bell, ClipboardList, Home, LayoutGrid, Settings, TerminalSquare, User2 } from 'lucide-react';

const NAV = [
  { href: '/app', label: 'Home', icon: Home },
  { href: '/app/terminal', label: 'Terminal', icon: TerminalSquare },
  { href: '/app/workspaces', label: 'Workspaces', icon: LayoutGrid },
  { href: '/app/monitors', label: 'Monitors', icon: ClipboardList },
  { href: '/app/alerts', label: 'Alerts', icon: Bell },
  { href: '/app/orders', label: 'Orders/Blotter', icon: ClipboardList },
  { href: '/docs', label: 'Docs', icon: BookOpen },
  { href: '/app/settings', label: 'Settings', icon: Settings },
];

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <header className="border-b border-border bg-surface sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 h-12 flex items-center justify-between">
          <div className="font-bold text-sm tracking-tight">MarketMind App Shell</div>
          <div className="flex items-center gap-2 text-xs">
            <Link href="/app/profile" className="px-2 py-1 border border-border hover:border-border-highlight inline-flex items-center gap-1"><User2 size={12} />Profile</Link>
            <Link href="/app/admin" className="px-2 py-1 border border-border hover:border-border-highlight">Admin</Link>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-4 h-10 flex items-center gap-2 overflow-x-auto">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-xs px-2 py-1 border border-border hover:border-border-highlight whitespace-nowrap inline-flex items-center gap-1">
              <n.icon size={12} />
              {n.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="max-w-[1600px] mx-auto px-4 py-4">{children}</main>
    </div>
  );
}

