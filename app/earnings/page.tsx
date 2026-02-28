'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, LayoutGrid, Calendar as CalendarIcon, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { fetchEarnings } from '@/app/actions/fetchEarnings';

export default function EarningsCalendar() {
  const [days, setDays] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEarnings() {
      setLoading(true);
      const today = new Date(currentDate);
      const currentDay = today.getDay(); // 0 is Sunday
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - currentDay + 1); // Start from Monday
      startOfWeek.setHours(0, 0, 0, 0);

      const weekDays = Array.from({ length: 5 }).map((_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return {
          name: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
          dateStr: `${year}-${month}-${day}`,
          events: [] as any[]
        };
      });

      // Fetch real earnings data for each day
      try {
        await Promise.all(weekDays.map(async (day) => {
          day.events = await fetchEarnings(day.dateStr);
        }));
      } catch (error) {
        console.error("Failed to load earnings", error);
      }

      setDays(weekDays);
      setLoading(false);
    }
    
    loadEarnings();
  }, [currentDate]);

  const changeWeek = (weeks: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + weeks * 7);
    setCurrentDate(newDate);
  };

  const isCurrentWeek = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const currentStartOfWeek = new Date(currentDate);
    const currentCurrentDay = currentStartOfWeek.getDay();
    currentStartOfWeek.setDate(currentStartOfWeek.getDate() - currentCurrentDay + 1);
    currentStartOfWeek.setHours(0, 0, 0, 0);

    return startOfWeek.getTime() === currentStartOfWeek.getTime();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-surface/30 to-background pointer-events-none" />
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-surface/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-xl border border-accent/20">
            <TrendingUp size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Earnings Calendar</h1>
            <p className="text-xs font-medium text-text-secondary">Track upcoming corporate earnings reports</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentDate(new Date())}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${isCurrentWeek() ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border/50 shadow-sm'}`}
          >
            This Week
          </button>
          
          <div className="flex items-center gap-1 bg-surface/50 border border-border/50 rounded-lg p-1 shadow-sm">
            <button onClick={() => changeWeek(-1)} className="p-1.5 hover:bg-background rounded-md transition-all text-text-secondary hover:text-text-primary hover:shadow-sm">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold px-3 text-text-primary">
              {days.length > 0 ? `${days[0].name.split(' ')[1]} - ${days[4].name.split(' ')[1]}` : ''}
            </span>
            <button onClick={() => changeWeek(1)} className="p-1.5 hover:bg-background rounded-md transition-all text-text-secondary hover:text-text-primary hover:shadow-sm">
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="flex items-center bg-surface/50 border border-border/50 rounded-lg p-1 shadow-sm">
            <button className="px-3 py-1.5 text-xs font-bold rounded-md bg-background text-text-primary flex items-center gap-2 shadow-sm border border-border/50">
              <LayoutGrid size={14} />
              Grid View
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative z-0 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin w-8 h-8 text-accent" />
          </div>
        ) : (
          <div className="min-w-[1000px] h-full flex flex-col bg-surface/30 rounded-2xl border border-border/50 shadow-sm overflow-hidden backdrop-blur-sm">
            {/* Header Row */}
            <div className="flex border-b border-border/50 sticky top-0 bg-surface/80 backdrop-blur-md z-20 shadow-sm">
              {days.map((day, i) => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${d}`;
                const isToday = day.dateStr === todayStr;
                
                return (
                  <div key={i} className={`flex-1 border-r last:border-r-0 border-border/50 p-4 text-center transition-colors ${isToday ? 'bg-accent/10 border-b-2 border-b-accent' : ''}`}>
                    <span className={`text-sm font-bold tracking-wider uppercase ${isToday ? 'text-accent' : 'text-text-secondary'}`}>
                      {day.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="flex-1 flex">
              {days.map((day, j) => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                const todayStr = `${year}-${month}-${d}`;
                const isToday = day.dateStr === todayStr;
                
                return (
                  <div key={j} className={`flex-1 border-r last:border-r-0 border-border/50 p-3 relative flex flex-col gap-3 ${isToday ? 'bg-accent/5' : ''}`}>
                    {day.events.length === 0 ? (
                      <div className="text-center text-xs text-text-secondary mt-4">No earnings scheduled</div>
                    ) : (
                      day.events.map((event: any, k: number) => (
                        <div key={k} className="flex flex-col p-4 rounded-xl bg-surface/60 border border-border/50 hover:bg-surface hover:border-border hover:shadow-md transition-all cursor-pointer group backdrop-blur-md shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-background to-surface border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:shadow-sm transition-all">
                                <span className="text-sm font-bold text-text-primary tracking-tighter">{event.ticker.substring(0, 3)}</span>
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <span className="text-base font-bold text-text-primary group-hover:text-accent transition-colors leading-none">{event.ticker}</span>
                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider truncate max-w-[80px]" title={event.name}>{event.name}</span>
                              </div>
                            </div>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${
                              event.impact === 5 ? 'bg-negative/10 text-negative border border-negative/20' :
                              event.impact === 4 ? 'bg-warning/10 text-warning border border-warning/20' :
                              'bg-positive/10 text-positive border border-positive/20'
                            }`}>
                              {event.impact}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-border/50">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-text-secondary">
                              <Clock size={12} className="text-accent" />
                              {event.time}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-bold">
                              <div className="flex flex-col items-end">
                                <span className="text-text-secondary/60 uppercase text-[9px]">Est</span>
                                <span className="text-text-secondary">{event.est}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-text-secondary/60 uppercase text-[9px]">Act</span>
                                <span className={event.act !== '-' ? (parseFloat(event.act) > parseFloat(event.est) ? 'text-positive' : 'text-negative') : 'text-text-primary'}>{event.act}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
