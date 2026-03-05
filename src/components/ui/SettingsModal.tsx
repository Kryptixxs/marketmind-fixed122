'use client';

import React, { useState } from 'react';
import { X, Settings, Bell, Shield, User, CreditCard, LogOut, Building, Mail } from 'lucide-react';
import { useSettings } from '@/services/context/SettingsContext';
import { useAuth } from '@/services/context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, setImpactFilter, setCurrency, setStrategy, setVolatilityPreference, setRiskTolerance } = useSettings();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'General' | 'Account' | 'Notifications' | 'Security'>('General');

  if (!isOpen) return null;

  const userMeta = user?.user_metadata || {};
  const fullName = userMeta.first_name ? `${userMeta.first_name} ${userMeta.last_name || ''}` : 'Institutional User';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border w-full max-w-2xl h-[500px] flex flex-col shadow-2xl rounded-sm overflow-hidden">
        
        {/* Header */}
        <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest">Terminal Preferences</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-40 border-r border-border bg-surface-highlight/30 flex flex-col py-2">
            {[
              { id: 'General', icon: Settings },
              { id: 'Account', icon: User },
              { id: 'Notifications', icon: Bell },
              { id: 'Security', icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all
                  ${activeTab === tab.id ? 'text-accent bg-accent/5 border-r-2 border-accent' : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'}
                `}
              >
                <tab.icon size={14} />
                {tab.id}
              </button>
            ))}
            
            <button 
              onClick={() => { signOut(); onClose(); }}
              className="mt-auto flex items-center gap-3 px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-negative hover:bg-negative/5 transition-all border-t border-border/50"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            {activeTab === 'General' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border pb-2">Market Filters</h3>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">Default Impact Filter</label>
                    <div className="flex gap-1">
                      {['All', 'Low', 'Medium', 'High'].map(f => (
                        <button
                          key={f}
                          onClick={() => setImpactFilter(f as any)}
                          className={`flex-1 py-1.5 text-[10px] font-bold rounded-sm border transition-all ${settings.impactFilter === f ? 'bg-accent/10 border-accent text-accent' : 'bg-background border-border text-text-tertiary hover:text-text-secondary'}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase">Primary Currency Focus</label>
                    <select 
                      value={settings.currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-background border border-border rounded-sm px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                    >
                      <option value="All">Global (All Currencies)</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border pb-2">Trading Profile</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase">Strategy Bias</label>
                      <select 
                        value={settings.strategy}
                        onChange={(e) => setStrategy(e.target.value as any)}
                        className="w-full bg-background border border-border rounded-sm px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                      >
                        <option value="Scalper">Scalper (1m - 5m)</option>
                        <option value="Swing">Swing (1h - 4h)</option>
                        <option value="Macro">Macro (Daily+)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-text-secondary uppercase">Risk Tolerance</label>
                      <select 
                        value={settings.riskTolerance}
                        onChange={(e) => setRiskTolerance(e.target.value as any)}
                        className="w-full bg-background border border-border rounded-sm px-3 py-2 text-xs text-text-primary outline-none focus:border-accent"
                      >
                        <option value="Conservative">Conservative</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Aggressive">Aggressive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Account' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border pb-2">Institutional Profile</h3>
                  
                  <div className="p-4 bg-background border border-border rounded-sm space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent border border-accent/20">
                        <User size={24} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">{fullName}</span>
                        <span className="text-xs text-text-tertiary flex items-center gap-1">
                          <Mail size={10} /> {user?.email}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 pt-2">
                      <div className="flex items-center justify-between text-[10px] py-1 border-t border-border/50">
                        <span className="text-text-tertiary uppercase font-bold flex items-center gap-1.5">
                          <Building size={12} /> Firm
                        </span>
                        <span className="text-text-primary font-mono">{userMeta.firm || 'Independent Trader'}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] py-1 border-t border-border/50">
                        <span className="text-text-tertiary uppercase font-bold flex items-center gap-1.5">
                          <CreditCard size={12} /> Tier
                        </span>
                        <span className="text-accent font-bold uppercase tracking-tighter">Vantage Pro</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest border-b border-border pb-2">Entitlements</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { label: 'Real-time L2 Data', status: 'Active' },
                      { label: 'Gemini 2.0 Synthesis', status: 'Active' },
                      { label: 'Institutional News Wire', status: 'Active' },
                    ].map(e => (
                      <div key={e.label} className="flex items-center justify-between bg-surface-highlight/30 p-2 rounded-sm border border-border/50">
                        <span className="text-[10px] text-text-secondary font-medium">{e.label}</span>
                        <span className="text-[9px] font-bold text-positive uppercase">{e.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <Bell size={32} className="text-text-tertiary" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Notification Engine</h4>
                  <p className="text-[10px] text-text-tertiary max-w-[200px]">Configure desktop and mobile push alerts for high-impact macro events.</p>
                </div>
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <Shield size={32} className="text-text-tertiary" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Security Protocols</h4>
                  <p className="text-[10px] text-text-tertiary max-w-[200px]">Manage 2FA, session tokens, and institutional encryption keys.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-highlight flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-accent text-accent-text text-[10px] font-bold uppercase tracking-widest rounded-sm hover:opacity-90 transition-opacity"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}