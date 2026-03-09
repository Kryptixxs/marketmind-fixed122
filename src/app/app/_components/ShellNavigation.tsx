'use client';

import React from 'react';
import { Bell, BookOpen, ClipboardList, Home, LayoutGrid, Settings, TerminalSquare, User2 } from 'lucide-react';
import { DenseTable, type DenseColumn } from '@/features/terminal-next/runtime/primitives';
import { listAuditEvents } from '@/features/terminal-next/runtime/commandAuditStore';
import { listWorkspaces } from '@/features/terminal-next/runtime/workspaceManager';
import { listPinItems } from '@/features/terminal-next/runtime/pinboardStore';
import { useSettings } from '@/services/context/SettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { loadPolicyState } from '@/features/terminal-next/runtime/policyStore';
import { usePathname, useRouter } from 'next/navigation';

type OverlayMode = 'none' | 'home' | 'docs' | 'settings' | 'profile' | 'admin';

function runTerminalCommand(command: string) {
  window.dispatchEvent(new CustomEvent('terminal-shell-command', { detail: { command } }));
}

export function ShellNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { settings, updateSettings } = useSettings();
  const focusTerminal = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('terminal-shell-focus'));
    if (pathname !== '/app' && pathname !== '/app/terminal') {
      router.push('/app/terminal');
    }
  }, [pathname, router]);

  const [mode, setMode] = React.useState<OverlayMode>('none');
  const [query, setQuery] = React.useState('');
  const policy = React.useMemo(() => loadPolicyState(), [mode]);
  const isAdmin = ['ADMIN', 'OPS'].includes(String(policy.activeRole ?? '').toUpperCase());

  const navButtons = [
    { id: 'home', label: 'Home', icon: Home, action: () => setMode('home') },
    { id: 'terminal', label: 'Terminal', icon: TerminalSquare, action: () => { setMode('none'); focusTerminal(); } },
    { id: 'workspaces', label: 'Workspaces', icon: LayoutGrid, action: () => runTerminalCommand('WS GO') },
    { id: 'monitors', label: 'Monitors', icon: ClipboardList, action: () => runTerminalCommand('MON GO') },
    { id: 'alerts', label: 'Alerts', icon: Bell, action: () => runTerminalCommand('ALRT GO') },
    { id: 'orders', label: 'Orders/Blotter', icon: ClipboardList, action: () => runTerminalCommand('BLTR GO') },
    { id: 'docs', label: 'Docs', icon: BookOpen, action: () => setMode('docs') },
    { id: 'settings', label: 'Settings', icon: Settings, action: () => setMode('settings') },
  ] as const;

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMode('none');
      if (!e.ctrlKey) return;
      const k = e.key.toLowerCase();
      if (k === 'h') { e.preventDefault(); setMode('home'); }
      else if (k === 't') { e.preventDefault(); setMode('none'); focusTerminal(); }
      else if (k === 'w') { e.preventDefault(); runTerminalCommand('WS GO'); }
      else if (k === 'm') { e.preventDefault(); runTerminalCommand('MON GO'); }
      else if (k === 'a') { e.preventDefault(); runTerminalCommand('ALRT GO'); }
      else if (k === 'b') { e.preventDefault(); runTerminalCommand('BLTR GO'); }
      else if (k === ',') { e.preventDefault(); setMode('settings'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusTerminal]);

  const launchRows = React.useMemo(() => {
    const audits = listAuditEvents(500);
    const recentMnemonics = Array.from(new Set(audits.map((a) => a.mnemonic).filter(Boolean))).slice(0, 12);
    const recentSecurities = Array.from(new Set(audits.map((a) => a.security).filter(Boolean))).slice(0, 12);
    const workspaces = listWorkspaces().slice(0, 8);
    const pins = listPinItems(12);
    const rows: Array<Record<string, unknown>> = [];
    recentSecurities.forEach((sec) => rows.push({ id: `sec-${sec}`, type: 'SECURITY', item: sec, action: `DES GO`, command: `${sec} DES GO` }));
    recentMnemonics.forEach((mn) => rows.push({ id: `fn-${mn}`, type: 'MNEMONIC', item: mn, action: 'OPEN', command: `${mn} GO` }));
    workspaces.forEach((ws) => rows.push({ id: `ws-${ws.name}`, type: 'WORKSPACE', item: ws.name, action: 'LOAD', command: `WS:${ws.name} GO` }));
    pins.forEach((p) => rows.push({ id: `pin-${p.id}`, type: 'PIN', item: `${p.label} ${p.value}`, action: p.targetMnemonic, command: `${p.targetSecurity ? `${p.targetSecurity} ` : ''}${p.targetMnemonic} GO` }));
    rows.push({ id: 'tutor', type: 'TUTORIAL', item: 'Guided Walkthrough', action: 'OPEN', command: 'TUTOR GO' });
    if (!query.trim()) return rows.slice(0, 120);
    const q = query.toLowerCase();
    return rows.filter((r) => String(r.item).toLowerCase().includes(q) || String(r.type).toLowerCase().includes(q));
  }, [query, mode]);

  const launchCols: DenseColumn[] = [
    { key: 'type', header: 'Type', width: '90px' },
    { key: 'item', header: 'Item', width: '1fr' },
    { key: 'action', header: 'Action', width: '90px' },
  ];

  return (
    <>
      <header className="border-b border-border bg-surface sticky top-0 z-40 h-7">
        <div className="h-7 px-2 flex items-center justify-between gap-2 text-[10px] font-mono">
          <div className="font-bold tracking-wide text-accent">MarketMind Terminal Shell</div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {navButtons.map((n) => (
              <button key={n.id} type="button" onClick={n.action} className="px-1.5 py-0.5 border border-border hover:border-border-highlight whitespace-nowrap inline-flex items-center gap-1">
                <n.icon size={10} />
                {n.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setMode('profile')} className="px-1.5 py-0.5 border border-border hover:border-border-highlight inline-flex items-center gap-1"><User2 size={10} />Profile</button>
            <button type="button" onClick={() => setMode('admin')} className="px-1.5 py-0.5 border border-border hover:border-border-highlight">Admin</button>
            <span className="text-text-tertiary">Ctrl+H/T/W/M/A/B/,</span>
          </div>
        </div>
      </header>

      {mode !== 'none' && (
        <div className="absolute inset-0 z-[80] bg-black/45 flex items-start justify-center pt-10">
          <div className="w-[92vw] max-w-[1100px] h-[78vh] border border-border bg-background flex flex-col min-h-0">
            <div className="h-7 border-b border-border px-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span>{mode} overlay</span>
              <button type="button" className="px-2 py-0.5 border border-border" onClick={() => setMode('none')}>Esc Close</button>
            </div>

            {mode === 'home' && (
              <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter launchpad..." className="h-7 px-2 bg-background border border-border text-xs outline-none" />
                <DenseTable
                  columns={launchCols}
                  rows={launchRows}
                  rowKey="id"
                  className="flex-1 min-h-0"
                  onRowClick={(row) => { runTerminalCommand(String(row.command)); setMode('none'); }}
                />
              </div>
            )}

            {mode === 'docs' && (
              <div className="flex-1 min-h-0 p-2 flex flex-col gap-2 text-xs">
                <div className="border border-border p-2">Terminal-native docs index. Choose where to open docs without losing workspace state.</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'docs-index', label: 'Docs Index', href: '/docs' },
                    { id: 'user-guide', label: 'User Guide (HTML)', href: '/user-guide/index.html' },
                    { id: 'user-guide-pdf', label: 'User Guide (PDF)', href: '/docs/user-guide/MarketMind-Terminal-User-Guide.pdf' },
                  ].map((d) => (
                    <button key={d.id} type="button" className="border border-border p-2 text-left hover:border-border-highlight"
                      onClick={() => window.open(d.href, '_blank', 'noopener,noreferrer')}>
                      {d.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="border border-border p-2 text-left hover:border-border-highlight" onClick={() => { runTerminalCommand('TUTOR GO'); setMode('none'); }}>
                  Open Tutorial in focused pane
                </button>
              </div>
            )}

            {mode === 'settings' && (
              <div className="flex-1 min-h-0 p-2 grid grid-cols-2 gap-2 text-xs">
                <div className="border border-border p-2 space-y-2">
                  <div className="font-bold uppercase">Display</div>
                  <label className="block">Contrast
                    <select className="w-full bg-background border border-border p-1 mt-1" value={settings.contrastMode} onChange={(e) => updateSettings({ contrastMode: e.target.value as 'normal' | 'high' })}>
                      <option value="normal">Normal</option><option value="high">High</option>
                    </select>
                  </label>
                  <label className="block">Density
                    <select className="w-full bg-background border border-border p-1 mt-1" value={settings.density} onChange={(e) => updateSettings({ density: e.target.value as 'compact' | 'standard' | 'spacious' })}>
                      <option value="compact">Compact</option><option value="standard">Standard</option><option value="spacious">Spacious</option>
                    </select>
                  </label>
                  <label className="block">Font size
                    <select className="w-full bg-background border border-border p-1 mt-1" value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: e.target.value as 'xs' | 'sm' | 'md' | 'lg' })}>
                      <option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option>
                    </select>
                  </label>
                </div>
                <div className="border border-border p-2 space-y-2">
                  <div className="font-bold uppercase">Behavior</div>
                  <label className="block">Update flash
                    <select className="w-full bg-background border border-border p-1 mt-1" value={settings.updateFlash ? 'on' : 'off'} onChange={(e) => updateSettings({ updateFlash: e.target.value === 'on' })}>
                      <option value="on">On</option><option value="off">Off</option>
                    </select>
                  </label>
                  <label className="block">Time display
                    <select className="w-full bg-background border border-border p-1 mt-1" value={settings.timeDisplay} onChange={(e) => updateSettings({ timeDisplay: e.target.value as 'ET' | 'LOCAL' | 'GMT' })}>
                      <option value="ET">ET</option><option value="LOCAL">Local</option><option value="GMT">GMT</option>
                    </select>
                  </label>
                  <div className="text-text-secondary border border-border p-2">F1 Help, F2 Menu, Ctrl+K Search, Ctrl+L Command line, Enter Drill, Shift+Enter Send, Alt+Enter Inspect.</div>
                  <button type="button" className="w-full border border-border p-2 text-left hover:border-border-highlight" onClick={() => { runTerminalCommand('TUTOR GO'); setMode('none'); }}>
                    Open Tutorial
                  </button>
                </div>
              </div>
            )}

            {mode === 'profile' && (
              <div className="flex-1 min-h-0 p-2 text-xs space-y-2">
                <div className="border border-border p-2">Profile summary, session controls, and active preference snapshot.</div>
                <button type="button" className="w-full border border-border p-2 text-left hover:border-border-highlight" onClick={() => { runTerminalCommand('PREF GO'); setMode('none'); }}>
                  Open full Preferences in pane
                </button>
                <button type="button" className="w-full border border-border p-2 text-left hover:border-border-highlight" onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}>
                  Sign out
                </button>
              </div>
            )}

            {mode === 'admin' && (
              <div className="flex-1 min-h-0 p-2 text-xs space-y-2">
                {!isAdmin ? (
                  <div className="border border-border p-2 text-negative">Admin access denied for role: {policy.activeRole}. Requires ADMIN/OPS role.</div>
                ) : (
                  <>
                    <div className="border border-border p-2">Admin console access granted. Open policy, entitlement, audit, and governance views in-pane.</div>
                    <div className="grid grid-cols-2 gap-2">
                      {['ADMIN GO', 'ENT GO', 'POL GO', 'AUD GO', 'COMP GO', 'ERR GO'].map((cmd) => (
                        <button key={cmd} type="button" className="border border-border p-2 text-left hover:border-border-highlight"
                          onClick={() => { runTerminalCommand(cmd); setMode('none'); }}>
                          {cmd}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
