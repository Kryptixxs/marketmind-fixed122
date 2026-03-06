'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, DollarSign, Loader2, Globe } from 'lucide-react';
import { EconomicCalendarView } from '@/features/Calendar/components/calendar/EconomicCalendarView';
import { EarningsCalendarView } from '@/features/Calendar/components/calendar/EarningsCalendarView';
import { MacroTicker } from '@/features/Calendar/components/calendar/MacroTicker';

function CalendarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = searchParams.get('view') || 'economic';

  const setView = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', v);
    router.replace(`/calendar?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full bg-background min-h-0">
      <div className="flex items-center gap-4 p-3 border-b border-border bg-surface shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-cyan" />
          <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Market Calendar</span>
        </div>

        <div className="hidden sm:block h-5 w-px bg-border" />

        <div className="flex bg-background border border-border rounded overflow-hidden shrink-0">
          <button
            onClick={() => setView('economic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              view === 'economic' ? 'bg-accent/10 text-accent' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <Calendar size={12} /> Economic
          </button>
          <button
            onClick={() => setView('earnings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              view === 'earnings' ? 'bg-accent/10 text-accent' : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            <DollarSign size={12} /> Earnings
          </button>
        </div>

        <div className="hidden lg:block flex-1 min-w-0 h-8 ml-2">
          <MacroTicker />
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        {view === 'economic' ? <EconomicCalendarView /> : <EarningsCalendarView />}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background min-h-0">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    }>
      <CalendarContent />
    </Suspense>
  );
}
