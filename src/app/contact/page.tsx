import { MarketingFrame } from '../_components/MarketingFrame';

export default function ContactPage() {
  return (
    <MarketingFrame
      title="Contact"
      subtitle="Sales, support, partnerships, and implementation planning."
    >
      <section className="grid md:grid-cols-2 gap-4">
        <article className="border border-border p-4 bg-surface/20">
          <h3 className="text-sm font-bold">Commercial</h3>
          <p className="text-xs text-text-secondary mt-2">Email: revenue@marketmind.example</p>
          <p className="text-xs text-text-secondary">Use case scoping, onboarding windows, and deployment planning.</p>
        </article>
        <article className="border border-border p-4 bg-surface/20">
          <h3 className="text-sm font-bold">Support</h3>
          <p className="text-xs text-text-secondary mt-2">Email: support@marketmind.example</p>
          <p className="text-xs text-text-secondary">Include workspace, mnemonic, and timestamp for fastest triage.</p>
        </article>
      </section>
    </MarketingFrame>
  );
}

