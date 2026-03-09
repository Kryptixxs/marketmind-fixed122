import { MarketingFrame } from '@/app/_components/MarketingFrame';

export default function PrivacyPage() {
  return (
    <MarketingFrame title="Privacy policy" subtitle="How we handle account, usage, and operational telemetry data.">
      <article className="border border-border p-4 bg-surface/20 text-xs text-text-secondary space-y-2">
        <p>We collect account identity, workflow usage metadata, and operational telemetry necessary to run and improve the platform.</p>
        <p>Data is access-scoped by role and environment. Sensitive actions are logged for security and compliance evidence.</p>
      </article>
    </MarketingFrame>
  );
}

