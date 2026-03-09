'use client';

import { useSettings } from '@/services/context/SettingsContext';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Settings</h1>
        <p className="text-xs text-text-secondary mt-1">Density, personalization, keyboard mapping, and workspace preferences.</p>
      </section>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        <article className="border border-border p-3 bg-surface/20">
          <div className="font-semibold mb-2">Contrast mode</div>
          <select className="w-full bg-background border border-border p-2" value={settings.contrastMode} onChange={(e) => updateSettings({ contrastMode: e.target.value as 'normal' | 'high' })}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </article>
        <article className="border border-border p-3 bg-surface/20">
          <div className="font-semibold mb-2">Density</div>
          <select className="w-full bg-background border border-border p-2" value={settings.density} onChange={(e) => updateSettings({ density: e.target.value as 'compact' | 'standard' | 'spacious' })}>
            <option value="compact">Compact</option>
            <option value="standard">Standard</option>
            <option value="spacious">Spacious</option>
          </select>
        </article>
        <article className="border border-border p-3 bg-surface/20">
          <div className="font-semibold mb-2">Font size</div>
          <select className="w-full bg-background border border-border p-2" value={settings.fontSize} onChange={(e) => updateSettings({ fontSize: e.target.value as 'xs' | 'sm' | 'md' | 'lg' })}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </article>
        <article className="border border-border p-3 bg-surface/20">
          <div className="font-semibold mb-2">Update flash</div>
          <select className="w-full bg-background border border-border p-2" value={settings.updateFlash ? 'on' : 'off'} onChange={(e) => updateSettings({ updateFlash: e.target.value === 'on' })}>
            <option value="on">On</option>
            <option value="off">Off</option>
          </select>
        </article>
        <article className="border border-border p-3 bg-surface/20">
          <div className="font-semibold mb-2">Time display</div>
          <select className="w-full bg-background border border-border p-2" value={settings.timeDisplay} onChange={(e) => updateSettings({ timeDisplay: e.target.value as 'ET' | 'LOCAL' | 'GMT' })}>
            <option value="ET">ET</option>
            <option value="LOCAL">Local</option>
            <option value="GMT">GMT</option>
          </select>
        </article>
        <article className="border border-border p-3 bg-surface/20">
          <div className="font-semibold mb-2">Shortcuts help</div>
          <div className="text-text-secondary">F1 Help, F2 Menu, Ctrl+K HL, Ctrl+L command line, Enter drill, Shift+Enter send, Alt+Enter inspect.</div>
        </article>
      </section>
    </div>
  );
}

