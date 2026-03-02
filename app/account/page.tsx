'use client';

import { useState } from 'react';
import { User, Shield, Check, X, CreditCard } from 'lucide-react';
import { getPlanDetails, Feature } from '@/lib/entitlements';

const ALL_FEATURES: { id: Feature; label: string }[] = [
  { id: 'alerts', label: 'Real-time Alerts' },
  { id: 'advanced_charts', label: 'Advanced Technical Charts' },
  { id: 'institutional_news', label: 'Institutional News Wire' },
  { id: 'algo_trading', label: 'Algorithmic Backtesting' },
];

export default function AccountPage() {
  // Mock user state - in real app this comes from Supabase
  const [user] = useState({
    email: 'trader@vantage.com',
    plan: 'pro',
  });

  const details = getPlanDetails(user.plan);

  return (
    <div className="flex-1 p-8 bg-background overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center">
            <User size={32} className="text-text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{user.email}</h1>
            <p className="text-text-secondary">Manage your institutional account and entitlements.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan Card */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-tertiary">Current Plan</h3>
              <span className="px-2 py-1 bg-accent/10 text-accent text-[10px] font-bold rounded uppercase">
                {details.plan}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-text-primary">
                {details.plan === 'pro' ? '$49' : details.plan === 'enterprise' ? '$199' : '$0'}
              </span>
              <span className="text-text-secondary text-sm">/ month</span>
            </div>
            <button className="w-full py-2 bg-surface-highlight border border-border rounded text-xs font-bold hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
              <CreditCard size={14} /> Upgrade Plan
            </button>
          </div>

          {/* Entitlements Card */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-tertiary">Module Entitlements</h3>
            <div className="space-y-3">
              {ALL_FEATURES.map((feature) => {
                const hasAccess = details.features.includes(feature.id);
                return (
                  <div key={feature.id} className="flex items-center justify-between">
                    <span className={`text-xs ${hasAccess ? 'text-text-primary' : 'text-text-tertiary'}`}>
                      {feature.label}
                    </span>
                    {hasAccess ? (
                      <Check size={14} className="text-positive" />
                    ) : (
                      <X size={14} className="text-text-tertiary" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-text-tertiary" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-tertiary">Security & Audit</h3>
          </div>
          <p className="text-xs text-text-secondary">
            Your account is protected by institutional-grade encryption. All sensitive actions are logged for audit purposes.
          </p>
          <div className="pt-2">
            <button className="text-xs text-accent hover:underline font-bold">View Audit Logs</button>
          </div>
        </div>
      </div>
    </div>
  );
}