'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { getAlerts, markAsTriggered, AlertRule } from '@/lib/alerts';

export function NotificationToast() {
  const [notifications, setNotifications] = useState<{id: string, message: string, title: string}[]>([]);

  useEffect(() => {
    const checkAlerts = () => {
      const alerts = getAlerts();
      const now = new Date();
      
      alerts.forEach(alert => {
        if (alert.triggered) return;

        const [year, month, day] = alert.eventDate.split('-').map(Number);
        const [hours, minutes] = alert.eventTime.split(':').map(Number);
        const eventTime = new Date(year, month - 1, day, hours, minutes);
        
        let shouldTrigger = false;
        let triggerMessage = '';

        if (alert.type === 'RELEASE') {
          if (now >= eventTime) {
            shouldTrigger = true;
            triggerMessage = `Event Release: ${alert.eventTitle} is now live.`;
          }
        } else if (alert.type === 'BEFORE') {
          const triggerTime = new Date(eventTime.getTime() - (alert.minutesBefore || 0) * 60000);
          if (now >= triggerTime) {
            shouldTrigger = true;
            triggerMessage = `Upcoming Event: ${alert.eventTitle} starts in ${alert.minutesBefore} minutes.`;
          }
        }

        if (shouldTrigger) {
          markAsTriggered(alert.id);
          setNotifications(prev => [...prev, {
            id: alert.id,
            title: 'Market Alert',
            message: triggerMessage
          }]);
        }
      });
    };

    const interval = setInterval(checkAlerts, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
      {notifications.map(notification => (
        <div key={notification.id} className="bg-surface border border-border rounded-sm p-4 shadow-2xl flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-5">
          <div className="p-2 bg-accent/20 text-accent rounded-full shrink-0">
            <Bell size={16} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-text-primary uppercase tracking-tighter">{notification.title}</h4>
            <p className="text-xs text-text-secondary mt-1">{notification.message}</p>
          </div>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
