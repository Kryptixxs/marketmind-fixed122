'use client';

import { X, LayoutGrid, Monitor, Moon, Sun } from 'lucide-react';

interface LayoutSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LayoutSettingsModal({ isOpen, onClose }: LayoutSettingsModalProps) {
  if (!isOpen) return null;

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
             <label className="text-[10px] font-bold text-text-secondary uppercase">Theme Density</label>
             <div className="grid grid-cols-2 gap-2">
                <button className="p-3 border border-accent ring-1 ring-accent bg-accent/5 rounded-sm flex flex-col items-center gap-2 text-accent">
                  <LayoutGrid size={20} />
                  <span className="text-xs font-bold">Institutional</span>
                </button>
                <button className="p-3 border border-border bg-background rounded-sm flex flex-col items-center gap-2 text-text-tertiary hover:border-text-secondary">
                  <Monitor size={20} />
                  <span className="text-xs font-bold">Relaxed</span>
                </button>
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-bold text-text-secondary uppercase">Color Mode</label>
             <div className="grid grid-cols-2 gap-2">
                <button className="py-2 border border-accent ring-1 ring-accent bg-accent/5 rounded-sm flex justify-center items-center gap-2 text-accent text-xs font-bold">
                  <Moon size={14} /> Dark
                </button>
                <button className="py-2 border border-border bg-background rounded-sm flex justify-center items-center gap-2 text-text-tertiary hover:border-text-secondary text-xs font-bold cursor-not-allowed opacity-50" title="Light mode is disabled for Pro Terminals">
                  <Sun size={14} /> Light
                </button>
             </div>
           </div>
           
           <button onClick={() => { alert('Workspace reset to defaults.'); onClose(); }} className="w-full mt-2 py-2 border border-negative/50 text-negative bg-negative/5 text-xs font-bold rounded-sm hover:bg-negative/20 transition-colors">
             Reset Layout to Defaults
           </button>
        </div>
      </div>
    </div>
  );
}