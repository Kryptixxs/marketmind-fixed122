"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  User,
  LineChart,
  TrendingUp,
  Globe,
  Zap,
  Newspaper,
  Cpu,
  ArrowRight
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
  { sym: 'NAS100', label: 'Nasdaq 100', category: 'Indices' },
  { sym: 'SPX500', label: 'S&P 500', category: 'Indices' },
  { sym: 'US30', label: 'Dow Jones', category: 'Indices' },
  { sym: 'CRUDE', label: 'Crude Oil', category: 'Commodities' },
  { sym: 'GOLD', label: 'Gold', category: 'Commodities' },
  { sym: 'AAPL', label: 'Apple Inc.', category: 'Equities' },
  { sym: 'MSFT', label: 'Microsoft Corp.', category: 'Equities' },
  { sym: 'NVDA', label: 'NVIDIA Corp.', category: 'Equities' },
  { sym: 'TSLA', label: 'Tesla Inc.', category: 'Equities' },
  { sym: 'BTCUSD', label: 'Bitcoin', category: 'Crypto' },
  { sym: 'ETHUSD', label: 'Ethereum', category: 'Crypto' },
  { sym: 'EURUSD', label: 'EUR/USD', category: 'Forex' },
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
      if (e.key === "Escape" && open) {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open])

  // Wrap the navigation to ensure the dialog closes before pushing the route
  const handleNav = (path: string) => {
    setOpen(false);
    setTimeout(() => {
      router.push(path);
    }, 50); // slight delay ensures DOM cleanup from dialog
  }

  const handleSymbolSelect = (sym: string) => {
    setOpen(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
      if (pathname !== '/' && pathname !== '/charts') {
        router.push('/charts');
      }
    }, 50);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search symbols, navigate, or run commands..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Global Assets & Symbols">
          {TOP_SYMBOLS.map((asset) => (
            <CommandItem key={asset.sym} onSelect={() => handleSymbolSelect(asset.sym)} value={`${asset.sym} ${asset.label}`}>
              <TrendingUp className="mr-2 h-4 w-4 text-accent" />
              <div className="flex flex-col">
                <span className="font-bold">{asset.sym}</span>
                <span className="text-[10px] text-text-tertiary">{asset.label}</span>
              </div>
              <CommandShortcut>{asset.category}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        
        <CommandSeparator />

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNav('/')} value="workspace dashboard home">
            <LineChart className="mr-2 h-4 w-4" />
            <span>Workspace / Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNav('/charts')} value="technical analysis charts">
            <Zap className="mr-2 h-4 w-4" />
            <span>Technical Analysis</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNav('/calendar')} value="economic calendar">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Economic Calendar</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNav('/news')} value="intelligence wire news">
            <Newspaper className="mr-2 h-4 w-4" />
            <span>Intelligence Wire</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNav('/algo')} value="algo backtester">
            <Cpu className="mr-2 h-4 w-4" />
            <span>Algo Backtester</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => handleNav('/account')} value="profile account">
            <User className="mr-2 h-4 w-4 text-text-secondary" />
            <span>Profile & Account</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleNav('/billing')} value="billing subscription">
            <CreditCard className="mr-2 h-4 w-4 text-text-secondary" />
            <span>Billing & Subscription</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => {
            setOpen(false);
            setTimeout(() => window.dispatchEvent(new CustomEvent('vantage-open-settings')), 50);
          }} value="preferences settings">
            <Settings className="mr-2 h-4 w-4 text-text-secondary" />
            <span>Preferences</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}