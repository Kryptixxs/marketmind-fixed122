export default function AdminPage() {
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Admin</h1>
        <p className="text-xs text-text-secondary mt-1">Role, entitlement, policy, and compliance controls.</p>
      </section>
      <section className="border border-border p-4 bg-surface/20 text-xs text-text-secondary">
        <div className="font-semibold text-text-primary mb-2">Access controlled surface</div>
        <p>In production this route is gated by entitlement checks; in v1 it provides admin-console entry points and operational guidance.</p>
      </section>
    </div>
  );
}

