'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, DollarSign } from 'lucide-react';
import { EconomicCalendarView } from '@/components/calendar/EconomicCalendarView';
import { EarningsCalendarView } from '@/components/calendar/EarningsCalendarView';

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const view = searchParams.get('view') || 'economic';

  const setView = (v: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', v);
    router.replace(`/calendar?${params.toString()}`);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Module Header / Navigation */}
      <div className="flex items-center gap-4 p-4 border-b border-border bg-surface shrink-0">
        <h1 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <Calendar size={18} className="text-accent" />
          Market Calendar
        </h1>
        <div className="h-6 w-[1px] bg-border" />
        <div className="flex p-1 bg-background border border-border rounded-lg">
          <button
            onClick={() => setView('economic')}
            className={`
              flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all
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
              flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all
              ${view === 'earnings' 
                ? 'bg-surface-highlight text-accent shadow-sm' 
                : 'text-text-tertiary hover:text-text-primary'}
            `}
          >
            <DollarSign size={14} /> Earnings
          </button>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden p-2">
        {view === 'economic' ? <EconomicCalendarView /> : <EarningsCalendarView />}
      </div>
    </div>
  );
}