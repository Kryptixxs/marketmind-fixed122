import { MarketingFrame } from '../_components/MarketingFrame';

export default function AboutPage() {
  return (
    <MarketingFrame
      title="About MarketMind"
      subtitle="We build professional workflow software that combines terminal depth with product-grade usability."
    >
      <section className="grid md:grid-cols-2 gap-4">
        <article className="border border-border p-4 bg-surface/20">
          <h3 className="text-sm font-bold">Mission</h3>
          <p className="text-xs text-text-secondary mt-2">Help teams move from data lookup to explainable decisions with dense, drillable, provenance-aware tooling.</p>
        </article>
        <article className="border border-border p-4 bg-surface/20">
          <h3 className="text-sm font-bold">Approach</h3>
          <p className="text-xs text-text-secondary mt-2">Terminal semantics where it matters, app-shell guidance where teams onboard and operate day to day.</p>
        </article>
      </section>
    </MarketingFrame>
  );
}

