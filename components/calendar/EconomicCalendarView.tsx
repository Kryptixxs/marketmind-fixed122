'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Download, Loader2
} from 'lucide-react';
import { fetchEconomicCalendarBatch } from '@/app/actions/fetchEconomicCalendar';
import { EconomicEvent } from '@/lib/types';
import { getFullWeek, toISODateString } from '@/lib/date-utils';
import { EventDetailModal } from './EventDetailModal';
import { exportToCSV } from '@/lib/utils';
import { formatMaybeNumber } from '@/lib/format';

const IMPACT_COLORS: Record<string, string> = {
  High: 'border-l-4 border-l-red-500 bg-red-500/10',
  Medium: 'border-l-4 border-l-orange-500 bg-orange-500/10',
  Low: 'border-l-4 border-l-green-500 bg-green-500/10'
};

const HOURS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', 
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

function formatHourLabel(h: string) {
  const hour = parseInt(h.split(':')[0]);
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
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
      const data = await fetchEconomicCalendarBatch(datesToFetch);
      setEventsData(data);
      setLoading(false);
    };
    load();
  }, [weekDates]);

  const handleDownload = () => {
    const allEvents = Object.values(eventsData).flat();
    if (allEvents.length > 0) {
      exportToCSV(allEvents, `economic_calendar_${weekDates[0].dateStr}`);
    }
  };

  const schedule = useMemo(() => {
    const grid: Record<string, Record<string, EconomicEvent[]>> = {};

    weekDates.forEach(day => {
      grid[day.dateStr] = {};
      HOURS.forEach(h => grid[day.dateStr][h] = []);
      
      const dayEvents = eventsData[day.dateStr] || [];
      dayEvents.forEach(e => {
        if (!showLowImpact && e.impact === 'Low') return;
        
        let hourKey = '00:00';
        if (e.time !== 'All Day' && e.time !== 'TBD' && e.time.includes(':')) {
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
    <div className="flex flex-col h-full bg-background">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-surface-highlight rounded-lg p-0.5 border border-border">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-surface rounded-md text-text-secondary hover:text-text-primary"><ChevronLeft size={16}/></button>
            <span className="px-3 font-mono font-bold text-sm min-w-[140px] text-center">
              {weekDates[0]?.dateStr} - {weekDates[6]?.dateStr.slice(5)}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-surface rounded-md text-text-secondary hover:text-text-primary"><ChevronRight size={16}/></button>
          </div>
          
          <button 
            onClick={() => setShowLowImpact(!showLowImpact)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${showLowImpact ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface-highlight border-border text-text-tertiary hover:text-text-secondary'}`}
          >
            {showLowImpact ? 'Hiding Low Impact' : 'Show All'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {loading && <Loader2 size={14} className="animate-spin text-accent" />}
          <button 
            onClick={handleDownload}
            className="p-2 text-text-tertiary hover:text-text-primary"
            title="Export Week to CSV"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar bg-background relative">
        <div className="min-w-[1000px]">
          
          {/* Header Row (Days) */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-surface/95 backdrop-blur z-20">
            <div className="p-2 border-r border-border text-[10px] text-text-tertiary font-bold flex items-end justify-center">
              TIME
            </div>
            {weekDates.map(day => {
               const isToday = day.dateStr === toISODateString(new Date());
               return (
                 <div key={day.dateStr} className={`p-2 border-r border-border text-center ${isToday ? 'bg-accent/5' : ''}`}>
                   <div className={`text-[10px] uppercase font-bold mb-1 ${isToday ? 'text-accent' : 'text-text-tertiary'}`}>
                     {day.dayName}
                   </div>
                   <div className={`text-sm font-bold ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                     {day.dayNum}
                   </div>
                 </div>
               );
            })}
          </div>

          {/* Body Rows (Hours) */}
          <div className="divide-y divide-border">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[80px]">
                <div className="border-r border-border p-2 text-[10px] font-bold text-text-tertiary text-center sticky left-0 bg-background z-10">
                  <span className="-mt-3 block bg-background px-1">{formatHourLabel(hour)}</span>
                </div>

                {weekDates.map(day => {
                  const dayEvents = schedule[day.dateStr]?.[hour] || [];
                  const isToday = day.dateStr === toISODateString(new Date());
                  
                  return (
                    <div key={`${day.dateStr}-${hour}`} className={`border-r border-border p-1 relative group ${isToday ? 'bg-accent/[0.02]' : ''}`}>
                      <div className="flex flex-col gap-1.5 h-full">
                        {dayEvents.map((event) => (
                          <div 
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className={`
                              relative p-1.5 rounded bg-surface border border-border/50 shadow-sm hover:border-accent/50 hover:bg-surface-highlight transition-all cursor-pointer
                              ${IMPACT_COLORS[event.impact] || IMPACT_COLORS.Low}
                            `}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5">
                                {event.country && (
                                  <img 
                                    src={`https://flagcdn.com/w20/${event.country.toLowerCase()}.png`}
                                    alt={event.country}
                                    className="w-3 h-2 object-cover rounded-[1px] opacity-80"
                                    onError={(e) => e.currentTarget.style.display = 'none'}
                                  />
                                )}
                                <span className="text-[9px] font-mono text-text-secondary leading-none">
                                  {event.time}
                                </span>
                              </div>
                              <span className="text-[8px] font-bold text-text-tertiary">{event.currency}</span>
                            </div>
                            
                            <div className="text-[10px] font-medium leading-tight text-text-primary line-clamp-2 mb-1">
                              {event.title}
                            </div>

                            {(event.actual || event.forecast) && (
                              <div className="flex items-center gap-2 text-[9px] font-mono border-t border-black/10 pt-1 mt-1 opacity-80">
                                {event.actual && (
                                  <span className="text-text-primary font-bold">
                                    {formatMaybeNumber(event.actual)}
                                  </span>
                                )}
                                {event.forecast && (
                                  <span className="text-text-tertiary">/ {formatMaybeNumber(event.forecast)}</span>
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