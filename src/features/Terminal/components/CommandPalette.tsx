"use client"

import * as React from "react"
import {
  Calendar, CreditCard, Settings, User, LineChart,
  TrendingUp, Zap, Newspaper, Cpu, Filter, Briefcase, Wrench,
  LayoutGrid, Radar, Waves, Shield,
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
import { useTunnel } from "@/features/Terminal/context/TunnelContext"
import {
  dispatchSymbol,
  dispatchWorkspace,
  NAV_ITEMS,
  TOP_SYMBOLS,
  WORKSPACE_FUNCTIONS,
} from "@/features/Terminal/services/command-registry"

const NAV_ICONS: Record<string, React.ElementType> = {
  "/dashboard": LayoutGrid,
  "/charts": LineChart,
  "/screener": Filter,
  "/portfolio": Briefcase,
  "/calendar": Calendar,
  "/news": Newspaper,
  "/confluences": Zap,
  "/algo": Cpu,
  "/tools": Wrench,
}

const WORKSPACE_ICONS: Record<string, React.ElementType> = {
  BMON: Radar,
  FLOW: Waves,
  MACRO: Newspaper,
  RISK: Shield,
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { push } = useTunnel()

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
      dispatchSymbol(sym);
      push({ type: 'SYMBOL', symbol: sym, label: sym });
      if (pathname !== '/dashboard' && pathname !== '/charts') {
        router.push('/dashboard');
      }
    }, 50);
  }

  const handleWorkspace = (code: string) => {
    setOpen(false);
    setTimeout(() => {
      dispatchWorkspace(code as "BMON" | "FLOW" | "MACRO" | "RISK");
      if (pathname !== '/dashboard') router.push('/dashboard');
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
          {NAV_ITEMS.map(item => {
            const Icon = NAV_ICONS[item.path] || LayoutGrid;
            return (
            <CommandItem key={item.path} onSelect={() => handleNav(item.path)} value={`${item.label} ${item.desc}`}>
              <Icon className="mr-2 h-3.5 w-3.5 text-text-secondary" />
              <div className="flex flex-col">
                <span className="text-[11px]">{item.label}</span>
                <span className="text-[9px] text-text-tertiary">{item.desc}</span>
              </div>
            </CommandItem>
          )})}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Bloomberg-Style Functions">
          {WORKSPACE_FUNCTIONS.map((fn) => {
            const Icon = WORKSPACE_ICONS[fn.code] || Radar;
            return (
            <CommandItem key={fn.code} onSelect={() => handleWorkspace(fn.code)} value={`${fn.code} ${fn.label}`}>
              <Icon className="mr-2 h-3.5 w-3.5 text-warning" />
              <div className="flex flex-col">
                <span className="font-bold text-[11px]">{fn.code} &lt;GO&gt;</span>
                <span className="text-[9px] text-text-tertiary">{fn.label}</span>
              </div>
              <CommandShortcut>GO</CommandShortcut>
            </CommandItem>
          )})}
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
