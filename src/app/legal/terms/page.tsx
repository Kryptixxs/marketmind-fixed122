import { MarketingFrame } from '@/app/_components/MarketingFrame';

export default function TermsPage() {
  return (
    <MarketingFrame title="Terms of service" subtitle="V1 legal summary for access-controlled platform use.">
      <article className="border border-border p-4 bg-surface/20 text-xs text-text-secondary space-y-2">
        <p>Access is granted to approved users and organizations. Use is subject to policy controls, entitlement limits, and applicable laws.</p>
        <p>Data may be simulated and must not be treated as investment advice. Users are responsible for validating decisions in their own risk and compliance process.</p>
      </article>
    </MarketingFrame>
  );
}

