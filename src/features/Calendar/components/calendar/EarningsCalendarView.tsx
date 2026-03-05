'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Search, Loader2
} from 'lucide-react';
import { fetchEarningsBatch } from '@/app/actions/fetchEarningsBatch';
import { searchEarningsDate } from '@/app/actions/searchEarningsDate';
import { EarningsEvent } from '@/lib/types';
import { getBusinessWeek, toISODateString, getMonday } from '@/lib/date-utils';
import { EarningsDetailModal } from './EarningsDetailModal';

export function EarningsCalendarView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<Record<string, EarningsEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EarningsEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [targetTicker, setTargetTicker] = useState<string | null>(null);

  const weekDates = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7));
    return getBusinessWeek(today);
  }, [weekOffset]);

  const weekDatesRef = useRef(weekDates);
  const eventsDataRef = useRef(events);
  
  useEffect(() => { weekDatesRef.current = weekDates; }, [weekDates]);
  useEffect(() => { eventsDataRef.current = events; }, [events]);

  // Priority Matcher Logic
  const findBestMatch = (eventList: EarningsEvent[], query: string) => {
    const q = query.toLowerCase();
    const exactTicker = eventList.find(e => e.ticker.toLowerCase() === q);
    if (exactTicker) return exactTicker;
    
    const prefixTicker = eventList.find(e => e.ticker.toLowerCase().startsWith(q));
    if (prefixTicker) return prefixTicker;
    
    const exactNameWord = eventList.find(e => e.name.toLowerCase().split(/[\s-]/).includes(q));
    if (exactNameWord) return exactNameWord;
    
    return eventList.find(e => e.name.toLowerCase().includes(q));
  };

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query.length < 2) return;

    const timer = setTimeout(async () => {
      const currentEventsData = eventsDataRef.current;
      const currentWeekDates = weekDatesRef.current;

      // 1. Look in the currently rendered week first
      const currentWeekEvents = currentWeekDates.flatMap(d => currentEventsData[d.dateStr] || []);
      let match = findBestMatch(currentWeekEvents, query);
      
      if (match) {
        setTargetEventId(`event-${match.id}`);
        return;
      }

      // 2. If not found locally, query Yahoo Finance for the exact earnings date
      setIsGlobalSearching(true);
      try {
        const exactMatch = await searchEarningsDate(query);
        if (exactMatch) {
          const today = new Date();
          const todayMonday = getMonday(today);
          todayMonday.setHours(0,0,0,0);
          
          const matchDate = new Date(exactMatch.date + 'T12:00:00');
          const matchMonday = getMonday(matchDate);
          matchMonday.setHours(0,0,0,0);
          
          const diffTime = matchMonday.getTime() - todayMonday.getTime();
          const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
          
          setWeekOffset(diffWeeks);
          setTargetTicker(exactMatch.symbol); // Queue this ticker to be highlighted once data loads
        }
      } finally {
        setIsGlobalSearching(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Watch for new data arriving after a week jump to highlight the target ticker
  useEffect(() => {
    if (targetTicker && !loading) {
      const allLoaded = Object.values(events).flat();
      const match = allLoaded.find(e => e.ticker === targetTicker);
      if (match) {
        setTargetEventId(`event-${match.id}`);
        setTargetTicker(null); // Clear queue
      }
    }
  }, [events, loading, targetTicker]);

  useEffect(() => {
    if (targetEventId && !loading) {
      const t = setTimeout(() => {
        const el = document.getElementById(targetEventId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.transition = 'all 0.5s';
          el.style.backgroundColor = 'rgba(0, 255, 157, 0.2)';
          el.style.borderColor = 'var(--color-accent)';
          setTimeout(() => {
            el.style.backgroundColor = '';
            el.style.borderColor = '';
          }, 2000);
          setTargetEventId(null);
        }
      }, 300);
      return () => clearTimeout(t);
    }
  }, [targetEventId, loading, weekOffset]);

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
    <div className="flex flex-col h-full gap-2 relative">
      <div className="flex items-center justify-between bg-surface border border-border p-2 rounded-sm shrink-0">
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 hover:bg-surface-highlight rounded"><ChevronLeft size={16}/></button>
            <span className="font-mono font-bold w-32 text-center text-sm">
              {weekDates[0]?.dateStr} - {weekDates[4]?.dateStr.slice(5)}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 hover:bg-surface-highlight rounded"><ChevronRight size={16}/></button>
          </div>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-background border border-border px-2 py-1.5 rounded-md focus-within:border-accent/50 transition-colors">
              {isGlobalSearching ? <Loader2 size={14} className="text-accent animate-spin" /> : <Search size={14} className="text-text-tertiary" />}
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticker or name..."
                className="bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-tertiary w-32 md:w-48"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-5 gap-1 overflow-hidden min-h-0">
        {weekDates.map((day) => {
          const isToday = day.dateStr === toISODateString(new Date());
          let dayEvents = events[day.dateStr] || [];
          
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            dayEvents = dayEvents.filter(e => {
              const t = e.ticker.toLowerCase();
              const n = e.name.toLowerCase();
              return t === q || t.startsWith(q) || n.includes(q);
            });
          } else {
            // If not searching, limit to top 15 by market cap to keep UI clean and fast
            dayEvents = dayEvents.slice(0, 15);
          }

          return (
            <div key={day.dateStr} className={`flex flex-col border border-border rounded-sm overflow-hidden ${isToday ? 'bg-surface-highlight/10' : 'bg-surface'}`}>
              <div className={`p-2 border-b border-border text-center shrink-0 ${isToday ? 'bg-accent/10 text-accent' : 'bg-surface-highlight text-text-secondary'}`}>
                <div className="text-[10px] uppercase font-bold tracking-wider">{day.dayName}</div>
                <div className="text-xs font-mono">{day.dateStr.slice(5)}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                 {loading ? (
                    <div className="h-full flex items-center justify-center opacity-50">...</div>
                 ) : dayEvents.length === 0 ? (
                    <div className="text-center text-[10px] text-text-tertiary mt-4">No Earnings</div>
                 ) : dayEvents.map(e => (
                   <div
                     id={`event-${e.id}`}
                     key={e.id}
                     onClick={() => setSelectedEvent(e)}
                     className="p-2 bg-background border border-border rounded hover:border-accent/40 hover:bg-surface-highlight transition-all cursor-pointer group"
                   >
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-white flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                            <img 
                              src={`https://financialmodelingprep.com/image-stock/${e.ticker}.png`}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(el) => el.currentTarget.style.display = 'none'}
                            />
                          </div>
                          <span className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors">{e.ticker}</span>
                        </div>
                        <span className={`text-[9px] px-1 rounded uppercase font-bold ${e.time === 'bmo' ? 'bg-yellow-500/10 text-yellow-500' : e.time === 'amc' ? 'bg-blue-500/10 text-blue-500' : 'bg-surface-highlight text-text-secondary'}`}>
                          {e.time === 'bmo' ? 'Pre' : e.time === 'amc' ? 'Post' : '---'}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-tertiary mb-2 truncate">{e.name}</div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border pt-2">
                        <div>
                          <div className="text-text-tertiary uppercase text-[8px]">EPS Est</div>
                          <div className="font-mono">{e.epsEst !== null ? e.epsEst.toFixed(2) : '-'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-text-tertiary uppercase text-[8px]">Mkt Cap</div>
                          <div className="font-mono">{e.marketCap !== '-' ? e.marketCap : '-'}</div>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEvent && (
        <EarningsDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}