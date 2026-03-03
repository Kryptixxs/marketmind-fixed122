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
  Search,
  Globe,
  Zap,
  Plus,
  LayoutGrid,
  Newspaper,
  Cpu
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [prompt, setPrompt] = React.useState<'symbol' | 'watchlist' | null>(null)
  const [inputValue, setInputValue] = React.useState("")
  const router = useRouter()

  React.useEffect(() => {
    let lastKey = "";
    const down = (e: KeyboardEvent) => {
      // Palette toggle
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault()
        setOpen((open) => !open)
        setPrompt(null)
      }

      // Navigation sequences (g then c/n/a)
      if (lastKey === "g") {
        if (e.key === "c") { e.preventDefault(); router.push('/calendar'); }
        if (e.key === "n") { e.preventDefault(); router.push('/news'); }
        if (e.key === "a") { e.preventDefault(); router.push('/algo'); }
        lastKey = "";
      } else {
        lastKey = e.key;
        setTimeout(() => { lastKey = ""; }, 500);
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [router])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    setPrompt(null)
    setInputValue("")
    command()
  }, [])

  const handlePromptSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue) {
      const ticker = inputValue.toUpperCase().trim();
      if (prompt === 'symbol') {
        runCommand(() => router.push(`/charts?symbol=${ticker}`));
      } else if (prompt === 'watchlist') {
        runCommand(() => {
          const saved = localStorage.getItem('vantage_watchlist');
          const list = saved ? JSON.parse(saved) : [];
          if (!list.includes(ticker)) {
            localStorage.setItem('vantage_watchlist', JSON.stringify([ticker, ...list]));
          }
          router.push(`/charts?symbol=${ticker}`);
        });
      }
    }
  }

  if (!open) return null

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder={prompt === 'symbol' ? "Enter ticker to open..." : prompt === 'watchlist' ? "Enter ticker to add..." : "Type a command or search..."} 
        value={inputValue}
        onValueChange={setInputValue}
        onKeyDown={handlePromptSubmit}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {!prompt ? (
          <>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>Workspace</span>
                <CommandShortcut>G W</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/charts'))}>
                <LineChart className="mr-2 h-4 w-4" />
                <span>Technical Charts</span>
                <CommandShortcut>G T</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/calendar'))}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Economic Calendar</span>
                <CommandShortcut>G C</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/news'))}>
                <Newspaper className="mr-2 h-4 w-4" />
                <span>News Wire</span>
                <CommandShortcut>G N</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/algo'))}>
                <Cpu className="mr-2 h-4 w-4" />
                <span>Algo Backtester</span>
                <CommandShortcut>G A</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Terminal Commands">
              <CommandItem onSelect={() => { setPrompt('symbol'); setInputValue(""); }}>
                <Search className="mr-2 h-4 w-4" />
                <span>Open Symbol...</span>
                <CommandShortcut>S</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setPrompt('watchlist'); setInputValue(""); }}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Add to Watchlist...</span>
                <CommandShortcut>A</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/news?category=Watchlist'))}>
                <TrendingUp className="mr-2 h-4 w-4" />
                <span>Open News: Watchlist</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/calendar?view=economic'))}>
                <Zap className="mr-2 h-4 w-4" />
                <span>Open Calendar: High Impact</span>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Account">
              <CommandItem onSelect={() => runCommand(() => router.push('/account'))}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/account'))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </>
        ) : (
          <CommandGroup heading={prompt === 'symbol' ? "Open Symbol" : "Add to Watchlist"}>
            <div className="p-4 text-xs text-text-tertiary">
              Press <kbd className="bg-surface-highlight px-1 rounded">Enter</kbd> to confirm ticker.
            </div>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}