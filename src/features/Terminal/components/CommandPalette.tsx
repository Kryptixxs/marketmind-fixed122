"use client"

import * as React from "react"
import {
  Calendar, CreditCard, Settings, User, LineChart,
  TrendingUp, Zap, Newspaper, Cpu, Filter, Briefcase, Wrench,
  LayoutGrid, Radar, Waves, Shield, Loader2, Building2, FileText,
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
  dispatchFunctionCode,
  dispatchSymbol,
  dispatchWorkspace,
  BLOOMBERG_FUNCTIONS,
  NAV_ITEMS,
  TOP_SYMBOLS,
  WORKSPACE_FUNCTIONS,
} from "@/features/Terminal/services/command-registry"
import { globalSearchV2 } from "@/app/actions/globalSearch"
import type { IntelligenceResponse, IntelligenceEntity, IntelligenceDocument, IntelligenceSymbol } from "@/lib/intelligence-contract"

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
  const [searchValue, setSearchValue] = React.useState('')
  const [searchResults, setSearchResults] = React.useState<IntelligenceResponse | null>(null)
  const [searching, setSearching] = React.useState(false)
  const [loadingMoreGroup, setLoadingMoreGroup] = React.useState<"entities" | "documents" | "symbols" | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { push } = useTunnel()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  React.useEffect(() => {
    const handler = (e: CustomEvent<{ query?: string }>) => {
      setOpen(true)
      if (e.detail?.query) setSearchValue(e.detail.query)
    }
    window.addEventListener('vantage-open-search', handler as EventListener)
    return () => window.removeEventListener('vantage-open-search', handler as EventListener)
  }, [])

  React.useEffect(() => {
    if (!open) {
      setSearchValue('')
      setSearchResults(null)
      return
    }
  }, [open])

  React.useEffect(() => {
    const q = searchValue.trim()
    if (q.length < 3) {
      setSearchResults(null)
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await globalSearchV2(q, { pageSize: 12 })
        setSearchResults(res)
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue])

  const mergeUniqueByKey = <T,>(current: T[], incoming: T[], getKey: (item: T) => string): T[] => {
    const seen = new Set<string>(current.map(getKey))
    const merged = [...current]
    for (const item of incoming) {
      const key = getKey(item)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
    return merged
  }

  const loadMore = async (group: "entities" | "documents" | "symbols") => {
    if (!searchResults) return
    const cursor =
      group === "entities"
        ? searchResults.entities.nextCursor
        : group === "documents"
          ? searchResults.documents.nextCursor
          : searchResults.symbols?.nextCursor
    if (!cursor) return
    setLoadingMoreGroup(group)
    try {
      const res = await globalSearchV2(searchValue.trim(), {
        pageSize: 12,
        cursors: {
          entities: group === "entities" ? cursor : undefined,
          documents: group === "documents" ? cursor : undefined,
          symbols: group === "symbols" ? cursor : undefined,
        },
      })
      setSearchResults((prev) => {
        if (!prev) return res
        const nextEntities = group === "entities"
          ? mergeUniqueByKey<IntelligenceEntity>(prev.entities.items, res.entities.items, (x) => x.id)
          : prev.entities.items
        const nextDocuments = group === "documents"
          ? mergeUniqueByKey<IntelligenceDocument>(prev.documents.items, res.documents.items, (x) => x.id)
          : prev.documents.items
        const prevSymbols = prev.symbols?.items ?? []
        const resSymbols = res.symbols?.items ?? []
        const nextSymbols = group === "symbols"
          ? mergeUniqueByKey<IntelligenceSymbol>(prevSymbols, resSymbols, (x) => x.symbol)
          : prevSymbols

        return {
          ...prev,
          entities: {
            ...prev.entities,
            items: nextEntities,
            nextCursor: group === "entities" ? res.entities.nextCursor : prev.entities.nextCursor,
          },
          documents: {
            ...prev.documents,
            items: nextDocuments,
            nextCursor: group === "documents" ? res.documents.nextCursor : prev.documents.nextCursor,
          },
          symbols: {
            ...(prev.symbols ?? { items: [], total: 0 }),
            items: nextSymbols,
            nextCursor: group === "symbols" ? res.symbols?.nextCursor : prev.symbols?.nextCursor,
            total: prev.symbols?.total ?? res.symbols?.total,
          },
        }
      })
    } finally {
      setLoadingMoreGroup(null)
    }
  }

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

  const handleBloombergCode = (code: string, path: string) => {
    setOpen(false);
    setTimeout(() => {
      dispatchFunctionCode(code);
      router.push(path);
    }, 50);
  }

  const hasSearchResults = searchResults && (
    searchResults.entities.items.length > 0 ||
    searchResults.documents.items.length > 0 ||
    (searchResults.symbols?.items.length ?? 0) > 0
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      commandValue={searchValue}
      commandOnValueChange={setSearchValue}
    >
      <CommandInput placeholder="Search entities, news, symbols (e.g. palantir russia, NVDA 2019-08-09)..." />
      <CommandList>
        <CommandEmpty>
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-6 text-text-tertiary">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-[10px] uppercase font-bold">Searching...</span>
            </div>
          ) : (
            'No results found.'
          )}
        </CommandEmpty>

        {hasSearchResults && (
          <>
            <CommandGroup heading="Search Results">
              {searchResults!.entities.items.map((ent) => (
                <CommandItem
                  key={`ent-${ent.id}`}
                  value={`${ent.display_name} ${ent.ticker ?? ''} entity`}
                  onSelect={() => {
                    setOpen(false)
                    const sym = ent.ticker || ent.display_name
                    dispatchSymbol(sym)
                    push({ type: 'SYMBOL', symbol: sym, label: ent.display_name })
                    if (pathname !== '/dashboard' && pathname !== '/charts') {
                      setTimeout(() => router.push('/dashboard'), 50)
                    }
                  }}
                >
                  <Building2 className="mr-2 h-3.5 w-3.5 text-cyan" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px]">{ent.display_name}</span>
                    <span className="text-[9px] text-text-tertiary">
                      {ent.ticker ?? ent.type}
                    </span>
                  </div>
                  <CommandShortcut>Entity</CommandShortcut>
                </CommandItem>
              ))}
              {searchResults!.entities.nextCursor && (
                <CommandItem
                  value="load more entities"
                  onSelect={() => loadMore("entities")}
                  disabled={loadingMoreGroup === "entities"}
                >
                  <Loader2 className={`mr-2 h-3.5 w-3.5 ${loadingMoreGroup === "entities" ? "animate-spin" : ""}`} />
                  <span className="text-[10px] uppercase font-bold">Load More Entities</span>
                </CommandItem>
              )}
              {searchResults!.documents.items.map((doc) => (
                <CommandItem
                  key={`doc-${doc.id}`}
                  value={`${doc.title} ${doc.published_at} news`}
                  onSelect={() => {
                    setOpen(false)
                    push({
                      type: 'ARTICLE',
                      id: doc.id,
                      title: doc.title,
                      label: doc.title,
                      source: doc.source ?? '',
                      time: doc.published_at,
                    })
                    setTimeout(() => router.push('/news'), 50)
                  }}
                >
                  <FileText className="mr-2 h-3.5 w-3.5 text-accent" />
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] truncate">{doc.title}</span>
                    <span className="text-[9px] text-text-tertiary">{doc.published_at} · {doc.source || 'News'}</span>
                  </div>
                  <CommandShortcut>News</CommandShortcut>
                </CommandItem>
              ))}
              {searchResults!.documents.nextCursor && (
                <CommandItem
                  value="load more documents"
                  onSelect={() => loadMore("documents")}
                  disabled={loadingMoreGroup === "documents"}
                >
                  <Loader2 className={`mr-2 h-3.5 w-3.5 ${loadingMoreGroup === "documents" ? "animate-spin" : ""}`} />
                  <span className="text-[10px] uppercase font-bold">Load More News</span>
                </CommandItem>
              )}
              {(searchResults!.symbols?.items ?? []).map((s) => (
                <CommandItem
                  key={`sym-${s.symbol}`}
                  value={`${s.symbol} ${s.name} ${s.type}`}
                  onSelect={() => handleSymbolSelect(s.symbol)}
                >
                  <TrendingUp className="mr-2 h-3.5 w-3.5 text-positive" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[11px]">{s.symbol}</span>
                    <span className="text-[9px] text-text-tertiary">{s.name} · {s.type}</span>
                  </div>
                  <CommandShortcut>{s.type}</CommandShortcut>
                </CommandItem>
              ))}
              {searchResults!.symbols?.nextCursor && (
                <CommandItem
                  value="load more symbols"
                  onSelect={() => loadMore("symbols")}
                  disabled={loadingMoreGroup === "symbols"}
                >
                  <Loader2 className={`mr-2 h-3.5 w-3.5 ${loadingMoreGroup === "symbols" ? "animate-spin" : ""}`} />
                  <span className="text-[10px] uppercase font-bold">Load More Symbols</span>
                </CommandItem>
              )}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

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

        <CommandGroup heading="Classic Bloomberg Codes">
          {BLOOMBERG_FUNCTIONS.map((fn) => (
            <CommandItem
              key={fn.code}
              onSelect={() => handleBloombergCode(fn.code, fn.path)}
              value={`${fn.code} ${fn.label} ${fn.desc}`}
            >
              <Zap className="mr-2 h-3.5 w-3.5 text-warning" />
              <div className="flex flex-col">
                <span className="font-bold text-[11px]">{fn.code} &lt;GO&gt;</span>
                <span className="text-[9px] text-text-tertiary">{fn.label}</span>
              </div>
              <CommandShortcut>Function</CommandShortcut>
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
