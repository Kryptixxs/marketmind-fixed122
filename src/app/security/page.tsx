import { MarketingFrame } from '../_components/MarketingFrame';

export default function SecurityPage() {
  return (
    <MarketingFrame
      title="Security, trust, and provenance"
      subtitle="Operational controls are visible across public trust pages and authenticated governance surfaces."
    >
      <div className="grid md:grid-cols-2 gap-4">
        <article className="border border-border p-4 bg-surface/20">
          <h3 className="text-sm font-bold">Platform controls</h3>
          <ul className="text-xs text-text-secondary mt-2 space-y-1">
            <li>- Role and entitlement gates for app surfaces.</li>
            <li>- Policy engine for blocked actions and compliance modes.</li>
            <li>- Audit trails for commands, exports, and key workflow events.</li>
          </ul>
        </article>
        <article className="border border-border p-4 bg-surface/20">
          <h3 className="text-sm font-bold">Data transparency</h3>
          <ul className="text-xs text-text-secondary mt-2 space-y-1">
            <li>- Provenance labels on values (SIM/LIVE/STALE).</li>
            <li>- Field lineage and evidence drill paths.</li>
            <li>- Public status overview with feed/latency context.</li>
          </ul>
        </article>
      </div>
      <div className="mt-6 border border-border p-4 text-xs text-text-secondary">
        Security notice: this environment is simulation-first and clearly labels non-live data paths while preserving operational semantics.
      </div>
    </MarketingFrame>
  );
}

