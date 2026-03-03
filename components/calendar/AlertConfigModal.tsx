'use client';

import React, { useState } from 'react';
import { X, Bell, Clock, Zap, Activity } from 'lucide-react';
import { EconomicEvent, AlertType } from '@/lib/types';
import { addAlert } from '@/lib/alerts';

interface AlertConfigModalProps {
  event: EconomicEvent;
  onClose: () => void;
}

export function AlertConfigModal({ event, onClose }: AlertConfigModalProps) {
  const [type, setType] = useState<AlertType>('BEFORE');
  const [minutesBefore, setMinutesBefore] = useState(5);
  const [threshold, setThreshold] = useState(10);

  const handleSave = () => {
    addAlert({
      eventId: event.id,
      eventTitle: event.title,
      eventTime: event.time,
      eventDate: event.date,
      type,
      minutesBefore: type === 'BEFORE' ? minutesBefore : undefined,
      surpriseThreshold: type === 'SURPRISE' ? threshold : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-sm rounded-sm shadow-2xl overflow-hidden flex flex-col">
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-2 h-auto border-b border-border bg-surface-highlight">
          <span className="text-[10px] font-bold uppercase tracking-widest">Configure Alert</span>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-1">
            <span className="text-[9px] text-text-tertiary uppercase font-bold">Event</span>
            <div className="text-xs font-bold text-text-primary truncate">{event.title}</div>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] text-text-tertiary uppercase font-bold">Alert Type</span>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'BEFORE', icon: Clock, label: 'Before' },
                { id: 'RELEASE', icon: Zap, label: 'Release' },
                { id: 'SURPRISE', icon: Activity, label: 'Surprise' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id as AlertType)}
                  className={`flex flex-col items-center gap-1 p-2 border rounded-sm transition-all ${
                    type === t.id ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border text-text-tertiary hover:border-text-secondary'
                  }`}
                >
                  <t.icon size={14} />
                  <span className="text-[8px] font-bold uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {type === 'BEFORE' && (
            <div className="space-y-2">
              <span className="text-[9px] text-text-tertiary uppercase font-bold">Minutes Before Release</span>
              <input 
                type="number" 
                value={minutesBefore}
                onChange={e => setMinutesBefore(parseInt(e.target.value))}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-xs font-mono text-text-primary focus:border-accent outline-none"
              />
            </div>
          )}

          {type === 'SURPRISE' && (
            <div className="space-y-2">
              <span className="text-[9px] text-text-tertiary uppercase font-bold">Surprise Threshold (%)</span>
              <input 
                type="number" 
                value={threshold}
                onChange={e => setThreshold(parseInt(e.target.value))}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-xs font-mono text-text-primary focus:border-accent outline-none"
              />
              <p className="text-[8px] text-text-tertiary italic">Trigger only if deviation from forecast exceeds this %.</p>
            </div>
          )}

          <button 
            onClick={handleSave}
            className="w-full py-2.5 bg-accent text-accent-text text-[10px] font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Bell size={12} /> Save Alert Rule
          </button>
        </div>
      </div>
    </div>
  );
}