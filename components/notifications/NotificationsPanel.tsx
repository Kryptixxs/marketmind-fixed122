'use client';

import React, { useEffect, useState } from 'react';
import { X, Bell, Trash2, Clock, Zap, AlertTriangle } from 'lucide-react';
import { getAlerts, removeAlert, AlertRule } from '@/lib/alerts';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [alerts, setAlerts] = useState<AlertRule[]>([]);

  useEffect(() => {
    if (isOpen) {
      setAlerts(getAlerts());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    removeAlert(id);
    setAlerts(getAlerts());
  };

  if (!isOpen) return null;

  const upcoming = alerts.filter(a => !a.triggered).sort((a, b) => a.createdAt - b.createdAt);
  const history = alerts.filter(a => a.triggered).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-surface border-l border-border z-[100] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-accent" />
          <span className="text-xs font-bold uppercase tracking-widest">Alerts & Notifications</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Upcoming Alerts */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Upcoming</h3>
          {upcoming.length === 0 ? (
            <div className="text-[10px] text-text-tertiary italic py-4 text-center border border-dashed border-border rounded">
              No active alerts
            </div>
          ) : (
            upcoming.map(alert => (
              <div key={alert.id} className="p-3 bg-background border border-border rounded-sm group relative">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-text-primary truncate pr-6">{alert.eventTitle}</span>
                  <button 
                    onClick={() => handleDelete(alert.id)}
                    className="absolute top-2 right-2 p-1 text-text-tertiary hover:text-negative opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-text-secondary">
                  <Clock size={10} />
                  <span>{alert.eventDate} @ {alert.eventTime}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-accent/10 text-accent text-[8px] font-bold rounded uppercase">
                    {alert.type === 'BEFORE' ? `${alert.minutesBefore}m Before` : alert.type === 'RELEASE' ? 'On Release' : 'Surprise'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* History */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">History</h3>
          {history.length === 0 ? (
            <div className="text-[10px] text-text-tertiary italic py-4 text-center">
              No recent triggers
            </div>
          ) : (
            history.map(alert => (
              <div key={alert.id} className="p-3 bg-surface-highlight/30 border border-border rounded-sm opacity-60">
                <div className="text-[10px] font-bold text-text-secondary truncate">{alert.eventTitle}</div>
                <div className="text-[9px] text-text-tertiary mt-1">Triggered: {new Date(alert.createdAt).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
