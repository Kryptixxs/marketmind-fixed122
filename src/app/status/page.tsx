import { MarketingFrame } from '../_components/MarketingFrame';

const METRICS = [
  ['Core app availability', '99.97%', 'Operational'],
  ['Terminal feed bus', '99.94%', 'Operational'],
  ['Docs + guide delivery', '99.99%', 'Operational'],
  ['Alert routing', '99.92%', 'Degraded minor delays'],
];

export default function StatusPage() {
  return (
    <MarketingFrame
      title="System status"
      subtitle="Public operational status for product surfaces, data feeds, and supporting systems."
    >
      <section className="border border-border bg-surface/20">
        <table className="w-full text-xs">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="text-left p-3">Component</th>
              <th className="text-left p-3">30d uptime</th>
              <th className="text-left p-3">Current</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map(([name, uptime, state]) => (
              <tr key={name} className="border-b border-border/60">
                <td className="p-3">{name}</td>
                <td className="p-3">{uptime}</td>
                <td className="p-3">{state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid md:grid-cols-2 gap-4 mt-6">
        <article className="border border-border p-4">
          <h3 className="text-sm font-bold">Recent incidents</h3>
          <ul className="text-xs text-text-secondary mt-2 space-y-1">
            <li>- 2026-03-05: brief alert fanout lag resolved in 11 minutes.</li>
            <li>- 2026-03-02: docs preview timeout mitigated with cache rollback.</li>
          </ul>
        </article>
        <article className="border border-border p-4">
          <h3 className="text-sm font-bold">Subscribe</h3>
          <p className="text-xs text-text-secondary mt-2">For v1, status notifications are delivered through in-app messages and direct support channels.</p>
        </article>
      </section>
    </MarketingFrame>
  );
}

