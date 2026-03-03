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
      const datesToFetch = [];
      const now = new Date();

      // Fetch today + next 4 days to guarantee we hit weekdays and have data
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(now.getDate() + i);
        datesToFetch.push(toISODateString(d));
      }

      const data = await fetchEconomicCalendarBatch(datesToFetch);

      // Flatten and sort chronologically
      const allEvents = Object.values(data).flat().sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });

      const todayStr = toISODateString(now);

      const upcomingEvents = allEvents
        .filter(e => e.impact === 'High' || e.impact === 'Medium')
        .filter(e => {
          // Keep events from today that happened recently, or any future events
          if (e.date === todayStr && e.time !== 'All Day') {
             const eventHour = parseInt(e.time.split(':')[0]);
             const currentHour = now.getHours();
             return eventHour >= (currentHour - 2); // Show events from the last 2 hours
          }
          return true;
        })
        .slice(0, 5); // Grab the top 5 upcoming
        
      setEvents(upcomingEvents);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center opacity-50"><Loader2 className="animate-spin text-text-tertiary" size={14} /></div>;

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1 shrink-0">
        <div className="text-[8px] text-text-tertiary uppercase font-bold">Upcoming Macro</div>
        <Calendar size={10} className="text-text-tertiary" />
      </div>
      
      <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1">
        {events.map(e => (
          <div key={e.id} className={`p-1.5 border-l-2 bg-surface-highlight/30 text-[9px] ${e.impact === 'High' ? 'border-negative' : 'border-warning'}`}>
            <div className="flex justify-between items-start mb-0.5">
              <span className="font-bold text-text-primary line-clamp-1">{e.title}</span>
            </div>
            <div className="flex justify-between items-center text-text-tertiary font-mono">
              <span>{e.date.slice(5)} @ {e.time}</span>
              <span className="text-accent font-bold">{e.currency}</span>
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="text-[9px] text-text-tertiary italic p-2">No upcoming major events.</div>}
      </div>
    </div>
  );
}