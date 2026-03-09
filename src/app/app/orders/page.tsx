import Link from 'next/link';

export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Orders</h1>
        <p className="text-xs text-text-secondary mt-1">Submit and stage orders with governance controls and execution context.</p>
      </section>
      <section className="border border-border p-4 bg-surface/20 text-xs text-text-secondary">
        <div className="font-semibold text-text-primary mb-2">Execution path</div>
        <p>Launch `ORD`, then inspect `BLTR` and `TCA` for follow-through quality analysis.</p>
        <div className="mt-3 flex gap-2">
          <Link href="/app/blotter" className="px-3 py-1 border border-border">Open blotter</Link>
          <Link href="/app/terminal" className="px-3 py-1 border border-accent text-accent">Open terminal execution flow</Link>
        </div>
      </section>
    </div>
  );
}

