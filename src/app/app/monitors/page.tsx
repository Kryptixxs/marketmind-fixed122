import Link from 'next/link';

export default function MonitorsPage() {
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Monitors</h1>
        <p className="text-xs text-text-secondary mt-1">Build watchlists, attach field columns, and route alerts to operational workflows.</p>
      </section>
      <section className="border border-border p-4 bg-surface/20 text-xs text-text-secondary">
        <div className="font-semibold text-text-primary mb-2">V1 monitor command path</div>
        <p>Use terminal commands `MON`, `MON+`, and `FLD` to configure field-driven monitors.</p>
        <Link href="/app/terminal" className="inline-block mt-3 px-3 py-1 border border-accent text-accent">Open monitor workflow</Link>
      </section>
    </div>
  );
}

