'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Settings, RefreshCw, 
  Calendar as CalendarIcon, Filter, Brain, Loader2 
} from 'lucide-react';
import { fetchEconomicCalendarBatch, type EconomicEvent } from '@/app/actions/fetchEconomicCalendar';
import { analyzeEconomicEvent } from '@/lib/analyzeEvent';
import { SettingsModal } from '@/components/SettingsModal';
import { useSettings } from '@/context/SettingsContext';
import { getBusinessWeek, toISODateString, formatTime, DAYS } from '@/lib/date-utils';

export default function EconomicCalendarPage() {
  const { settings } = useSettings();
  
  // State
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState<{ date: Date; dateStr: string; dayName: string }[]>([]);
  const [eventsData, setEventsData] = useState<Record<string, EconomicEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Calculate the dates for the view
  useEffect(() => {
    const today = new Date();
    // Shift today by weeks if needed
    const referenceDate = new Date(today);
    referenceDate.setDate(today.getDate() + (weekOffset * 7));
    
    const week = getBusinessWeek(referenceDate);
    setWeekDates(week);
  }, [weekOffset]);

  // Fetch data when dates change
  useEffect(() => {
    if (weekDates.length === 0) return;
    
    const fetchDates = async () => {
      setLoading(true);
      const dateStrings = weekDates.map(d => d.dateStr);
      try {
        const data = await fetchEconomicCalendarBatch(dateStrings);
        setEventsData(data);
      } catch (err) {
        console.error('Failed to load calendar events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDates();
  }, [weekDates]);

  // Analyze function
  const handleAnalyze = async (event: EconomicEvent) => {
    if (analyzingId === event.id) return; // Prevent double click
    setAnalyzingId(event.id);
    try {
      const result = await analyzeEconomicEvent(event.title, event.country);
      setAnalysisResult(result);
    } catch (e) {
      console.error('Analysis failed', e);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-background">
      {/* --- Terminal Header --- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-accent/10 border border-accent/20 rounded-md">
            <CalendarIcon size={16} className="text-accent" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-text-primary uppercase">Global Economic Calendar</h1>
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-positive bg-positive/10 border border-positive/20 rounded-sm">Live Feed</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Week Controls */}
          <div className="flex items-center bg-background border border-border rounded-md overflow-hidden mr-2">
            <button 
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-1.5 hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors border-r border-border"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-3 text-xs font-mono font-medium text-text-primary min-w-[100px] text-center">
              {weekOffset === 0 ? 'Current Week' : `${Math.abs(weekOffset)} Wk ${weekOffset > 0 ? 'Fwd' : 'Back'}`}
            </span>
            <button 
              onClick={() => setWeekOffset(w => w + 1)}
              className="p-1.5 hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors border-l border-border"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface hover:bg-surface-hover border border-border rounded-md transition-all"
          >
            <Settings size={14} />
            <span>Filters</span>
          </button>
          
          <button 
            onClick={() => setLoading(true)} // Re-trigger effect
            className="p-1.5 text-text-secondary hover:text-accent hover:bg-surface-hover rounded-md transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* --- Main Content Grid --- */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Lensing overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-surface/5 to-transparent z-0" />
        
        {/* Calendar Table Container */}
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative z-10 p-4">
          <div className="min-w-[1000px] h-full flex flex-col bg-surface/30 border border-border rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
            
            {/* Table Header - Days */}
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

            {/* Table Body - Events Grid */}
            <div className="flex flex-1 divide-x divide-border bg-background/40">
              {weekDates.map((day, i) => {
                const dayEvents = eventsData[day.dateStr] || [];
                const isToday = day.dateStr === toISODateString(new Date());

                return (
                  <div key={i} className={`flex-1 flex flex-col relative min-h-[400px] ${isToday ? 'bg-accent/[0.02]' : ''}`}>
                    {loading ? (
                      <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
                      </div>
                    ) : dayEvents.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-xs text-text-tertiary italic">
                        No major events
                      </div>
                    ) : (
                      <div className="flex flex-col p-2 gap-2 pb-20"> {/* Padding bottom for scroll */}
                        {dayEvents.map((event, j) => {
                          const isHigh = event.impact === 'High';
                          const isMed = event.impact === 'Medium';
                          
                          return (
                            <div 
                              key={event.id}
                              className={`
                                group relative flex flex-col p-2.5 rounded-lg border transition-all cursor-pointer
                                ${isHigh ? 'bg-negative/5 border-negative/20 hover:border-negative/40' : 
                                  isMed ? 'bg-warning/5 border-warning/20 hover:border-warning/40' : 
                                  'bg-surface border-border hover:border-text-secondary/30'}
                                hover:shadow-lg hover:-translate-y-0.5
                              `}
                              onClick={() => handleAnalyze(event)}
                            >
                              {/* Header: Time + Country */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-text-primary bg-surface/80 border border-border/50`}>
                                    {formatTime(event.time)}
                                  </span>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">
                                    {event.country}
                                  </span>
                                </div>
                                <div className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-negative animate-pulse' : isMed ? 'bg-warning' : 'bg-positive'}`} />
                              </div>
                              
                              {/* Title */}
                              <h3 className="text-xs font-semibold text-text-primary leading-tight mb-2 line-clamp-2">
                                {event.title}
                              </h3>

                              {/* Data Grid */}
                              <div className="grid grid-cols-3 gap-1 mt-auto pt-2 border-t border-border/40">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-text-tertiary uppercase">Act</span>
                                  <span className={`text-[10px] font-mono font-bold ${event.actual !== '-' ? 'text-text-primary' : 'text-text-tertiary'}`}>
                                    {event.actual}
                                  </span>
                                </div>
                                <div className="flex flex-col text-center border-l border-r border-border/30 px-1">
                                  <span className="text-[9px] text-text-tertiary uppercase">Fcst</span>
                                  <span className="text-[10px] font-mono text-text-secondary">
                                    {event.forecast}
                                  </span>
                                </div>
                                <div className="flex flex-col text-right">
                                  <span className="text-[9px] text-text-tertiary uppercase">Prev</span>
                                  <span className="text-[10px] font-mono text-text-secondary">
                                    {event.previous}
                                  </span>
                                </div>
                              </div>
                              
                              {/* AI Analysis Button (Hover) */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1 rounded-full bg-accent text-white hover:bg-accent-hover shadow-md">
                                  <Brain size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* --- Analysis Sidebar (Slide-over) --- */}
        {analysisResult && (
          <div className="w-[340px] border-l border-border bg-surface/95 backdrop-blur-xl flex flex-col shadow-2xl z-30 animate-in slide-in-from-right duration-300 absolute right-0 top-0 bottom-0">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary flex items-center gap-2">
                <Brain size={14} className="text-accent" />
                AI Market Intelligence
              </h2>
              <button 
                onClick={() => setAnalysisResult(null)}
                className="p-1.5 hover:bg-surface-hover rounded-md transition-colors"
              >
                <X size={16} className="text-text-tertiary hover:text-text-primary" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Sentiment Score */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-secondary">Market Sentiment</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                    analysisResult.sentiment === 'Bullish' ? 'text-positive border-positive/30 bg-positive/10' : 
                    analysisResult.sentiment === 'Bearish' ? 'text-negative border-negative/30 bg-negative/10' : 
                    'text-warning border-warning/30 bg-warning/10'
                  }`}>
                    {analysisResult.sentiment}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-hover rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      analysisResult.sentiment === 'Bullish' ? 'bg-positive w-3/4' : 
                      analysisResult.sentiment === 'Bearish' ? 'bg-negative w-1/4' : 
                      'bg-warning w-1/2'
                    }`}
                  />
                </div>
              </div>

              {/* Analysis Text */}
              <div className="p-4 rounded-lg bg-surface border border-border">
                <p className="text-sm text-text-primary leading-relaxed">
                  {analysisResult.analysis}
                </p>
              </div>

              {/* Impact Score */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-surface border border-border text-center">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase mb-1">Impact Score</div>
                  <div className="text-2xl font-bold text-text-primary">{analysisResult.impactRating}<span className="text-sm text-text-tertiary">/10</span></div>
                </div>
                <div className="p-3 rounded-lg bg-surface border border-border text-center">
                  <div className="text-[10px] font-bold text-text-tertiary uppercase mb-1">Volatility</div>
                  <div className="text-2xl font-bold text-text-primary">
                    {analysisResult.impactRating > 7 ? 'High' : analysisResult.impactRating > 4 ? 'Med' : 'Low'}
                  </div>
                </div>
              </div>

              {/* Impacted Assets */}
              <div>
                <div className="text-xs font-bold text-text-secondary uppercase mb-3">Watchlist Impact</div>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.impactedAssets.map((asset: string) => (
                    <span key={asset} className="px-2 py-1 text-[11px] font-mono font-medium text-text-primary bg-surface border border-border rounded hover:border-accent/50 transition-colors cursor-default">
                      {asset}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}