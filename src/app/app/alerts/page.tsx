import Link from 'next/link';

export default function AlertsPage() {
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Alerts</h1>
        <p className="text-xs text-text-secondary mt-1">Manage alert rules, statuses, and triage paths across desk workflows.</p>
      </section>
      <section className="border border-border p-4 bg-surface/20 text-xs text-text-secondary">
        <div className="font-semibold text-text-primary mb-2">No active alert triage queue</div>
        <p>Create rules in terminal using `ALRT` or `ALRT+`, then return here for policy-aware queue views.</p>
        <Link href="/app/terminal" className="inline-block mt-3 px-3 py-1 border border-accent text-accent">Create alert rules</Link>
      </section>
    </div>
  );
}

