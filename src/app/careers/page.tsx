import { MarketingFrame } from '../_components/MarketingFrame';

export default function CareersPage() {
  return (
    <MarketingFrame
      title="Careers"
      subtitle="We are building the next generation of professional workflow software."
    >
      <section className="border border-border p-4 bg-surface/20">
        <h3 className="text-sm font-bold">Open roles (v1 stub)</h3>
        <p className="text-xs text-text-secondary mt-2">Hiring plans are currently handled through private referrals and targeted outreach. Public listings will appear here soon.</p>
      </section>
    </MarketingFrame>
  );
}

