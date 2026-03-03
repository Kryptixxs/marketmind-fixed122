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
  { sym: 'NQ=F', label: 'Nasdaq 100 Futures', category: 'Indices' },
  { sym: 'ES=F', label: 'S&P 500 Futures', category: 'Indices' },
  { sym: 'CL=F', label: 'Crude Oil Futures', category: 'Commodities' },
  { sym: 'GC=F', label: 'Gold Futures', category: 'Commodities' },
  { sym: 'AAPL', label: 'Apple Inc.', category: 'Equities' },
  { sym: 'MSFT', label: 'Microsoft Corp.', category: 'Equities' },
  { sym: 'NVDA', label: 'NVIDIA Corp.', category: 'Equities' },
  { sym: 'TSLA', label: 'Tesla Inc.', category: 'Equities' },
  { sym: 'BTC-USD', label: 'Bitcoin', category: 'Crypto' },
  { sym: 'ETH-USD', label: 'Ethereum', category: 'Crypto' },
  { sym: 'EURUSD=X', label: 'EUR/USD', category: 'Forex' },
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

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const handleSymbolSelect = (sym: string) => {
    runCommand(() => {
      window.dispatchEvent(new CustomEvent('vantage-symbol-change', { detail: sym }));
      // If we aren't on a page that handles charts (home or charts), push to charts
      if (pathname !== '/' && pathname !== '/charts') {
        router.push('/charts');
      }
    });
  }

  const openSettings = () => {
    runCommand(() => {
      window.dispatchEvent(new CustomEvent('vantage-open-settings'));
    });
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
          <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
            <LineChart className="mr-2 h-4 w-4" />
            <span>Workspace / Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/charts'))}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Technical Analysis</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/calendar'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Economic Calendar</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/news'))}>
            <Newspaper className="mr-2 h-4 w-4" />
            <span>Intelligence Wire</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/algo'))}>
            <Cpu className="mr-2 h-4 w-4" />
            <span>Algo Backtester</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => router.push('/account'))}>
            <User className="mr-2 h-4 w-4 text-text-secondary" />
            <span>Profile & Account</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/billing'))}>
            <CreditCard className="mr-2 h-4 w-4 text-text-secondary" />
            <span>Billing & Subscription</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={openSettings}>
            <Settings className="mr-2 h-4 w-4 text-text-secondary" />
            <span>Preferences</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}