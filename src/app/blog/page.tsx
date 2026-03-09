import { MarketingFrame } from '../_components/MarketingFrame';

export default function BlogPage() {
  return (
    <MarketingFrame
      title="Blog"
      subtitle="Product engineering notes, workflow writeups, and release highlights."
    >
      <div className="space-y-3">
        {[
          'Building a terminal-native app shell for real desk workflows',
          'How we scaled mnemonic discoverability to thousands of functions',
          'Designing no-dead-end drill behavior with provenance-aware entities',
          'From prototype to professional workstation: our V1 quality pass',
        ].map((title, idx) => (
          <article key={title} className="border border-border p-4 bg-surface/20">
            <div className="text-[11px] text-text-secondary">2026-03-0{idx + 2}</div>
            <h3 className="text-sm font-bold mt-1">{title}</h3>
            <p className="text-xs text-text-secondary mt-2">Publishing pipeline in progress for public long-form entries. This placeholder list tracks upcoming posts.</p>
          </article>
        ))}
      </div>
    </MarketingFrame>
  );
}

