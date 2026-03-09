import { MarketingFrame } from '@/app/_components/MarketingFrame';

export default function DisclaimerPage() {
  return (
    <MarketingFrame title="Disclaimer" subtitle="Information and simulations provided by this platform are not financial advice.">
      <article className="border border-border p-4 bg-surface/20 text-xs text-text-secondary space-y-2">
        <p>MarketMind may present simulated values and synthetic scenarios. Always validate against approved production sources before execution.</p>
        <p>Nothing in the platform constitutes solicitation, recommendation, or legal/compliance advice.</p>
      </article>
    </MarketingFrame>
  );
}

