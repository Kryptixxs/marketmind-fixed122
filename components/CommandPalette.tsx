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
import { useWatchlistStore } from "@/store/useWatchlistStore"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [prompt, setPrompt] = React.useState<'symbol' | 'watchlist' | null>(null)
  const [inputValue, setInputValue] = React.useState("")
  const router = useRouter()
  const { addSymbol, setActiveSymbol } = useWatchlistStore()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault()
        setOpen((open) => !open)
        setPrompt(null)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

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
        runCommand(() => {
          setActiveSymbol(ticker);
          router.push('/');
        });
      } else if (prompt === 'watchlist') {
        runCommand(() => {
          addSymbol(ticker);
          setActiveSymbol(ticker);
          router.push('/');
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
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/calendar'))}>
                <Calendar className="mr-2 h-4 w-4" />
                <span>Economic Calendar</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/news'))}>
                <Newspaper className="mr-2 h-4 w-4" />
                <span>News Wire</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/algo'))}>
                <Cpu className="mr-2 h-4 w-4" />
                <span>Algo Backtester</span>
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