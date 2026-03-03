'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { EconomicEvent } from '@/lib/types';
import { fetchEconomicCalendarBatch } from '@/app/actions/fetchEconomicCalendar';
import { toISODateString } from '@/lib/date-utils';
import { EventDetailModal } from './EventDetailModal';

export function NextHighImpactWidget() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(today.getDate() + 2);

      const dates = [
        toISODateString(today),
        toISODateString(tomorrow),
        toISODateString(dayAfter)
      ];

      const data = await fetchEconomicCalendarBatch(dates);
      const allEvents = Object.values(data).flat();
      
      const highImpact = allEvents
        .filter(e => e.impact === 'High')
        .sort((a, b) => {
          const dateA = new Date(`${a.date}T${a.time.includes(':') ? a.time : '00:00'}`);
          const dateB = new Date(`${b.date}T${b.time.includes(':') ? b.time : '00:00'}`);
          return dateA.getTime() - dateB.getTime();
        })
        .slice(0, 10);

      setEvents(highImpact);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="w-64 border-l border-border bg-surface flex flex-col shrink-0">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <AlertTriangle size={14} className="text-negative" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Next High Impact</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 size={16} className="animate-spin text-text-tertiary" /></div>
        ) : events.length === 0 ? (
          <div className="text-center p-8 text-[10px] text-text-tertiary italic">No high impact events in next 48h</div>
        ) : (
          events.map(event => (
            <div 
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="p-2 bg-background border border-border rounded-sm hover:border-accent/30 transition-colors cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-1.5">
                  <img 
                    src={`https://flagcdn.com/w20/${event.country.toLowerCase()}.png`}
                    className="w-3 h-2 object-cover rounded-[1px]"
                    alt=""
                  />
                  <span className="text-[9px] font-bold text-text-primary">{event.currency}</span>
                </div>
                <span className="text-[8px] font-mono text-text-tertiary">{event.date.slice(5)}</span>
              </div>
              <div className="text-[10px] font-medium text-text-secondary leading-tight line-clamp-2 group-hover:text-text-primary">
                {event.title}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[8px] text-text-tertiary">
                  <Clock size={8} />
                  <span>{event.time}</span>
                </div>
                <ChevronRight size={10} className="text-text-tertiary group-hover:text-accent" />
              </div>
            </div>
          ))
        )}
      </div>

      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}