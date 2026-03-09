import Link from 'next/link';
import { MarketingFrame } from '../_components/MarketingFrame';

export default function PricingPage() {
  return (
    <MarketingFrame
      title="Pricing"
      subtitle="V1 is access-controlled. We currently onboard teams via request-access and role-based rollout."
    >
      <section className="grid md:grid-cols-2 gap-4">
        <article className="border border-border bg-surface/20 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider">V1 Access Model</h3>
          <ul className="text-xs text-text-secondary mt-3 space-y-2">
            <li>- Guided onboarding by persona (trader, analyst, PM, research).</li>
            <li>- Environment-level entitlements and policy controls.</li>
            <li>- Priority support for terminal workflows and workspace migration.</li>
            <li>- Public status + private operations channels.</li>
          </ul>
        </article>
        <article className="border border-border bg-surface/20 p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider">Request Access</h3>
          <p className="text-xs text-text-secondary mt-3">Share team size, workflows, and deployment needs. We respond with rollout path and commercial terms.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/signup" className="px-3 py-1 bg-accent text-black text-xs font-bold">Request Access</Link>
            <Link href="/contact" className="px-3 py-1 border border-border text-xs">Talk to sales</Link>
          </div>
        </article>
      </section>
    </MarketingFrame>
  );
}

