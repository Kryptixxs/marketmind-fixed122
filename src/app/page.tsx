import Link from 'next/link';
import { ArrowRight, BookOpen, Gauge, Lock, PanelLeft, ShieldCheck } from 'lucide-react';
import { MarketingFrame } from './_components/MarketingFrame';

export default function LandingPage() {
  return (
    <MarketingFrame
      title="MarketMind: Terminal-grade intelligence in a full product platform"
      subtitle="Public site, onboarding, docs, trust, and an authenticated app shell where terminal workflows, monitors, alerts, and governance operate together."
    >
      <section className="grid lg:grid-cols-2 gap-6">
        <article className="border border-border bg-surface/30 p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-accent"><Gauge size={14} />V1 Professional Surface</div>
          <h2 className="text-2xl font-black tracking-tight">The terminal is inside the product, not the whole product.</h2>
          <p className="text-sm text-text-secondary">MarketMind ships a realistic page tree for institutions: public website, auth routes, and an authenticated app shell with launchpad, workspaces, monitors, alerts, orders, blotter, reports, settings, and admin controls.</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/app" className="px-3 py-2 bg-accent text-black text-xs font-bold inline-flex items-center gap-1">Open App Shell <ArrowRight size={12} /></Link>
            <Link href="/app/terminal" className="px-3 py-2 border border-border text-xs hover:border-border-highlight inline-flex items-center gap-1"><PanelLeft size={12} />Launch Terminal</Link>
            <Link href="/app?onboarding=1" className="px-3 py-2 border border-accent text-accent text-xs inline-flex items-center gap-1"><BookOpen size={12} />Start Tutorial</Link>
          </div>
        </article>

        <article className="border border-border bg-surface/20 p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-3">What you can do immediately</h3>
          <ul className="text-sm text-text-secondary space-y-2">
            <li>- Discover any mnemonic from NavTree/HL and launch into focused panes.</li>
            <li>- Save and restore docked workspaces with pane state continuity.</li>
            <li>- Build monitors from field catalog and route alerts to workflows.</li>
            <li>- Track policy, entitlement, and audit evidence in admin surfaces.</li>
          </ul>
          <div className="mt-4 p-3 border border-border text-xs text-text-secondary">
            <div className="font-semibold text-text-primary inline-flex items-center gap-1"><ShieldCheck size={12} />Trust & provenance</div>
            <div className="mt-1">Every value can carry provenance labels (SIM/LIVE/STALE) and drill into lineage. Public status and security pages explain operational posture.</div>
          </div>
        </article>
      </section>

      <section className="grid md:grid-cols-3 gap-4 mt-6">
        {[
          { title: 'For traders', body: 'Low-latency launchpad into terminal, orders, blotter, and alert triage.' },
          { title: 'For analysts', body: 'Research workflows, field lineage, relationship intelligence, and docs.' },
          { title: 'For platform teams', body: 'Policy controls, entitlements, audit trails, and status telemetry.' },
        ].map((x) => (
          <article key={x.title} className="border border-border bg-surface/20 p-4">
            <h3 className="text-sm font-bold">{x.title}</h3>
            <p className="text-xs text-text-secondary mt-2">{x.body}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 border border-border bg-surface/20 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm"><span className="font-semibold">Need implementation depth?</span> Browse full docs and the complete user guide.</div>
        <div className="flex gap-2">
          <Link href="/docs" className="px-3 py-1 border border-border text-xs">Docs Index</Link>
          <a href="/user-guide/index.html" className="px-3 py-1 border border-border text-xs">HTML Guide</a>
          <a href="/docs/user-guide/MarketMind-Terminal-User-Guide.pdf" className="px-3 py-1 border border-border text-xs">PDF Guide</a>
        </div>
      </section>

      <section className="mt-6 text-xs text-text-secondary border border-border p-4 inline-flex items-center gap-2">
        <Lock size={12} /> Request access for v1; enterprise workflows and routes are enabled behind authentication in `/app`.
      </section>
    </MarketingFrame>
  );
}
