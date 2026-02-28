'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettings, type ImpactFilter } from '@/context/SettingsContext';

type Tab = 'filters' | 'account';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY'];

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('filters');
  const { settings, setImpactFilter, setCurrency } = useSettings();
  const impactFilter = settings.impactFilter;
  const selectedCurrency = settings.currency;

  useEffect(() => {
    if (isOpen) setActiveTab('filters');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Settings</h2>
          <button onClick={onClose} className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('filters')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'filters' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Filters
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'account' ? 'text-accent border-b-2 border-accent' : 'text-text-secondary hover:text-text-primary'}`}
          >
            Account
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {activeTab === 'filters' && (
            <>
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-text-primary">Broad Impact</h3>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setImpactFilter('All')}
                    className={`py-2 text-sm font-medium rounded-md border transition-colors ${
                      impactFilter === 'All' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-background border-border text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setImpactFilter('Low')}
                    className={`py-2 text-sm font-medium rounded-md border transition-colors ${
                      impactFilter === 'Low' ? 'bg-positive/10 border-positive/30 text-positive' : 'bg-background border-border text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    onClick={() => setImpactFilter('Medium')}
                    className={`py-2 text-sm font-medium rounded-md border transition-colors ${
                      impactFilter === 'Medium' ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-background border-border text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    type="button"
                    onClick={() => setImpactFilter('High')}
                    className={`py-2 text-sm font-medium rounded-md border transition-colors ${
                      impactFilter === 'High' ? 'bg-negative/10 border-negative/30 text-negative' : 'bg-background border-border text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    High
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-text-primary">Currency</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrency('All')}
                    className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                      selectedCurrency === 'All' ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-background border-border text-text-secondary hover:border-text-secondary'
                    }`}
                  >
                    All
                  </button>
                  {CURRENCIES.map((currency) => (
                    <button
                      key={currency}
                      type="button"
                      onClick={() => setCurrency(currency)}
                      className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
                        selectedCurrency === currency
                          ? 'bg-accent/10 border-accent/30 text-accent'
                          : 'bg-background border-border text-text-secondary hover:border-text-secondary'
                      }`}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {activeTab === 'account' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-primary">Account</h3>
              <p className="text-sm text-text-secondary">Account settings and API keys can be configured here when connected to a broker or data provider.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
