'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings, LayoutGrid, Brain, Loader2, X } from 'lucide-react';
import { analyzeEconomicEvent } from '@/lib/analyzeEvent';
import { fetchEconomicCalendarForWeek, isEconomicCalendarConfigured } from '@/app/actions/fetchEconomicCalendar';
import { SettingsModal } from '@/components/SettingsModal';
import { useSettings } from '@/context/SettingsContext';
import { eventMatchesCurrency } from '@/lib/economicCalendar';

type EventAnalysis = {
  impactRating: number;
  impactedAssets: string[];
  sentiment: string;
  analysis: string;
};

type EventItem = {
  time: string;
  title: string;
  impact: string;
  country: string;
  analysis?: EventAnalysis;
  isLoading?: boolean;
};

type DayData = {
  name: string;
  dateStr: string;
  events: EventItem[];
};

function filterBySettings(
  events: { impact: string; currency: string; country: string }[],
  impactFilter: string,
  currency: string
) {
  if (impactFilter === 'All' && (currency === 'All' || !currency)) return events;
  return events.filter((e) => {
    const impactOk = impactFilter === 'All' || impactFilter === e.impact;
    const currencyOk = eventMatchesCurrency(e, currency);
    return impactOk && currencyOk;
  });
}

export default function EconomicCalendar() {
  const { settings } = useSettings();
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<{ dayIndex: number, eventIndex: number } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  const hours = Array.from({ length: 24 }).map((_, i) => {
    const ampm = i >= 12 ? 'PM' : 'AM';
    const hour = i % 12 === 0 ? 12 : i % 12;
    return `${hour} ${ampm}`;
  });

  useEffect(() => {
    async function loadCalendar() {
      setLoading(true);
      try {
        const data = await fetchEconomicCalendarForWeek(weekOffset);

        if (!data || !Array.isArray(data)) {
          setDays([]);
          setLoading(false);
          return;
        }
        const filtered = filterBySettings(data, settings.impactFilter, settings.currency);
        const today = new Date();
        const currentDay = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDay + weekOffset * 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const weekDays = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          return {
            name: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
            year: d.getFullYear(),
            month: d.getMonth(),
            date: d.getDate(),
            events: [] as EventItem[]
          };
        });

        filtered.forEach((item: any) => {
          if (!item.date) return;
          const date = new Date(item.date);
          const itemYear = date.getFullYear();
          const itemMonth = date.getMonth();
          const itemDate = date.getDate();
          const dayIndex = weekDays.findIndex(d =>
            d.year === itemYear && d.month === itemMonth && d.date === itemDate
          );
          if (dayIndex !== -1) {
            weekDays[dayIndex].events.push({
              time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              title: item.title,
              impact: item.impact,
              country: item.country
            });
          }
        });

        setDays(weekDays as any);

        // Scroll to current hour after a short delay to allow rendering
        setTimeout(() => {
          const currentHour = new Date().getHours();
          const container = document.getElementById('calendar-grid-container');
          if (container) {
            // Each hour block is approx 120px
            container.scrollTop = Math.max(0, (currentHour - 2) * 120);
          }
        }, 100);

      } catch (error) {
        console.error('Failed to load calendar:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCalendar();
  }, [weekOffset, settings.impactFilter, settings.currency]);

  const handleAnalyze = async (dayIndex: number, eventIndex: number) => {
    setSelectedEvent({ dayIndex, eventIndex });

    if (days[dayIndex].events[eventIndex].analysis || days[dayIndex].events[eventIndex].isLoading) return;

    const newDays = [...days];
    newDays[dayIndex].events[eventIndex].isLoading = true;
    setDays(newDays);

    try {
      const event = days[dayIndex].events[eventIndex];
      const analysis = await analyzeEconomicEvent(event.title, event.country);
      const updatedDays = [...days];
      updatedDays[dayIndex].events[eventIndex].analysis = analysis;
      updatedDays[dayIndex].events[eventIndex].isLoading = false;
      setDays(updatedDays);
    } catch (error) {
      console.error('Failed to analyze event:', error);
      const updatedDays = [...days];
      updatedDays[dayIndex].events[eventIndex].isLoading = false;
      setDays(updatedDays);
    }
  };

  const selectedEventData = selectedEvent ? days[selectedEvent.dayIndex]?.events[selectedEvent.eventIndex] : null;

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-background pointer-events-none" />
      <div className="flex-1 flex flex-col overflow-hidden relative z-0 p-4 gap-4">
        <div className="flex items-center justify-between p-4 glass-card z-10">
          <h1 className="text-2xl font-bold tracking-tight">Economic Calendar</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-surface/50 border border-border/50 rounded-full p-1 shadow-sm backdrop-blur-md">
              <button
                type="button"
                onClick={() => setWeekOffset((o) => o - 1)}
                className="p-2 hover:bg-surface rounded-full transition-all text-text-secondary hover:text-text-primary"
                aria-label="Previous week"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold px-3 min-w-[80px] text-center">
                {weekOffset === 0 ? 'This Week' : weekOffset === -1 ? 'Last Week' : weekOffset === 1 ? 'Next Week' : `${weekOffset > 0 ? '+' : ''}${weekOffset} wk`}
              </span>
              <button
                type="button"
                onClick={() => setWeekOffset((o) => o + 1)}
                className="p-2 hover:bg-surface rounded-full transition-all text-text-secondary hover:text-text-primary"
                aria-label="Next week"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="flex items-center bg-surface/50 border border-border/50 rounded-full p-1 shadow-sm backdrop-blur-md">
              <button
                type="button"
                onClick={() => setViewMode((m) => (m === 'week' ? 'day' : 'week'))}
                className={`px-4 py-2 text-sm font-semibold rounded-full flex items-center gap-2 shadow-sm transition-colors ${viewMode === 'week' ? 'bg-background text-text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
              >
                <LayoutGrid size={16} />
                {viewMode === 'week' ? 'Week' : 'Day'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-surface/80 rounded-full transition-all border border-transparent hover:border-border/50 shadow-sm backdrop-blur-md"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {!loading && weekOffset !== 0 && days.every((d: any) => d.events.length === 0) && (
          <div className="px-4 py-2 text-sm text-text-secondary bg-surface/80 border border-border/50 rounded-xl mx-4 mb-2">
            No events returned for this week. Try &quot;This Week&quot;.
          </div>
        )}
        <div className="flex-1 overflow-auto relative glass-card" id="calendar-grid-container">
          {loading ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <Loader2 className="animate-spin w-8 h-8 text-accent" />
            </div>
          ) : days.every((d: any) => d.events.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary px-6 text-center gap-4">
              <p className="text-base font-medium">No major events scheduled for today.</p>
            </div>
          ) : (
            <div className="min-w-[1000px] h-full flex flex-col">
              {/* Header Row */}
              <div className="flex border-b border-border/50 sticky top-0 bg-surface/80 backdrop-blur-xl z-20">
                <div className="w-20 shrink-0 border-r border-border/50 p-4 text-xs text-text-secondary text-center font-semibold tracking-wide uppercase flex items-center justify-center">EST</div>
                {days.map((day: any, i) => {
                  const today = new Date();
                  const isToday = day.year === today.getFullYear() &&
                    day.month === today.getMonth() &&
                    day.date === today.getDate();
                  return (
                    <div key={i} className={`flex-1 border-r border-border/50 p-4 text-center transition-colors ${isToday ? 'bg-accent/10' : ''}`}>
                      <span className={`text-sm font-bold tracking-wide uppercase ${isToday ? 'text-accent' : 'text-text-secondary'}`}>
                        {day.name}
                      </span>
                      {day.events.length > 0 && (
                        <div className="mt-2 flex justify-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-warning/20 text-warning text-xs flex items-center justify-center font-bold shadow-sm">
                            {day.events.filter((e: any) => e.impact === 'Medium').length}
                          </span>
                          {day.events.some((e: any) => e.impact === 'High') && (
                            <span className="w-6 h-6 rounded-full bg-negative/20 text-negative text-xs flex items-center justify-center font-bold shadow-sm">
                              {day.events.filter((e: any) => e.impact === 'High').length}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Grid Body */}
              <div className="flex-1 relative">
                {hours.map((hour, i) => (
                  <div key={i} className="flex border-b border-border/50 min-h-[140px]">
                    <div className="w-20 shrink-0 border-r border-border/50 p-3 text-xs font-medium text-text-secondary text-right relative">
                      <span className="absolute -top-2.5 right-3 bg-surface/80 backdrop-blur-md px-2 py-0.5 rounded-full border border-border/50">{hour}</span>
                    </div>
                    {days.map((day: any, j) => {
                      const today = new Date();
                      const isToday = day.year === today.getFullYear() &&
                        day.month === today.getMonth() &&
                        day.date === today.getDate();
                      return (
                        <div key={j} className={`flex-1 border-r border-border/50 p-2 relative ${isToday ? 'bg-accent/5' : ''}`}>
                          <div className="flex flex-col gap-2">
                            {day.events.filter((e: any) => {
                              const eventHour = parseInt(e.time.split(':')[0]);
                              const isPM = e.time.includes('PM');
                              const eventHour24 = isPM && eventHour !== 12 ? eventHour + 12 : (!isPM && eventHour === 12 ? 0 : eventHour);

                              const gridHour = parseInt(hour.split(' ')[0]);
                              const gridIsPM = hour.includes('PM');
                              const gridHour24 = gridIsPM && gridHour !== 12 ? gridHour + 12 : (!gridIsPM && gridHour === 12 ? 0 : gridHour);

                              return eventHour24 === gridHour24;
                            }).map((event: any, k: number) => {
                              const eventIndex = day.events.findIndex((e: any) => e === event);
                              return (
                                <div
                                  key={k}
                                  className={`bg-surface/80 backdrop-blur-xl border rounded-2xl p-3 hover:bg-surface-hover hover:shadow-lg transition-all cursor-pointer group ${selectedEvent?.dayIndex === j && selectedEvent?.eventIndex === eventIndex
                                    ? 'border-accent ring-2 ring-accent/30 shadow-md'
                                    : 'border-border/50 hover:border-border'
                                    }`}
                                  onClick={() => handleAnalyze(j, eventIndex)}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                                      <span className={`w-2 h-2 rounded-full ${event.impact === 'High' ? 'bg-negative shadow-[0_0_8px_rgba(255,69,58,0.6)]' :
                                        event.impact === 'Medium' ? 'bg-warning shadow-[0_0_8px_rgba(255,159,10,0.6)]' :
                                          'bg-positive shadow-[0_0_8px_rgba(48,209,88,0.6)]'
                                        }`} />
                                      {event.time}
                                    </span>
                                    {event.isLoading ? (
                                      <Loader2 size={14} className="text-accent animate-spin" />
                                    ) : event.analysis ? (
                                      <Brain size={14} className="text-accent" />
                                    ) : null}
                                  </div>
                                  <div className="text-sm font-bold text-text-primary leading-snug group-hover:text-accent transition-colors">
                                    {event.title}
                                  </div>
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
          )}
        </div>
      </div>

      {/* Side Panel for Gemini Insights */}
      {selectedEventData && (
        <div className="w-96 border-l border-border/50 glass bg-surface/90 flex flex-col animate-in slide-in-from-right-8 shadow-2xl z-30 absolute right-0 top-0 bottom-0">
          <div className="p-5 border-b border-border/50 flex items-center justify-between bg-surface/50 backdrop-blur-xl">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <Brain size={20} className="text-accent" />
              Gemini Insights
            </h3>
            <button
              onClick={() => setSelectedEvent(null)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-full transition-all bg-surface/50 border border-border/50"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-6 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedEventData.impact === 'High' ? 'bg-negative shadow-[0_0_8px_rgba(255,69,58,0.6)]' :
                  selectedEventData.impact === 'Medium' ? 'bg-warning shadow-[0_0_8px_rgba(255,159,10,0.6)]' :
                    'bg-positive shadow-[0_0_8px_rgba(48,209,88,0.6)]'
                  }`} />
                {selectedEventData.time} • {selectedEventData.country}
              </span>
              <h2 className="text-2xl font-bold text-text-primary leading-tight">{selectedEventData.title}</h2>
            </div>

            {selectedEventData.isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-text-secondary">
                <Loader2 size={40} className="animate-spin text-accent" />
                <p className="text-base font-medium">Analyzing market impact...</p>
              </div>
            ) : selectedEventData.analysis ? (
              <div className="flex flex-col gap-6">
                <div className="glass-card p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Sentiment</span>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${selectedEventData.analysis.sentiment === 'Bullish' ? 'bg-positive/20 text-positive' :
                      selectedEventData.analysis.sentiment === 'Bearish' ? 'bg-negative/20 text-negative' :
                        'bg-warning/20 text-warning'
                      }`}>
                      {selectedEventData.analysis.sentiment}
                    </span>
                  </div>
                  <p className="text-[15px] text-text-primary leading-relaxed">
                    {selectedEventData.analysis.analysis}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-5 flex flex-col gap-2">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Impact Score</span>
                    <span className="text-4xl font-bold text-text-primary">{selectedEventData.analysis.impactRating}<span className="text-xl text-text-secondary font-medium">/10</span></span>
                  </div>
                  <div className="glass-card p-5 flex flex-col gap-3">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Assets</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedEventData.analysis.impactedAssets.map(asset => (
                        <span key={asset} className="px-3 py-1.5 text-xs font-bold bg-surface rounded-full text-text-primary border border-border/50 shadow-sm">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-5 text-text-secondary">
                <p className="text-base text-center font-medium">Click "Analyze" to generate AI insights for this event.</p>
                <button
                  onClick={() => {
                    if (selectedEvent) {
                      handleAnalyze(selectedEvent.dayIndex, selectedEvent.eventIndex);
                    }
                  }}
                  className="px-6 py-3 bg-accent text-white rounded-full font-bold hover:bg-accent/90 transition-all shadow-lg hover:shadow-xl active:scale-95 w-full"
                >
                  Analyze Event
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

