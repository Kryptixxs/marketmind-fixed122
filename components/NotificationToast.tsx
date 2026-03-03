'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export function NotificationToast() {
  const [notifications, setNotifications] = useState<{id: number, message: string, type: string}[]>([]);

  useEffect(() => {
    // Simulate receiving a custom notification for a Pro feature
    const timer = setTimeout(() => {
      setNotifications(prev => [...prev, {
        id: Date.now(),
        message: 'High Impact Event: Initial Jobless Claims released. Actual: 210K (Better than forecast).',
        type: 'alert'
      }]);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map(notification => (
        <div key={notification.id} className="bg-surface border border-border rounded-lg p-4 shadow-lg flex items-start gap-3 max-w-sm animate-in slide-in-from-bottom-5">
          <div className="p-2 bg-accent/20 text-accent rounded-full shrink-0">
            <Bell size={16} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-text-primary">Pro Alert</h4>
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
