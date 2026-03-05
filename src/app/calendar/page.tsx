'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, DollarSign, Loader2 } from 'lucide-react';
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
      {/* Module Header / Navigation */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-surface shrink-0 flex-wrap">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2 whitespace-nowrap">
          <Calendar size={18} className="text-accent" />
          Market Calendar
        </h1>
        <div className="hidden sm:block h-6 w-[1px] bg-border" />
        
        <div className="flex p-1 bg-background border border-border rounded-lg w-full sm:w-auto shrink-0">
          <button
            onClick={() => setView('economic')}
            className={`
              flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all
              ${view === 'economic' 
                ? 'bg-surface-highlight text-accent shadow-sm' 
                : 'text-text-tertiary hover:text-text-primary'}
            `}
          >
            <Calendar size={14} /> Economic
          </button>
          <button
            onClick={() => setView('earnings')}
            className={`
              flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all
              ${view === 'earnings' 
                ? 'bg-surface-highlight text-accent shadow-sm' 
                : 'text-text-tertiary hover:text-text-primary'}
            `}
          >
            <DollarSign size={14} /> Earnings
          </button>
        </div>

        {/* --- US MACRO TICKER --- */}
        <div className="hidden lg:block flex-1 min-w-0 h-10 ml-2">
          <MacroTicker />
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden p-2 min-h-0">
        {view === 'economic' ? <EconomicCalendarView /> : <EarningsCalendarView />}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-background min-h-0">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    }>
      <CalendarContent />
    </Suspense>
  );
}