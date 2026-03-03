"use client"

import * as React from "react"
import {
  Calendar,
  Search,
  Plus,
  LayoutGrid,
  Newspaper,
  Cpu,
  Trash2
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
  const [prompt, setPrompt] = React.useState<'open' | 'add' | 'remove' | null>(null)
  const [inputValue, setInputValue] = React.useState("")
  const router = useRouter()
  const { symbols, addSymbol, removeSymbol, setActiveSymbol } = useWatchlistStore()

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
      if (prompt === 'open') {
        runCommand(() => {
          setActiveSymbol(ticker);
          router.push('/');
        });
      } else if (prompt === 'add') {
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
        placeholder={
          prompt === 'open' ? "Enter ticker to open..." : 
          prompt === 'add' ? "Enter ticker to add to watchlist..." : 
          prompt === 'remove' ? "Select ticker to remove..." :
          "Type a command or search..."
        } 
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
            
            <CommandGroup heading="Watchlist Management">
              <CommandItem onSelect={() => { setPrompt('open'); setInputValue(""); }}>
                <Search className="mr-2 h-4 w-4" />
                <span>Open Symbol...</span>
                <CommandShortcut>S</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setPrompt('add'); setInputValue(""); }}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Add to Watchlist...</span>
                <CommandShortcut>A</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => { setPrompt('remove'); setInputValue(""); }}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Remove from Watchlist...</span>
              </CommandItem>
            </CommandGroup>
          </>
        ) : prompt === 'remove' ? (
          <CommandGroup heading="Remove from Watchlist">
            {symbols.map(sym => (
              <CommandItem key={sym} onSelect={() => runCommand(() => removeSymbol(sym))}>
                <Trash2 className="mr-2 h-4 w-4 text-negative" />
                <span>{sym}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : (
          <CommandGroup heading={prompt === 'open' ? "Open Symbol" : "Add to Watchlist"}>
            <div className="p-4 text-xs text-text-tertiary">
              Type ticker and press <kbd className="bg-surface-highlight px-1 rounded">Enter</kbd> to confirm.
            </div>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}