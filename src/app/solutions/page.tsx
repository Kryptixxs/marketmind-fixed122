import Link from 'next/link';
import { MarketingFrame } from '../_components/MarketingFrame';

export default function SolutionsPage() {
  return (
    <MarketingFrame
      title="Solutions by persona"
      subtitle="Purpose-built launch paths for traders, analysts, portfolio managers, and research teams."
    >
      <div className="grid md:grid-cols-2 gap-4">
        {[
          ['Trader', 'Launch terminal, run order/blotter loops, monitor execution quality, and react to alerts in one shell.'],
          ['Analyst', 'Move from DES/FA/HP into lineage and relationship evidence without dead ends.'],
          ['Portfolio Manager', 'Track monitor sheets, exposures, and risk workflows with workspace continuity.'],
          ['Research Desk', 'Tie macro/news/regime context into ticker-level explainers and evidence tiles.'],
        ].map(([title, text]) => (
          <article key={title} className="border border-border bg-surface/20 p-4">
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-xs text-text-secondary mt-2">{text}</p>
            <Link href="/app?onboarding=1" className="inline-block mt-3 text-xs text-accent hover:underline">Start onboarding for {title.toLowerCase()}</Link>
          </article>
        ))}
      </div>
    </MarketingFrame>
  );
}

