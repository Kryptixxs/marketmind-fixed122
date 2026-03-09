export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <section className="border border-border p-4 bg-surface/20">
        <h1 className="text-lg font-black">Profile</h1>
        <p className="text-xs text-text-secondary mt-1">User identity, role context, and onboarding state.</p>
      </section>
      <section className="border border-border p-4 bg-surface/20 text-xs text-text-secondary">
        <div className="font-semibold text-text-primary mb-2">User summary</div>
        <p>Role and entitlement detail is sourced from authenticated session context and admin policy state.</p>
      </section>
    </div>
  );
}

