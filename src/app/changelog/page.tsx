import { MarketingFrame } from '../_components/MarketingFrame';

export default function ChangelogPage() {
  return (
    <MarketingFrame
      title="Changelog"
      subtitle="Track notable platform and app-shell updates."
    >
      <div className="space-y-3">
        {[
          ['v1.0.0', 'Public site + app shell route tree + onboarding launchpad.'],
          ['v0.9.5', 'Dockable pane engine hardening and workspace persistence updates.'],
          ['v0.9.2', 'NavTree scale pass for thousands of mnemonics and search improvements.'],
        ].map(([ver, note]) => (
          <article key={ver} className="border border-border p-4 bg-surface/20">
            <h3 className="text-sm font-bold">{ver}</h3>
            <p className="text-xs text-text-secondary mt-1">{note}</p>
          </article>
        ))}
      </div>
    </MarketingFrame>
  );
}

