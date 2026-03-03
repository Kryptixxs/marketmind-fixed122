'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { fetchEconomicCalendarBatch } from '@/app/actions/fetchEconomicCalendar';
import { EconomicEvent } from '@/lib/types';
import { toISODateString } from '@/lib/date-utils';

export function MiniCalendar() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const data = await fetchEconomicCalendarBatch([toISODateString(today), toISODateString(tomorrow)]);
      const allEvents = Object.values(data).flat();
      
      // Filter for medium/high impact, sort by time
      const majorEvents = allEvents
        .filter(e => e.impact === 'High' || e.impact === 'Medium')
        .slice(0, 4); // Take next 4
        
      setEvents(majorEvents);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center opacity-50"><Loader2 className="animate-spin text-text-tertiary" size={14} /></div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[8px] text-text-tertiary uppercase font-bold">Upcoming Macro</div>
        <Calendar size={10} className="text-text-tertiary" />
      </div>
      
      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
        {events.map(e => (
          <div key={e.id} className={`p-1.5 border-l-2 bg-surface-highlight/30 text-[9px] ${e.impact === 'High' ? 'border-negative' : 'border-warning'}`}>
            <div className="flex justify-between items-start mb-0.5">
              <span className="font-bold text-text-primary line-clamp-1">{e.title}</span>
            </div>
            <div className="flex justify-between items-center text-text-tertiary font-mono">
              <span>{e.date} {e.time}</span>
              <span className="text-accent">{e.currency}</span>
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="text-[9px] text-text-tertiary italic p-2">No major events today.</div>}
      </div>
    </div>
  );
}