'use client';

import { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Clock, Shield, BarChart3 } from 'lucide-react';

// Trading session definitions (UTC times)
const SESSIONS = [
    { id: 'asia', label: 'ASIA', start: 0, end: 9, color: 'text-blue-400' },
    { id: 'london', label: 'LDN', start: 8, end: 16.5, color: 'text-yellow-400' },
    { id: 'ny', label: 'NY', start: 13.5, end: 21, color: 'text-green-400' },
];

function getActiveSessions(utcHour: number): typeof SESSIONS {
    return SESSIONS.filter(s => {
        if (s.start < s.end) return utcHour >= s.start && utcHour < s.end;
        return utcHour >= s.start || utcHour < s.end;
    });
}

export function StatusBar() {
    const [time, setTime] = useState({ utc: '', local: '' });
    const [activeSessions, setActiveSessions] = useState<typeof SESSIONS>([]);
    const [latency, setLatency] = useState(24);

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime({
                utc: now.toUTCString().split(' ')[4],
                local: now.toLocaleTimeString('en-US', { hour12: false }),
            });
            setActiveSessions(getActiveSessions(now.getUTCHours() + now.getUTCMinutes() / 60));
            // Simulate latency variance
            setLatency(18 + Math.floor(Math.random() * 12));
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="h-6 bg-surface border-t border-border flex items-center px-3 gap-4 text-[8px] font-mono tabular-nums select-none shrink-0 overflow-hidden">
            {/* Connection Status */}
            <div className="flex items-center gap-1.5">
                <Wifi size={9} className="text-positive" />
                <span className="text-positive font-bold uppercase">CONNECTED</span>
            </div>

            <div className="w-px h-3 bg-border" />

            {/* Latency */}
            <div className="flex items-center gap-1.5">
                <Activity size={9} className="text-text-tertiary" />
                <span className={`font-bold ${latency < 30 ? 'text-positive' : latency < 60 ? 'text-warning' : 'text-negative'}`}>
                    {latency}ms
                </span>
            </div>

            <div className="w-px h-3 bg-border" />

            {/* Active Data Feeds */}
            <div className="flex items-center gap-1.5">
                <BarChart3 size={9} className="text-text-tertiary" />
                <span className="text-text-secondary">
                    <span className="text-positive font-bold">7</span>/7 FEEDS
                </span>
            </div>

            <div className="w-px h-3 bg-border" />

            {/* Active Trading Sessions */}
            <div className="flex items-center gap-2">
                {SESSIONS.map(session => {
                    const isActive = activeSessions.some(s => s.id === session.id);
                    return (
                        <span key={session.id} className={`font-bold uppercase tracking-wider ${isActive ? session.color : 'text-text-muted line-through opacity-50'}`}>
                            {isActive && <span className="inline-block w-1 h-1 rounded-full bg-current mr-1 align-middle" />}
                            {session.label}
                        </span>
                    );
                })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Security */}
            <div className="flex items-center gap-1.5">
                <Shield size={9} className="text-text-tertiary" />
                <span className="text-text-muted uppercase">AES-256</span>
            </div>

            <div className="w-px h-3 bg-border" />

            {/* Time */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    <Clock size={9} className="text-text-tertiary" />
                    <span className="text-text-secondary">{time.utc} <span className="text-text-muted">UTC</span></span>
                </div>
                <span className="text-text-muted">{time.local} <span className="text-text-muted">LOCAL</span></span>
            </div>

            <div className="w-px h-3 bg-border" />

            {/* Build Version */}
            <span className="text-text-muted">VANTAGE_OS <span className="text-accent font-bold">v5.0.0</span></span>
        </div>
    );
}
