'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Filter, DollarSign
} from 'lucide-react';
import { fetchEarningsBatch } from '@/app/actions/fetchEarningsBatch';
import { EarningsEvent } from '@/lib/types';
import { getBusinessWeek, toISODateString } from '@/lib/date-utils';

export default function EarningsCalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<Record<string, EarningsEvent[]>>({});
  const [loading, setLoading] = useState(true);

  const weekDates = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7));
    return getBusinessWeek(today);
  }, [weekOffset]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchEarningsBatch(weekDates.map(d => d.dateStr));
      setEvents(data);
      setLoading(false);
    };
    load();
  }, [weekDates]);

  return (
    <div className="flex flex-col h-full bg-background p-2 gap-2">
      <div className="flex items-center justify-between bg-surface border border-border p-2 rounded-sm">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 hover:bg-surface-highlight rounded"><ChevronLeft size={16}/></button>
            <span className="font-mono font-bold w-32 text-center text-sm">
              {weekDates[0]?.dateStr} - {weekDates[4]?.dateStr.slice(5)}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 hover:bg-surface-highlight rounded"><ChevronRight size={16}/></button>
          </div>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
             <span>Q3 2025 EARNINGS SEASON</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-5 gap-1 overflow-hidden">
        {weekDates.map((day) => {
          const isToday = day.dateStr === toISODateString(new Date());
          const dayEvents = events[day.dateStr] || [];

          return (
            <div key={day.dateStr} className={`flex flex-col border border-border rounded-sm overflow-hidden ${isToday ? 'bg-surface-highlight/10' : 'bg-surface'}`}>
              <div className={`p-2 border-b border-border text-center ${isToday ? 'bg-accent/10 text-accent' : 'bg-surface-highlight text-text-secondary'}`}>
                <div className="text-[10px] uppercase font-bold tracking-wider">{day.dayName}</div>
                <div className="text-xs font-mono">{day.dateStr.slice(5)}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                 {dayEvents.map(e => (
                   <div key={e.id} className="p-2 bg-background border border-border rounded hover:border-accent/40 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-text-primary">{e.ticker}</span>
                        <span className={`text-[9px] px-1 rounded uppercase font-bold ${e.time === 'bmo' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {e.time === 'bmo' ? 'SUN' : 'MOON'}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-tertiary mb-2 truncate">{e.name}</div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border pt-2">
                        <div>
                          <div className="text-text-tertiary uppercase text-[8px]">EPS Est</div>
                          <div className="font-mono">{e.epsEst}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-text-tertiary uppercase text-[8px]">Rev Est</div>
                          <div className="font-mono">{e.revEst}B</div>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}