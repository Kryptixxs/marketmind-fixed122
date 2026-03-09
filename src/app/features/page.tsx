import Link from 'next/link';
import { MarketingFrame } from '../_components/MarketingFrame';

export default function FeaturesPage() {
  return (
    <MarketingFrame
      title="Platform features"
      subtitle="A realistic product tree with terminal-native workflows, governance, and collaboration layers."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          ['Terminal Workspace Engine', 'Unlimited docked panes, nested splits, tab groups, focused GO routing, and workspace restore.'],
          ['Discovery Layer', 'HL search + NavTree + context MENU + HELP generation for thousands of mnemonics.'],
          ['Field & Lineage System', 'Field catalog, provenance badges, and drill-through lineage/evidence chains.'],
          ['Monitors & Alerts', 'Data-driven monitor columns, watchlists, alert rules, and notification routing.'],
          ['Collaboration', 'Messages, notes, clips, and report handoff across desk workflows.'],
          ['Admin & Governance', 'Entitlements, policy controls, audit logs, and operations telemetry.'],
        ].map(([title, text]) => (
          <article key={title} className="border border-border bg-surface/20 p-4">
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-xs text-text-secondary mt-2">{text}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 border border-border p-4 text-sm">
        <span className="font-semibold">Next step:</span> launch onboarding and tutorial from the app shell.
        <div className="mt-3 flex gap-2">
          <Link href="/app?onboarding=1" className="px-3 py-1 border border-accent text-accent text-xs">Start Tutorial</Link>
          <Link href="/app/terminal" className="px-3 py-1 border border-border text-xs">Open Terminal</Link>
        </div>
      </div>
    </MarketingFrame>
  );
}

