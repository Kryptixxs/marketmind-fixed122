"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  LineChart,
  Home,
  TrendingUp,
  Search,
  Globe,
  Zap,
  Layout,
  Layers,
  BarChart4
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
import { useRouter } from "next/navigation"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

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

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  if (!open) return null

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Suggestions">
          <CommandItem onSelect={() => runCommand(() => router.push('/charts'))}>
            <LineChart className="mr-2 h-4 w-4" />
            <span>Open Terminal</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/economic'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Economic Calendar</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/tools/forex'))}>
            <Calculator className="mr-2 h-4 w-4" />
            <span>Forex Calculator</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Market Data">
          <CommandItem onSelect={() => runCommand(() => router.push('/?tab=indices'))}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Indices</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/?tab=crypto'))}>
            <Zap className="mr-2 h-4 w-4" />
            <span>Crypto</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/?tab=forex'))}>
            <Globe className="mr-2 h-4 w-4" />
            <span>Forex</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => runCommand(() => console.log('Profile'))}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Billing'))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Settings'))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
