'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Filter, Download
} from 'lucide-react';
import { fetchEconomicCalendarBatch } from '@/app/actions/fetchEconomicCalendar';
import { EconomicEvent } from '@/lib/types';
import { getFullWeek, toISODateString } from '@/lib/date-utils';
import { EventDetailModal } from './EventDetailModal';

const IMPACT_COLORS: Record<string, string> = {
  High: 'border-l-2 border-l-negative bg-negative/5',
  Medium: 'border-l-2 border-l-warning bg-warning/5',
  Low: 'border-l-2 border-l-positive bg-positive/5'
};

const HOURS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00',
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

function formatHourLabel(h: string) {
  const hour = parseInt(h.split(':')[0]);
  if (hour === 0) return '00:00';
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function EconomicCalendarView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [eventsData, setEventsData] = useState<Record<string, EconomicEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [showLowImpact, setShowLowImpact] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null);

  const weekDates = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7));
    return getFullWeek(today);
  }, [weekOffset]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const datesToFetch = weekDates.map(d => d.dateStr);
      
      const lastDay = new Date(weekDates[6].date);
      lastDay.setDate(lastDay.getDate() + 1);
      datesToFetch.push(toISODateString(lastDay));

      const data = await fetchEconomicCalendarBatch(datesToFetch);
      setEventsData(data);
      setLoading(false);
    };
    load();
  }, [weekDates]);

  const schedule = useMemo(() => {
    const grid: Record<string, Record<string, EconomicEvent[]>> = {};

    weekDates.forEach(day => {
      grid[day.dateStr] = {};
      HOURS.forEach(h => grid[day.dateStr][h] = []);
      
      const dayEvents = eventsData[day.dateStr] || [];
      dayEvents.forEach(e => {
        if (!showLowImpact && e.impact === 'Low') return;
        
        let hourKey = '00:00';
        if (e.time.includes(':')) {
           const parts = e.time.split(':');
           const h = parseInt(parts[0]);
           if (!isNaN(h)) {
             hourKey = `${parts[0].padStart(2, '0')}:00`;
           }
        }
        if (!grid[day.dateStr][hourKey]) grid[day.dateStr][hourKey] = [];
        grid[day.dateStr][hourKey].push(e);
      });
    });
    return grid;
  }, [eventsData, weekDates, showLowImpact]);

  return (
    <div className="flex flex-col h-full bg-background border border-border">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-surface-highlight rounded-sm p-0.5 border border-border">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 hover:bg-surface rounded-sm text-text-secondary hover:text-text-primary"><ChevronLeft size={14}/></button>
            <span className="px-2 font-mono font-bold text-[10px] min-w-[120px] text-center uppercase">
              {weekDates[0]?.dateStr} // {weekDates[6]?.dateStr.slice(5)}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 hover:bg-surface rounded-sm text-text-secondary hover:text-text-primary"><ChevronRight size={14}/></button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLowImpact(!showLowImpact)}
              className={`px-2 py-1 rounded-sm text-[9px] font-bold border transition-colors uppercase ${showLowImpact ? 'bg-surface-highlight border-border text-text-primary' : 'bg-transparent border-transparent text-text-tertiary hover:text-text-secondary'}`}
            >
              {showLowImpact ? 'Hiding Low Impact' : 'Show All'}
            </button>
            <span className="text-[9px] bg-surface-highlight px-2 py-0.5 rounded-sm text-text-secondary border border-border flex items-center gap-1 font-mono">
              <span className="w-1 h-1 rounded-full bg-positive animate-pulse"></span>
              EST_FEED_ACTIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-text-tertiary uppercase">Terminal v4.0.2</span>
          <button className="p-1 text-text-tertiary hover:text-text-primary">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-background relative">
        <div className="min-w-[1200px]">
          
          {/* Header Row (Days) */}
          <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-border sticky top-0 bg-surface/95 backdrop-blur z-20">
            <div className="p-2 border-r border-border text-[9px] text-text-tertiary font-bold flex items-end justify-center uppercase">
              TIME
            </div>
            {weekDates.map(day => {
               const isToday = day.dateStr === toISODateString(new Date());
               return (
                 <div key={day.dateStr} className={`p-2 border-r border-border text-center ${isToday ? 'bg-accent/5' : ''}`}>
                   <div className={`text-[9px] uppercase font-bold mb-0.5 ${isToday ? 'text-accent' : 'text-text-tertiary'}`}>
                     {day.dayName}
                   </div>
                   <div className={`text-xs font-mono font-bold ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                     {day.dayNum}
                   </div>
                 </div>
               );
            })}
          </div>

          {/* Body Rows (Hours) */}
          <div className="divide-y divide-border/50">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[50px_repeat(7,1fr)] min-h-[60px]">
                <div className="border-r border-border p-1 text-[9px] font-mono font-bold text-text-tertiary text-center sticky left-0 bg-background z-10">
                  <span className="block bg-background px-1">{formatHourLabel(hour)}</span>
                </div>

                {weekDates.map(day => {
                  const dayEvents = schedule[day.dateStr]?.[hour] || [];
                  const isToday = day.dateStr === toISODateString(new Date());
                  
                  return (
                    <div key={`${day.dateStr}-${hour}`} className={`border-r border-border/50 p-0.5 relative group ${isToday ? 'bg-accent/[0.01]' : ''}`}>
                      <div className="flex flex-col gap-0.5 h-full">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`
                              relative p-1 rounded-sm bg-surface border border-border/30 shadow-sm hover:border-accent/50 hover:bg-surface-highlight transition-all cursor-pointer
                              ${IMPACT_COLORS[event.impact] || IMPACT_COLORS.Low}
                            `}
                          >
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <div className="flex items-center gap-1">
                                {event.country && (
                                  <img
                                    src={`https://flagcdn.com/w20/${event.country.toLowerCase()}.png`}
                                    alt={event.country}
                                    className="w-2.5 h-1.5 object-cover rounded-[1px] opacity-60"
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                  />
                                )}
                                <span className="text-[8px] font-mono text-text-tertiary leading-none">
                                  {event.time}
                                </span>
                              </div>
                              <span className={`text-[7px] font-bold uppercase px-1 rounded-[1px] ${
                                event.impact === 'High' ? 'text-negative' :
                                event.impact === 'Medium' ? 'text-warning' : 'text-positive'
                              }`}>
                                {event.impact.slice(0, 1)}
                              </span>
                            </div>
                            
                            <div className="text-[9px] font-bold leading-tight text-text-primary line-clamp-1 mb-0.5 uppercase tracking-tighter">
                              {event.title}
                            </div>

                            {(event.actual || event.forecast) && (
                              <div className="flex items-center gap-1.5 text-[8px] font-mono border-t border-border/20 pt-0.5 mt-0.5">
                                {event.actual && (
                                  <span className={
                                    event.forecast && parseFloat(event.actual) > parseFloat(event.forecast) ? 'text-positive' :
                                    event.forecast && parseFloat(event.actual) < parseFloat(event.forecast) ? 'text-negative' : 'text-text-secondary'
                                  }>
                                    {event.actual}
                                  </span>
                                )}
                                {event.forecast && (
                                  <span className="text-text-tertiary">/ {event.forecast}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

      {/* Detail Modal */}
      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}