import Link from 'next/link';

export default function WorkspacesPage() {
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Workspaces</h1>
        <p className="text-xs text-text-secondary mt-1">Save, restore, and duplicate docked pane trees with full pane state continuity.</p>
      </section>
      <section className="border border-border p-4 bg-surface/20 text-xs text-text-secondary">
        <div className="font-semibold text-text-primary mb-2">Empty state</div>
        <p>No named workspaces loaded in this view yet. Open terminal and run <code>WS:&lt;NAME&gt;</code> to save or restore.</p>
        <Link href="/app/terminal" className="inline-block mt-3 px-3 py-1 border border-accent text-accent">Open terminal</Link>
      </section>
    </div>
  );
}

