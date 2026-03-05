'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Search, Loader2, X
} from 'lucide-react';
import { fetchEarningsBatch } from '@/app/actions/fetchEarningsBatch';
import { searchSymbols } from '@/app/actions/searchSymbols';
import { fetchSingleCompanyEarnings } from '@/app/actions/fetchSingleCompanyEarnings';
import { EarningsEvent } from '@/lib/types';
import { getBusinessWeek, toISODateString, getMonday } from '@/lib/date-utils';
import { EarningsDetailModal } from './EarningsDetailModal';

export function EarningsCalendarView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<Record<string, EarningsEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EarningsEvent | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);
  const [targetEventId, setTargetEventId] = useState<string | null>(null);

  const weekDates = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7));
    return getBusinessWeek(today);
  }, [weekOffset]);

  // Live Autocomplete logic
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const res = await searchSymbols(q);
      setSearchResults(res);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSymbol = async (symbol: string) => {
    setIsGlobalSearching(true);
    setIsSearchOpen(false);
    setSearchQuery(symbol); // Lock the search input to the ticker so the filter isolates it

    try {
      const singleEvent = await fetchSingleCompanyEarnings(symbol);
      
      if (singleEvent && singleEvent.date !== 'TBD') {
        // Calculate how many weeks away this date is
        const today = new Date();
        const todayMonday = getMonday(today);
        todayMonday.setHours(0,0,0,0);
        
        const matchDate = new Date(singleEvent.date + 'T12:00:00');
        const matchMonday = getMonday(matchDate);
        matchMonday.setHours(0,0,0,0);
        
        const diffTime = matchMonday.getTime() - todayMonday.getTime();
        const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
        
        setWeekOffset(diffWeeks);

        // INJECT the event directly into the state so it is 100% guaranteed to render
        setEvents(prev => {
          const currentDayData = prev[singleEvent.date] ? [...prev[singleEvent.date]] : [];
          // Avoid duplicating if NASDAQ already found it
          if (!currentDayData.find(e => e.ticker === singleEvent.ticker)) {
            currentDayData.unshift(singleEvent);
          }
          return { ...prev, [singleEvent.date]: currentDayData };
        });

        // Trigger the highlight animation
        setTargetEventId(`event-${singleEvent.id}`);
      } else {
        alert(`The next earnings date for ${symbol} has not been officially confirmed yet.`);
      }
    } finally {
      setIsGlobalSearching(false);
    }
  };

  // Scroll to and highlight injected event
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

  // Load baseline NASDAQ data for the week
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchEarningsBatch(weekDates.map(d => d.dateStr));
      // Merge with any injected data we might already have to prevent overriding
      setEvents(prev => {
        const merged = { ...prev };
        Object.keys(data).forEach(date => {
          const injectedForDate = prev[date]?.filter(e => e.id.startsWith('single-yf-')) || [];
          // Keep injected events at the top, then append NASDAQ events
          merged[date] = [...injectedForDate, ...data[date].filter(e => !injectedForDate.find(inj => inj.ticker === e.ticker))];
        });
        return merged;
      });
      setLoading(false);
    };
    load();
  }, [weekDates]);

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchOpen(false);
  };

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
          
          {/* Intelligent Autocomplete Search Bar */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-background border border-border px-2 py-1.5 rounded-md focus-within:border-accent/50 transition-colors w-48 md:w-64">
              {isGlobalSearching ? <Loader2 size={14} className="text-accent animate-spin" /> : <Search size={14} className="text-text-tertiary" />}
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search company or ticker..."
                className="bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-tertiary flex-1 min-w-0"
              />
              {searchQuery && (
                <button onClick={handleClearSearch} className="p-0.5 hover:text-negative text-text-tertiary transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>

            {isSearchOpen && searchResults.length > 0 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-full bg-surface-highlight border border-border rounded shadow-2xl z-50 p-1 flex flex-col max-h-64 overflow-y-auto custom-scrollbar">
                  {searchResults.map(res => (
                    <button
                      key={res.symbol}
                      onClick={() => handleSelectSymbol(res.symbol)}
                      className="flex items-center justify-between p-2 hover:bg-surface text-left border-b border-border/50 last:border-0 rounded-sm transition-colors"
                    >
                      <div className="flex flex-col overflow-hidden pr-2">
                        <span className="text-xs font-bold text-text-primary">{res.symbol}</span>
                        <span className="text-[10px] text-text-tertiary truncate">{res.name}</span>
                      </div>
                      <span className="text-[9px] text-text-secondary bg-background px-1.5 py-0.5 rounded font-mono shrink-0">{res.type}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
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
            // Default view limits to top 15 companies by market cap
            dayEvents = dayEvents.slice(0, 15);
          }

          return (
            <div key={day.dateStr} className={`flex flex-col border border-border rounded-sm overflow-hidden ${isToday ? 'bg-surface-highlight/10' : 'bg-surface'}`}>
              <div className={`p-2 border-b border-border text-center shrink-0 ${isToday ? 'bg-accent/10 text-accent' : 'bg-surface-highlight text-text-secondary'}`}>
                <div className="text-[10px] uppercase font-bold tracking-wider">{day.dayName}</div>
                <div className="text-xs font-mono">{day.dateStr.slice(5)}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                 {loading && !searchQuery ? (
                    <div className="h-full flex items-center justify-center opacity-50"><Loader2 size={16} className="animate-spin text-text-tertiary" /></div>
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
                          {e.time === 'bmo' ? 'Pre' : e.time === 'amc' ? 'Post' : 'TBD'}
                        </span>
                      </div>
                      <div className="text-[10px] text-text-tertiary mb-2 truncate" title={e.name}>{e.name}</div>
                      
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