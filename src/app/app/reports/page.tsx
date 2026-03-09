export default function ReportsPage() {
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Reports & Exports</h1>
        <p className="text-xs text-text-secondary mt-1">Compile clips, snapshots, and report sections from multi-pane workflows.</p>
      </section>
      <section className="border border-border p-4 bg-surface/20 text-xs text-text-secondary">
        <div className="font-semibold text-text-primary mb-2">Export queue is empty</div>
        <p>Generate clips with GRAB/CLIP and reports with RPT/EXP from terminal workflows.</p>
      </section>
    </div>
  );
}

