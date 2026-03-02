'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Filter, RefreshCw, 
  Download, Calendar as CalendarIcon, AlertTriangle 
} from 'lucide-react';
import { fetchEconomicCalendarBatch } from '@/app/actions/fetchEconomicCalendar';
import { EconomicEvent } from '@/lib/types';
import { getBusinessWeek, toISODateString } from '@/lib/date-utils';
import { Widget } from '@/components/Widget';

const IMPACT_COLORS = {
  High: 'text-negative bg-negative/10 border-negative/20',
  Medium: 'text-warning bg-warning/10 border-warning/20',
  Low: 'text-positive bg-positive/10 border-positive/20'
};

export default function EconomicCalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [events, setEvents] = useState<Record<string, EconomicEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [filterImpact, setFilterImpact] = useState<'All' | 'High' | 'Medium'>('All');
  const [filterCountry, setFilterCountry] = useState('All');

  const weekDates = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + (weekOffset * 7));
    return getBusinessWeek(today);
  }, [weekOffset]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchEconomicCalendarBatch(weekDates.map(d => d.dateStr));
      setEvents(data);
      setLoading(false);
    };
    load();
  }, [weekDates]);

  const filteredEvents = (dateStr: string) => {
    return (events[dateStr] || []).filter(e => {
      if (filterImpact !== 'All' && e.impact !== filterImpact) return false;
      if (filterCountry !== 'All' && e.country !== filterCountry) return false;
      return true;
    });
  };

  return (
    <div className="flex flex-col h-full bg-background p-2 gap-2">
      {/* Toolbar */}
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
          
          <div className="flex items-center gap-2 text-xs">
            <Filter size={14} className="text-text-tertiary" />
            <select 
              className="bg-background border border-border rounded px-2 py-1 outline-none"
              value={filterImpact}
              onChange={e => setFilterImpact(e.target.value as any)}
            >
              <option value="All">All Impact</option>
              <option value="High">High Impact</option>
              <option value="Medium">Medium Impact</option>
            </select>
            <select 
              className="bg-background border border-border rounded px-2 py-1 outline-none"
              value={filterCountry}
              onChange={e => setFilterCountry(e.target.value)}
            >
              <option value="All">All Countries</option>
              <option value="USA">USA</option>
              <option value="Euro Zone">Euro Zone</option>
              <option value="UK">UK</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded hover:bg-accent/20">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-5 gap-1 overflow-hidden">
        {weekDates.map((day) => {
          const isToday = day.dateStr === toISODateString(new Date());
          const dayEvents = filteredEvents(day.dateStr);

          return (
            <div key={day.dateStr} className={`flex flex-col border border-border rounded-sm overflow-hidden ${isToday ? 'bg-surface-highlight/10' : 'bg-surface'}`}>
              <div className={`p-2 border-b border-border text-center ${isToday ? 'bg-accent/10 text-accent' : 'bg-surface-highlight text-text-secondary'}`}>
                <div className="text-[10px] uppercase font-bold tracking-wider">{day.dayName}</div>
                <div className="text-xs font-mono">{day.dateStr.slice(5)}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1">
                {dayEvents.length === 0 ? (
                  <div className="text-center text-[10px] text-text-tertiary mt-10">No Events</div>
                ) : (
                  dayEvents.map(e => (
                    <div key={e.id} className="p-2 bg-background border border-border rounded hover:border-text-tertiary transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-[10px] text-text-secondary">{e.time}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold ${IMPACT_COLORS[e.impact]}`}>
                          {e.impact}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[9px] font-bold text-text-tertiary">{e.country}</span>
                        <h4 className="text-[11px] font-medium leading-tight text-text-primary line-clamp-2">{e.title}</h4>
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono border-t border-border pt-1.5">
                        <div>
                          <div className="text-text-tertiary text-[8px] uppercase">Act</div>
                          <div className={`font-bold ${e.surprise && e.surprise > 0 ? 'text-positive' : e.surprise && e.surprise < 0 ? 'text-negative' : 'text-text-primary'}`}>
                            {e.actual}
                          </div>
                        </div>
                        <div className="text-center border-x border-border">
                          <div className="text-text-tertiary text-[8px] uppercase">Fcst</div>
                          <div className="text-text-secondary">{e.forecast}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-text-tertiary text-[8px] uppercase">Surp</div>
                          <div className={`${!e.surprise ? 'text-text-tertiary' : e.surprise > 0 ? 'text-positive' : 'text-negative'}`}>
                            {e.surprise ? `${e.surprise > 0 ? '+' : ''}${e.surprise.toFixed(1)}%` : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}