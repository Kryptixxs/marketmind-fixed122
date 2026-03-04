'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function SessionTracker() {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getSessionStatus = (start: number, end: number) => {
    if (!time) return false;
    const hour = time.getUTCHours();
    if (start < end) return hour >= start && hour < end;
    return hour >= start || hour < end; // Over midnight
  };

  const sessions = [
    { name: 'London', start: 8, end: 16, color: 'bg-blue-500' },
    { name: 'New York', start: 13, end: 21, color: 'bg-accent' },
    { name: 'Asia', start: 0, end: 8, color: 'bg-purple-500' }
  ];

  return (
    <div className="p-2 h-full flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="text-[8px] text-text-tertiary uppercase font-bold">Global Session Monitor</div>
        <div className="text-[10px] font-mono text-accent min-w-[60px] text-right">
          {mounted && time ? time.toUTCString().split(' ')[4] : '--:--:--'} UTC
        </div>
      </div>
      
      <div className="space-y-2">
        {sessions.map(s => {
          const isActive = getSessionStatus(s.start, s.end);
          return (
            <div key={s.name} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className={`text-[9px] font-bold uppercase ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>{s.name}</span>
                <span className={`text-[8px] font-mono ${isActive ? 'text-positive' : 'text-text-tertiary'}`}>{isActive ? 'ACTIVE' : 'CLOSED'}</span>
              </div>
              <div className="h-1 w-full bg-surface-highlight rounded-full overflow-hidden">
                <div 
                  className={`h-full ${s.color} transition-all duration-1000 ${isActive ? 'opacity-100' : 'opacity-10'}`} 
                  style={{ width: isActive ? '100%' : '0%' }} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}