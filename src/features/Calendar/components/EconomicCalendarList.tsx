'use client';

import { useState, useEffect } from 'react';
import { Calendar, ArrowRight, Brain, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { analyzeEconomicEvent } from '@/lib/analyzeEvent';
import { fetchEconomicCalendar, type CalendarEvent } from '@/app/actions/fetchEconomicCalendar';
import { useSettings } from '@/services/context/SettingsContext';
import { eventMatchesCurrency } from '@/features/Calendar/services/economicCalendar';

type EventAnalysis = {
  impactRating: number;
  impactedAssets: string[];
  sentiment: string;
  analysis: string;
};

type EventItem = CalendarEvent & {
  analysis?: EventAnalysis;
  isLoading?: boolean;
};

const IMPACT_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  High: { bg: 'rgba(255,69,58,0.12)', color: '#FF453A', border: 'rgba(255,69,58,0.25)', label: 'High' },
  Medium: { bg: 'rgba(255,159,10,0.12)', color: '#FF9F0A', border: 'rgba(255,159,10,0.25)', label: 'Med' },
  Low: { bg: 'rgba(48,209,88,0.10)', color: '#30D158', border: 'rgba(48,209,88,0.22)', label: 'Low' },
};

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === 'Bullish') return <TrendingUp size={12} color="var(--color-positive)" />;
  if (sentiment === 'Bearish') return <TrendingDown size={12} color="var(--color-negative)" />;
  return <Minus size={12} color="var(--color-warning)" />;
}

function applySettingsFilter(
  events: CalendarEvent[],
  impactFilter: string,
  currency: string
): CalendarEvent[] {
  if (impactFilter === 'All' && (currency === 'All' || !currency)) return events;
  return events.filter((e) => {
    const impactOk = impactFilter === 'All' || e.impact === impactFilter;
    const currencyOk = eventMatchesCurrency(e, currency);
    return impactOk && currencyOk;
  });
}

