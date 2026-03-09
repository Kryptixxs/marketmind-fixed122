import Link from 'next/link';

export default function BlotterPage() {
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Blotter</h1>
        <p className="text-xs text-text-secondary mt-1">Review fills, order states, and execution timeline evidence.</p>
      </section>
      <section className="border border-border p-4 bg-surface/20 text-xs text-text-secondary">
        <div className="font-semibold text-text-primary mb-2">No fills loaded</div>
        <p>Use terminal `BLTR` with live/sim routing from order workflows. This surface becomes the centralized execution audit view.</p>
        <Link href="/app/terminal" className="inline-block mt-3 px-3 py-1 border border-accent text-accent">Open BLTR in terminal</Link>
      </section>
    </div>
  );
}

