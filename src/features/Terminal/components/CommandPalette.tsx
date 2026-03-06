"use client"

import * as React from "react"
import {
  Calendar, CreditCard, Settings, User, LineChart,
  TrendingUp, Zap, Newspaper, Cpu, Filter, Briefcase, Wrench,
  LayoutGrid, ArrowRight,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useRouter, usePathname } from "next/navigation"

const TOP_SYMBOLS = [
  { sym: 'NAS100', label: 'Nasdaq 100', category: 'Index' },
  { sym: 'SPX500', label: 'S&P 500', category: 'Index' },
  { sym: 'US30', label: 'Dow Jones', category: 'Index' },
  { sym: 'CRUDE', label: 'Crude Oil', category: 'Commodity' },
  { sym: 'GOLD', label: 'Gold', category: 'Commodity' },
  { sym: 'AAPL', label: 'Apple Inc.', category: 'Equity' },
  { sym: 'MSFT', label: 'Microsoft', category: 'Equity' },
  { sym: 'NVDA', label: 'NVIDIA', category: 'Equity' },
  { sym: 'TSLA', label: 'Tesla Inc.', category: 'Equity' },
  { sym: 'BTCUSD', label: 'Bitcoin', category: 'Crypto' },
  { sym: 'ETHUSD', label: 'Ethereum', category: 'Crypto' },
  { sym: 'EURUSD', label: 'EUR/USD', category: 'Forex' },
];

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutGrid, label: 'Dashboard', desc: 'Market workspace' },
  { path: '/charts', icon: LineChart, label: 'Markets / Charts', desc: 'Technical analysis' },
  { path: '/screener', icon: Filter, label: 'Screener', desc: 'Filter instruments' },
  { path: '/portfolio', icon: Briefcase, label: 'Portfolio', desc: 'Position analytics' },
  { path: '/calendar', icon: Calendar, label: 'Economic Calendar', desc: 'Events & earnings' },
  { path: '/news', icon: Newspaper, label: 'Intelligence Wire', desc: 'Market news' },
  { path: '/confluences', icon: Zap, label: 'Quant Engine', desc: 'Confluence analysis' },
  { path: '/algo', icon: Cpu, label: 'Algo Lab', desc: 'Backtesting' },
  { path: '/tools', icon: Wrench, label: 'Tools', desc: 'Calculators' },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleNav = (path: string) => {
    setOpen(false);
    setTimeout(() => router.push(path), 50);
  }

  const handleSymbolSelect = (sym: string) => {
    setOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
      if (pathname !== '/dashboard' && pathname !== '/charts') {
        router.push('/charts');
      }
    }, 50);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search symbols, pages, or commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Global Assets">
          {TOP_SYMBOLS.map((asset) => (
            <CommandItem key={asset.sym} onSelect={() => handleSymbolSelect(asset.sym)} value={`${asset.sym} ${asset.label}`}>
              <TrendingUp className="mr-2 h-3.5 w-3.5 text-accent" />
              <div className="flex flex-col">
                <span className="font-bold text-[11px]">{asset.sym}</span>
                <span className="text-[9px] text-text-tertiary">{asset.label}</span>
              </div>
              <CommandShortcut>{asset.category}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map(item => (
            <CommandItem key={item.path} onSelect={() => handleNav(item.path)} value={`${item.label} ${item.desc}`}>
              <item.icon className="mr-2 h-3.5 w-3.5 text-text-secondary" />
              <div className="flex flex-col">
                <span className="text-[11px]">{item.label}</span>
                <span className="text-[9px] text-text-tertiary">{item.desc}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => { setOpen(false); setTimeout(() => window.dispatchEvent(new CustomEvent('vantage-open-settings')), 50); }} value="preferences settings">
            <Settings className="mr-2 h-3.5 w-3.5 text-text-secondary" />
            <span className="text-[11px]">Preferences</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNav('/account')} value="profile account">
            <User className="mr-2 h-3.5 w-3.5 text-text-secondary" />
            <span className="text-[11px]">Account</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNav('/billing')} value="billing subscription">
            <CreditCard className="mr-2 h-3.5 w-3.5 text-text-secondary" />
            <span className="text-[11px]">Billing</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
