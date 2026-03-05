'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, Download, Filter
} from 'lucide-react';
import { fetchEconomicCalendarBatch } from '@/app/actions/fetchEconomicCalendar';
import { EconomicEvent } from '@/lib/types';
import { getFullWeek, toISODateString } from '@/lib/date-utils';
import { EventDetailModal } from './EventDetailModal';
import { computeSurprise, getEventIntel } from '@/lib/event-intelligence';
import { makeEconomicEventId } from '@/lib/event-id';
import { useSettings } from '@/services/context/SettingsContext';

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const { settings, setImpactFilter } = useSettings();
  
  const [weekOffset, setWeekOffset] = useState(0);
  const [eventsData, setEventsData] = useState<Record<string, EconomicEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EconomicEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const weekDates = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7));
    return getFullWeek(today);
  }, [weekOffset]);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId && !loading) {
      const allEvents = Object.values(eventsData).flat();
      const found = allEvents.find(e => makeEconomicEventId(e) === eventId);
      if (found) setSelectedEvent(found);
    }
  }, [searchParams, eventsData, loading]);

  const handleEventClick = (event: EconomicEvent) => {
    const id = makeEconomicEventId(event);
    const params = new URLSearchParams(searchParams.toString());
    params.set('event', id);
    router.push(`?${params.toString()}`, { scroll: false });
    setSelectedEvent(event);
  };

  const handleCloseModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('event');
    router.push(`?${params.toString()}`, { scroll: false });
    setSelectedEvent(null);
  };

  const schedule = useMemo(() => {
    const grid: Record<string, Record<string, EconomicEvent[]>> = {};
    
    const impactValues = { High: 3, Medium: 2, Low: 1, All: 0 };
    const requiredImpact = impactValues[settings.impactFilter] || 0;

    weekDates.forEach(day => {
      grid[day.dateStr] = {};
      HOURS.forEach(h => grid[day.dateStr][h] = []);
      
      const dayEvents = eventsData[day.dateStr] || [];
      dayEvents.forEach(e => {
        // 1. Apply Global Currency Filter
        if (settings.currency !== 'All' && e.currency !== settings.currency) return;
        
        // 2. Apply Global Impact Filter
        const eventImpactVal = impactValues[e.impact] || 1;
        if (eventImpactVal < requiredImpact) return;

        // 3. Apply Search Query
        if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return;
        
        let hourKey = '00:00';
        if (e.time.includes(':')) {
           const parts = e.time.split(':');
           const h = parseInt(parts[0]);
           if (!isNaN(h)) hourKey = `${parts[0].padStart(2, '0')}:00`;
        }
        if (!grid[day.dateStr][hourKey]) grid[day.dateStr][hourKey] = [];
        grid[day.dateStr][hourKey].push(e);
      });
    });
    return grid;
  }, [eventsData, weekDates, settings.impactFilter, settings.currency]);

  // Adaptive threshold multiplier based on risk tolerance
  const thresholdMultiplier = settings.riskTolerance === 'Conservative' ? 1.5 : settings.riskTolerance === 'Aggressive' ? 0.5 : 1.0;

  const currentHourStr = currentTime ? `${currentTime.getHours().toString().padStart(2, '0')}:00` : null;
  const currentMinute = currentTime ? currentTime.getMinutes() : 0;

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex flex-wrap items-center justify-between p-3 border-b border-border bg-surface shrink-0 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-surface-highlight rounded-lg p-0.5 border border-border">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-surface rounded-md text-text-secondary hover:text-text-primary"><ChevronLeft size={16}/></button>
            <span className="px-3 font-mono font-bold text-sm min-w-[140px] text-center">
              {weekDates[0]?.dateStr} - {weekDates[6]?.dateStr.slice(5)}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-surface rounded-md text-text-secondary hover:text-text-primary"><ChevronRight size={16}/></button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-background border border-border px-2 py-1.5 rounded-md focus-within:border-accent/50 transition-colors">
              <Search size={14} className="text-text-tertiary" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                className="bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-tertiary w-24 md:w-40"
              />
            </div>
            <button
              onClick={() => setImpactFilter(settings.impactFilter === 'All' ? 'Medium' : 'All')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors flex items-center gap-1 ${settings.impactFilter !== 'All' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-transparent border-transparent text-text-tertiary hover:text-text-secondary'}`}
            >
              <Filter size={12} />
              {settings.impactFilter !== 'All' ? `Min Impact: ${settings.impactFilter}` : 'Filter Events'}
            </button>
            {settings.currency !== 'All' && (
              <span className="px-2 py-1 bg-surface-highlight border border-border rounded text-[10px] font-bold text-text-primary">
                {settings.currency} Only
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={() => {/* CSV logic */}}
          className="p-2 text-text-tertiary hover:text-text-primary transition-colors"
          title="Export to CSV"
        >
          <Download size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar bg-background relative">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border sticky top-0 bg-surface/95 backdrop-blur z-20">
            <div className="p-2 border-r border-border text-[10px] text-text-tertiary font-bold flex items-end justify-center">TIME</div>
            {weekDates.map(day => {
               const isToday = currentTime ? day.dateStr === toISODateString(currentTime) : false;
               return (
                 <div key={day.dateStr} className={`p-2 border-r border-border text-center ${isToday ? 'bg-accent/5 border-b-2 border-b-accent' : ''}`}>
                   <div className={`text-[10px] uppercase font-bold mb-1 ${isToday ? 'text-accent' : 'text-text-tertiary'}`}>{day.dayName}</div>
                   <div className={`text-sm font-bold ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>{day.dayNum}</div>
                 </div>
               );
            })}
          </div>

          <div className="divide-y divide-border">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[80px]">
                <div className="border-r border-border p-2 text-[10px] font-bold text-text-tertiary text-center sticky left-0 bg-background z-10">
                  <span className="-mt-3 block bg-background px-1">{formatHourLabel(hour)}</span>
                </div>

                {weekDates.map(day => {
                  const dayEvents = schedule[day.dateStr]?.[hour] || [];
                  const isToday = currentTime ? day.dateStr === toISODateString(currentTime) : false;
                  const isThisHour = hour === currentHourStr;
                  
                  return (
                    <div key={`${day.dateStr}-${hour}`} className={`border-r border-border p-1 relative group ${isToday ? 'bg-accent/[0.02]' : ''}`}>
                      {isToday && isThisHour && (
                        <div 
                          className="absolute left-0 right-0 flex items-center z-30 pointer-events-none"
                          style={{ top: `${(currentMinute / 60) * 100}%`, transform: 'translateY(-50%)' }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                          <div className="h-[1px] flex-1 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 h-full relative z-10">
                        {dayEvents.map((event) => {
                          const surprise = computeSurprise(event);
                          const intel = getEventIntel(event);
                          // Adaptive surprise check based on user Risk Tolerance
                          const isMajorSurprise = surprise.surprisePct && Math.abs(surprise.surprisePct) >= (intel.surpriseThresholdPct * thresholdMultiplier);

                          return (
                            <div 
                              key={event.id}
                              onClick={() => handleEventClick(event)}
                              className={`
                                relative p-1.5 rounded bg-surface border border-border/50 shadow-sm hover:border-accent/50 hover:bg-surface-highlight transition-all cursor-pointer
                                ${IMPACT_COLORS[event.impact] || IMPACT_COLORS.Low}
                                ${isMajorSurprise ? 'ring-1 ring-accent ring-offset-1 ring-offset-background' : ''}
                              `}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5">
                                  {event.country && (
                                    <img 
                                      src={`https://flagcdn.com/w20/${event.country.toLowerCase()}.png`}
                                      className="w-3 h-2 object-cover rounded-[1px] opacity-80"
                                      alt=""
                                    />
                                  )}
                                  <span className="text-[9px] font-mono text-text-secondary leading-none">{event.time}</span>
                                </div>
                                {isMajorSurprise && <span className="text-[8px] font-bold text-accent animate-pulse">SURPRISE</span>}
                              </div>
                              <div className="text-[10px] font-medium leading-tight text-text-primary line-clamp-2 mb-1">{event.title}</div>
                              {(event.actual || event.forecast) && (
                                <div className="flex items-center gap-2 text-[9px] font-mono border-t border-black/10 pt-1 mt-1 opacity-80">
                                  {event.actual && (
                                    <span className={surprise.classification === 'HOT' ? 'text-negative' : surprise.classification === 'COOL' ? 'text-positive' : 'text-text-secondary'}>
                                      {event.actual}
                                    </span>
                                  )}
                                  {event.forecast && <span className="text-text-tertiary">/ {event.forecast}</span>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={handleCloseModal} />}
    </div>
  );
}