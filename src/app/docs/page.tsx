import Link from 'next/link';
import { MarketingFrame } from '../_components/MarketingFrame';

export default function DocsPage() {
  return (
    <MarketingFrame
      title="Documentation"
      subtitle="Start with quick references, then deep-dive into the complete MarketMind Terminal User Guide."
    >
      <div className="grid md:grid-cols-2 gap-4">
        <article className="border border-border p-4 bg-surface/20">
          <h3 className="text-sm font-bold">Quick links</h3>
          <div className="mt-3 flex flex-col gap-2 text-xs">
            <Link href="/app?onboarding=1" className="text-accent hover:underline">Start onboarding in app shell</Link>
            <Link href="/app/terminal" className="text-accent hover:underline">Launch terminal workspace</Link>
            <a href="/user-guide/index.html" className="text-accent hover:underline">Open full HTML user guide</a>
            <a href="/docs/user-guide/MarketMind-Terminal-User-Guide.pdf" className="text-accent hover:underline">Download PDF guide</a>
          </div>
        </article>
        <article className="border border-border p-4 bg-surface/20">
          <h3 className="text-sm font-bold">Coverage</h3>
          <p className="text-xs text-text-secondary mt-2">Guide includes terminal model, keyboard workflows, mnemonics, lineage/provenance, settings, troubleshooting, and operational playbooks.</p>
        </article>
      </div>
    </MarketingFrame>
  );
}

