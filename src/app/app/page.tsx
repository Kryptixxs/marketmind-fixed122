import Link from 'next/link';
import { BookOpen, LayoutGrid, PlayCircle, TerminalSquare } from 'lucide-react';
import { FunctionExplorer } from '../_components/FunctionExplorer';

export default function AppHomePage({
  searchParams,
}: {
  searchParams?: { onboarding?: string | string[] };
}) {
  const onboardingValue = Array.isArray(searchParams?.onboarding) ? searchParams?.onboarding[0] : searchParams?.onboarding;
  const showOnboarding = onboardingValue === '1';

  return (
    <div className="space-y-4">
      <section className="border border-border bg-surface/20 p-4">
        <h1 className="text-xl font-black tracking-tight">App Launchpad</h1>
        <p className="text-xs text-text-secondary mt-1">Choose your next action: start tutorial, open terminal, or load a saved workspace. GO commands always target focused pane inside terminal.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/app?onboarding=1" className="px-3 py-2 border border-accent text-accent text-xs inline-flex items-center gap-1"><BookOpen size={12} />Start tutorial</Link>
          <Link href="/app/terminal" className="px-3 py-2 bg-accent text-black text-xs font-bold inline-flex items-center gap-1"><TerminalSquare size={12} />Open terminal</Link>
          <Link href="/app/workspaces" className="px-3 py-2 border border-border text-xs inline-flex items-center gap-1"><LayoutGrid size={12} />Load workspace</Link>
          <Link href="/app/terminal?ticker=AAPL%20US%20Equity" className="px-3 py-2 border border-border text-xs inline-flex items-center gap-1"><PlayCircle size={12} />Type ticker now</Link>
        </div>
      </section>

      {showOnboarding && (
        <section className="border border-border bg-surface/20 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wider">First-run onboarding</h2>
          <ol className="mt-2 text-xs text-text-secondary space-y-1">
            <li>1. Open terminal and run `AAPL US EQUITY DES GO`.</li>
            <li>2. Use `F2` MENU and `Ctrl+K` HL for discovery.</li>
            <li>3. Create a new pane using `NP H` or `NP V`.</li>
            <li>4. Save workspace with `WS MY-DEFAULT`.</li>
          </ol>
        </section>
      )}

      <FunctionExplorer limit={40} />
    </div>
  );
}

