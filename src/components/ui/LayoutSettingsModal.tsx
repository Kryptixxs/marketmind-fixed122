'use client';

import { X, LayoutGrid, Monitor, Moon, Sun } from 'lucide-react';
import { useSettings, Density, Theme } from '@/services/context/SettingsContext';

interface LayoutSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LayoutSettingsModal({ isOpen, onClose }: LayoutSettingsModalProps) {
  const { settings, updateSettings, resetToDefaults } = useSettings();
  if (!isOpen) return null;

  const applyWorkspace = (preset: string) => {
    window.dispatchEvent(new CustomEvent('vantage-workspace-preset', { detail: preset }));
  };

  const setDensity = (density: Density) => updateSettings({ density });
  const setTheme = (theme: Theme) => updateSettings({ theme });
  const activeLayout = settings.workspaceLayouts[settings.activeWorkspace];
  const patchLayout = (patch: Partial<typeof activeLayout>) => {
    updateSettings({
      workspaceLayouts: {
        ...settings.workspaceLayouts,
        [settings.activeWorkspace]: { ...activeLayout, ...patch },
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <div className="bg-surface border border-border rounded-sm w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-2 text-text-primary">
            <LayoutGrid size={14} className="text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-widest font-mono">Workspace Layout</h2>
          </div>
          <button onClick={onClose} className="p-1 text-text-tertiary hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
           <div className="space-y-2">
             <label className="text-[10px] font-bold text-text-secondary uppercase">Workspace Presets</label>
             <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'BMON', name: 'BMON', desc: 'Monitor' },
                  { id: 'FLOW', name: 'FLOW', desc: 'Order Flow' },
                  { id: 'MACRO', name: 'MACRO', desc: 'Macro' },
                  { id: 'RISK', name: 'RISK', desc: 'Risk' },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyWorkspace(p.id)}
                    className="p-2 border border-border bg-background rounded-sm hover:border-accent hover:text-accent text-text-secondary transition-colors"
                  >
                    <div className="text-[11px] font-black">{p.name}</div>
                    <div className="text-[8px] uppercase tracking-wider">{p.desc}</div>
                  </button>
                ))}
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-bold text-text-secondary uppercase">Active Workspace Schema</label>
             <div className="text-[9px] text-text-tertiary font-mono mb-1">Editing: {settings.activeWorkspace}</div>
             <div className="grid grid-cols-2 gap-2 text-[10px]">
               {[
                 { key: 'showDepth', label: 'Depth' },
                 { key: 'showRisk', label: 'Risk' },
                 { key: 'showMacro', label: 'Macro' },
                 { key: 'showBlotter', label: 'Blotter' },
                 { key: 'showMovers', label: 'Movers' },
               ].map((item) => (
                 <label key={item.key} className="flex items-center gap-2 px-2 py-1 border border-border rounded bg-background text-text-secondary">
                   <input
                     type="checkbox"
                     checked={Boolean(activeLayout[item.key as keyof typeof activeLayout])}
                     onChange={(e) => patchLayout({ [item.key]: e.target.checked })}
                   />
                   {item.label}
                 </label>
               ))}
             </div>
             <div className="space-y-2">
               <label className="text-[9px] text-text-tertiary uppercase">Left Width ({activeLayout.leftWidth}px)</label>
               <input type="range" min={200} max={320} value={activeLayout.leftWidth} onChange={(e) => patchLayout({ leftWidth: Number(e.target.value) })} className="w-full" />
               <label className="text-[9px] text-text-tertiary uppercase">Right Width ({activeLayout.rightWidth}px)</label>
               <input type="range" min={260} max={420} value={activeLayout.rightWidth} onChange={(e) => patchLayout({ rightWidth: Number(e.target.value) })} className="w-full" />
               <label className="text-[9px] text-text-tertiary uppercase">Bottom Height ({activeLayout.bottomHeight}%)</label>
               <input type="range" min={30} max={55} value={activeLayout.bottomHeight} onChange={(e) => patchLayout({ bottomHeight: Number(e.target.value) })} className="w-full" />
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-bold text-text-secondary uppercase">Theme Density</label>
             <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setDensity('compact')}
                  className={`p-3 border rounded-sm flex flex-col items-center gap-2 transition-colors ${
                    settings.density === 'compact'
                      ? 'border-accent ring-1 ring-accent bg-accent/5 text-accent'
                      : 'border-border bg-background text-text-tertiary hover:border-text-secondary'
                  }`}
                >
                  <LayoutGrid size={20} />
                  <span className="text-xs font-bold">Compact</span>
                </button>
                <button
                  onClick={() => setDensity('standard')}
                  className={`p-3 border rounded-sm flex flex-col items-center gap-2 transition-colors ${
                    settings.density === 'standard'
                      ? 'border-accent ring-1 ring-accent bg-accent/5 text-accent'
                      : 'border-border bg-background text-text-tertiary hover:border-text-secondary'
                  }`}
                >
                  <Monitor size={20} />
                  <span className="text-xs font-bold">Standard</span>
                </button>
                <button
                  onClick={() => setDensity('spacious')}
                  className={`p-3 border rounded-sm flex flex-col items-center gap-2 transition-colors ${
                    settings.density === 'spacious'
                      ? 'border-accent ring-1 ring-accent bg-accent/5 text-accent'
                      : 'border-border bg-background text-text-tertiary hover:border-text-secondary'
                  }`}
                >
                  <LayoutGrid size={20} />
                  <span className="text-xs font-bold">Spacious</span>
                </button>
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-bold text-text-secondary uppercase">Color Mode</label>
             <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTheme('dark')}
                  className={`py-2 border rounded-sm flex justify-center items-center gap-2 text-xs font-bold transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-accent ring-1 ring-accent bg-accent/5 text-accent'
                      : 'border-border bg-background text-text-tertiary hover:border-text-secondary'
                  }`}
                >
                  <Moon size={14} /> Dark
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`py-2 border rounded-sm flex justify-center items-center gap-2 text-xs font-bold transition-colors ${
                    settings.theme === 'light'
                      ? 'border-accent ring-1 ring-accent bg-accent/5 text-accent'
                      : 'border-border bg-background text-text-tertiary hover:border-text-secondary'
                  }`}
                >
                  <Sun size={14} /> Light
                </button>
             </div>
           </div>
           
           <button onClick={() => { resetToDefaults(); onClose(); }} className="w-full mt-2 py-2 border border-negative/50 text-negative bg-negative/5 text-xs font-bold rounded-sm hover:bg-negative/20 transition-colors">
             Reset Layout to Defaults
           </button>
        </div>
      </div>
    </div>
  );
}