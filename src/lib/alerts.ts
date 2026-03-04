export type AlertType = 'BEFORE' | 'RELEASE' | 'SURPRISE';

export interface AlertRule {
  id: string;
  eventId: string;
  eventTitle: string;
  eventTime: string; // ISO or HH:mm
  eventDate: string; // YYYY-MM-DD
  type: AlertType;
  minutesBefore?: number;
  surpriseThreshold?: number;
  triggered: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'vantage_alerts';

export function getAlerts(): AlertRule[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveAlerts(alerts: AlertRule[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function addAlert(alert: Omit<AlertRule, 'id' | 'triggered' | 'createdAt'>) {
  const alerts = getAlerts();
  const newAlert: AlertRule = {
    ...alert,
    id: Math.random().toString(36).substring(2, 9),
    triggered: false,
    createdAt: Date.now(),
  };
  saveAlerts([...alerts, newAlert]);
  return newAlert;
}

export function removeAlert(id: string) {
  const alerts = getAlerts();
  saveAlerts(alerts.filter(a => a.id !== id));
}

export function markAsTriggered(id: string) {
  const alerts = getAlerts();
  saveAlerts(alerts.map(a => a.id === id ? { ...a, triggered: true } : a));
}