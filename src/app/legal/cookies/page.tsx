import { MarketingFrame } from '@/app/_components/MarketingFrame';

export default function CookiesPage() {
  return (
    <MarketingFrame title="Cookie policy" subtitle="Session and preference storage for public and authenticated surfaces.">
      <article className="border border-border p-4 bg-surface/20 text-xs text-text-secondary space-y-2">
        <p>We use essential cookies/storage for authentication sessions, workspace persistence, and UX preferences.</p>
        <p>Additional analytics instrumentation is limited in v1 and focused on reliability and performance diagnostics.</p>
      </article>
    </MarketingFrame>
  );
}

