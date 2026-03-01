'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, DollarSign, Brain, Loader2, X } from 'lucide-react';
import { fetchEarningsBatch, type EarningEvent } from '@/app/actions/fetchEarningsBatch';
import { getBusinessWeek, toISODateString, formatTime } from '@/lib/date-utils';

export default function EarningsCalendarPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<{ date: Date; dateStr: string; dayName: string }[]>([]);
  const [eventsData, setEventsData] = useState<Record<string, EarningEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EarningEvent | null>(null);

  // Calculate dates
  useEffect(() => {
    const today = new Date();
    const referenceDate = new Date(today);
    referenceDate.setDate(today.getDate() + (weekOffset * 7));
    setWeekDates(getBusinessWeek(referenceDate));
  }, [weekOffset]);

  // Fetch data
  useEffect(() => {
    if (weekDates.length === 0) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchEarningsBatch(weekDates.map(d => d.dateStr));
        setEventsData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [weekDates]);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-background">
      {/* --- Header --- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-accent/10 border border-accent/20 rounded-md">
            <DollarSign size={16} className="text-accent" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-text-primary uppercase">Corporate Earnings</h1>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-warning bg-warning/10 border border-warning/20 rounded-sm">Q1 2026</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-background border border-border rounded-md overflow-hidden mr-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 hover:bg-surface-hover text-text-secondary transition-colors border-r border-border">
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-xs font-mono font-medium text-text-primary min-w-[100px] text-center">
              {weekOffset === 0 ? 'Current Week' : `Week ${weekOffset > 0 ? '+' : ''}${weekOffset}`}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 hover:bg-surface-hover text-text-secondary transition-colors border-l border-border">
              <ChevronRight size={14} />
            </button>
          </div>
          <button onClick={() => setLoading(true)} className="p-1.5 text-text-secondary hover:text-accent hover:bg-surface-hover rounded-md transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* --- Main Grid --- */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-b from-surface/5 to-transparent z-0 pointer-events-none" />
        
        <div className="flex-1 overflow-auto custom-scrollbar relative z-10 p-4">
          <div className="min-w-[1200px] h-full flex flex-col bg-surface/30 border border-border rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
            {/* Day Headers */}
            <div className="flex border-b border-border bg-surface/90 sticky top-0 z-20 backdrop-blur-md">
              {weekDates.map((day, i) => {
                const isToday = day.dateStr === toISODateString(new Date());
                return (
                  <div key={i} className={`flex-1 p-3 text-center border-r border-border last:border-r-0 ${isToday ? 'bg-accent/5' : ''}`}>
                    <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isToday ? 'text-accent' : 'text-text-secondary'}`}>
                      {day.dayName}
                    </div>
                    <div className={`text-sm font-mono font-bold ${isToday ? 'text-text-primary' : 'text-text-secondary'}`}>
                       {day.date.getDate()} {day.date.toLocaleString('default', { month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Events Columns */}
            <div className="flex flex-1 divide-x divide-border bg-background/40">
              {weekDates.map((day, i) => {
                const events = eventsData[day.dateStr] || [];
                const isToday = day.dateStr === toISODateString(new Date());

                return (
                  <div key={i} className={`flex-1 flex flex-col relative min-h-[400px] ${isToday ? 'bg-accent/[0.02]' : ''}`}>
                    {loading ? (
                      <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
                      </div>
                    ) : events.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-xs text-text-tertiary italic">No Reports</div>
                    ) : (
                      <div className="flex flex-col p-2 gap-2 pb-20">
                        {events.map((e, idx) => (
                          <div 
                            key={idx}
                            onClick={() => setSelectedEvent(e)}
                            className="group flex flex-col p-2.5 rounded-lg border border-border bg-surface hover:border-accent/40 hover:bg-surface-hover hover:shadow-lg transition-all cursor-pointer relative"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-text-primary">{e.ticker}</span>
                                  <span className="text-[9px] px-1 rounded bg-background border border-border text-text-tertiary">{formatTime(e.time)}</span>
                                </div>
                                <div className="text-[10px] text-text-secondary truncate max-w-[120px]">{e.name}</div>
                              </div>
                              <div className="text-[9px] font-bold text-accent uppercase opacity-50 group-hover:opacity-100">Q{Math.ceil((new Date().getMonth() + 1)/3)}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40">
                              <div>
                                <div className="text-[9px] text-text-tertiary uppercase mb-0.5">EPS Est</div>
                                <div className="text-xs font-mono font-bold text-text-primary">{e.est}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[9px] text-text-tertiary uppercase mb-0.5">EPS Act</div>
                                <div className={`text-xs font-mono font-bold ${
                                  e.act === '-' ? 'text-text-secondary' : 
                                  parseFloat(e.act) > parseFloat(e.est) ? 'text-positive' : 'text-negative'
                                }`}>
                                  {e.act}
                                </div>
                              </div>
                            </div>
                            
                            {/* Hover Action */}
                            <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-md">
                                <Brain size={10} className="text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        {selectedEvent && (
          <div className="w-80 border-l border-border bg-surface/95 backdrop-blur-xl absolute right-0 top-0 bottom-0 shadow-2xl animate-in slide-in-from-right z-30 flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-text-primary">{selectedEvent.name}</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-text-tertiary hover:text-text-primary"><X size={16}/></button>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center justify-center h-20 bg-background border border-border rounded-xl">
                 <span className="text-3xl font-bold text-text-primary">{selectedEvent.ticker}</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-sm text-text-secondary">EPS Estimate</span>
                  <span className="font-mono font-bold">{selectedEvent.est}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-sm text-text-secondary">Revenue Est</span>
                  <span className="font-mono font-bold">{selectedEvent.revenue_est}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                   <span className="text-sm text-text-secondary">Implied Move</span>
                   <span className="font-mono font-bold text-warning">±4.5%</span>
                </div>
              </div>

              <div className="bg-accent/10 border border-accent/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-accent"/>
                  <span className="text-xs font-bold uppercase text-accent">AI Insight</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Based on recent volatility, {selectedEvent.ticker} tends to beat revenue expectations but guide conservatively. 
                  Options markets are pricing in a moderate move.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}