export function EconomicCalendarList() {
  const { settings } = useSettings();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("Today's Events");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEconomicCalendar();

        const now = new Date();
        const isSameDay = (d1: Date, d2: Date) =>
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();

        // 1. Try to get events for today (local time)
        let relevantEvents = data.filter((e: CalendarEvent) => isSameDay(new Date(e.date), now));
        let displayTitle = "Today's Events";

        // 2. If no events today, get upcoming events for the rest of the week
        if (relevantEvents.length === 0) {
          relevantEvents = data.filter((e: CalendarEvent) => new Date(e.date) > now);
          if (relevantEvents.length > 0) {
            displayTitle = "Upcoming Events";
          }
        }

        // 3. Apply user settings (Impact/Currency)
        const filtered = applySettingsFilter(relevantEvents, settings.impactFilter, settings.currency);

        // 4. Sort: High impact first, then by time
        const sorted = filtered.sort((a, b) => {
          const impactOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
          const impactDiff = (impactOrder[a.impact] ?? 3) - (impactOrder[b.impact] ?? 3);
          if (impactDiff !== 0) return impactDiff;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        setEvents(sorted.slice(0, 6));
        setTitle(displayTitle);
      } catch (err) {
        console.error(err);
        setError('Could not load calendar data.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [settings.impactFilter, settings.currency]);

  const handleAnalyze = async (idx: number) => {
    if (events[idx].analysis || events[idx].isLoading) return;
    setEvents(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], isLoading: true };
      return copy;
    });
    try {
      const event = events[idx];
      const analysis = await analyzeEconomicEvent(event.title, event.country || event.currency);
      setEvents(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], analysis, isLoading: false };
        return copy;
      });
    } catch {
      setEvents(prev => {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], isLoading: false };
        return copy;
      });
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(255,255,255,0.042)',
      backdropFilter: 'blur(48px) saturate(160%)',
      WebkitBackdropFilter: 'blur(48px) saturate(160%)',
      borderRadius: 24,
      border: '1px solid rgba(255,255,255,0.09)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), inset 1px 0 0 rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.40)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Lensing */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 35%, transparent 55%)',
      }} />

      {/* Header */}
      <div style={{
        padding: '18px 18px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, position: 'relative', zIndex: 1,
        background: 'rgba(255,255,255,0.018)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'rgba(10,132,255,0.15)',
            border: '1px solid rgba(10,132,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
          }}>
            <Calendar size={15} color="var(--color-accent)" />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.92)' }}>
            {title}
          </span>
        </div>
        <Link href="/economic" style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: '0.75rem', fontWeight: 600, letterSpacing: '-0.01em',
          color: 'var(--color-accent)',
          background: 'rgba(10,132,255,0.10)',
          border: '1px solid rgba(10,132,255,0.20)',
          borderRadius: 999, padding: '5px 10px',
          textDecoration: 'none',
          transition: 'all 0.2s',
          boxShadow: 'inset 0 1px 0 rgba(10,132,255,0.15)',
        }}>
          All <ArrowRight size={12} />
        </Link>
      </div>

      {/* Events list */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={26} color="var(--color-accent)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-negative)', fontSize: '0.8125rem', textAlign: 'center', padding: 16 }}>
            {error}
          </div>
        ) : events.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
            <Calendar size={34} style={{ opacity: 0.12 }} />
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.30)', fontWeight: 500, textAlign: 'center' }}>
              No major events found.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map((event, i) => {
              const imp = IMPACT_STYLES[event.impact] ?? IMPACT_STYLES.Low;
              const hasActual = !!event.actual;
              const actualVsForecast = hasActual && event.forecast
                ? parseFloat(event.actual!) >= parseFloat(event.forecast)
                : null;

              const eventDate = new Date(event.date);
              // Show date if listing upcoming events
              const showDate = title === "Upcoming Events";
              const dateString = showDate
                ? eventDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                : null;

              return (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255,255,255,0.042)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    padding: '12px 13px',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    animation: 'liquid-fade 0.35s ease both',
                    animationDelay: `${i * 0.05}s`,
                    backdropFilter: 'blur(10px)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.background = 'rgba(255,255,255,0.072)';
                    el.style.borderColor = 'rgba(255,255,255,0.13)';
                    el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 18px rgba(0,0,0,0.30)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.background = 'rgba(255,255,255,0.042)';
                    el.style.borderColor = 'rgba(255,255,255,0.07)';
                    el.style.boxShadow = '';
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* Time block */}
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      background: 'rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10, padding: '6px 8px',
                      minWidth: 48, flexShrink: 0,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                    }}>
                      {showDate && (
                        <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>
                          {dateString}
                        </span>
                      )}
                      <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                        {event.time === 'All Day' ? 'All' : event.time.split(' ')[0]}
                      </span>
                      {event.time !== 'All Day' && (
                        <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          {event.time.includes('AM') ? 'AM' : 'PM'}
                        </span>
                      )}
                      <span style={{
                        marginTop: 3, fontSize: '0.5rem', fontWeight: 700,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        color: 'var(--color-accent)',
                      }}>
                        {event.currency}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '-0.01em',
                        color: 'rgba(255,255,255,0.88)', lineHeight: 1.35,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {event.title}
                      </span>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                        {/* Impact */}
                        <span style={{
                          fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                          background: imp.bg, color: imp.color,
                          border: `1px solid ${imp.border}`,
                          borderRadius: 999, padding: '2px 7px',
                        }}>
                          {imp.label}
                        </span>

                        {event.forecast && (
                          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>
                            F: <strong style={{ color: 'rgba(255,255,255,0.70)', fontWeight: 700 }}>{event.forecast}</strong>
                          </span>
                        )}
                        {event.previous && (
                          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>
                            P: <strong style={{ color: 'rgba(255,255,255,0.70)', fontWeight: 700 }}>{event.previous}</strong>
                          </span>
                        )}
                        {hasActual && (
                          <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>
                            A: <strong style={{
                              fontWeight: 700,
                              color: actualVsForecast === null
                                ? 'rgba(255,255,255,0.70)'
                                : actualVsForecast ? 'var(--color-positive)' : 'var(--color-negative)',
                            }}>{event.actual}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AI button */}
                    <button
                      onClick={() => handleAnalyze(i)}
                      disabled={event.isLoading}
                      title="Analyze with AI"
                      style={{
                        width: 32, height: 32, flexShrink: 0,
                        borderRadius: 999, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        background: event.analysis
                          ? 'var(--color-accent)'
                          : 'rgba(255,255,255,0.055)',
                        border: event.analysis
                          ? '1px solid rgba(255,255,255,0.25)'
                          : '1px solid rgba(255,255,255,0.10)',
                        color: event.analysis ? '#fff' : 'rgba(255,255,255,0.40)',
                        boxShadow: event.analysis
                          ? '0 0 14px rgba(10,132,255,0.35), inset 0 1px 0 rgba(255,255,255,0.25)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.10)',
                      }}
                      onMouseEnter={e => {
                        if (!event.analysis) {
                          (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)';
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(10,132,255,0.30)';
                          (e.currentTarget as HTMLElement).style.background = 'rgba(10,132,255,0.10)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!event.analysis) {
                          (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.40)';
                          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
                          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.055)';
                        }
                      }}
                    >
                      {event.isLoading
                        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Brain size={14} />
                      }
                    </button>
                  </div>

                  {/* AI Analysis */}
                  {event.analysis && (
                    <div style={{
                      marginTop: 10, paddingTop: 10,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      animation: 'liquid-fade 0.3s ease both',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Brain size={10} color="var(--color-accent)" />
                          AI Analysis
                        </span>
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.03em',
                          borderRadius: 999, padding: '2px 8px',
                          background: event.analysis.sentiment === 'Bullish' ? 'rgba(48,209,88,0.12)' : event.analysis.sentiment === 'Bearish' ? 'rgba(255,69,58,0.12)' : 'rgba(255,159,10,0.12)',
                          color: event.analysis.sentiment === 'Bullish' ? 'var(--color-positive)' : event.analysis.sentiment === 'Bearish' ? 'var(--color-negative)' : 'var(--color-warning)',
                          border: `1px solid ${event.analysis.sentiment === 'Bullish' ? 'rgba(48,209,88,0.22)' : event.analysis.sentiment === 'Bearish' ? 'rgba(255,69,58,0.22)' : 'rgba(255,159,10,0.22)'}`,
                        }}>
                          <SentimentIcon sentiment={event.analysis.sentiment} />
                          {event.analysis.sentiment}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, margin: '0 0 8px' }}>
                        {event.analysis.analysis}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {event.analysis.impactedAssets.map((asset: string) => (
                          <span key={asset} style={{
                            fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: 999, padding: '2px 7px',
                            color: 'rgba(255,255,255,0.40)',
                          }}>
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}