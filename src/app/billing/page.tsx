'use client';

import { useState } from 'react';
import { CreditCard, Zap, Check, Building, AlertTriangle } from 'lucide-react';

export default function BillingPage() {
  const [showManage, setShowManage] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'enterprise'>('pro');

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 overflow-y-auto custom-scrollbar">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Subscription & Entitlements</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your terminal data feeds and API allocations.</p>
      </div>

      {!showManage ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2 p-6 bg-surface border border-border rounded-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 bg-accent text-accent-text text-[10px] font-bold uppercase tracking-widest">Active Plan</div>
            <div className="flex items-center gap-2 text-accent mb-2">
              <Zap size={24} fill="currentColor" />
              <span className="text-xl font-bold uppercase tracking-tighter">Vantage Pro</span>
            </div>
            <div className="text-4xl font-mono font-bold text-text-primary mb-6">$499<span className="text-sm text-text-tertiary">/mo</span></div>
            
            <div className="grid grid-cols-2 gap-y-3 mb-8">
              {['Real-time L2 Options Data', 'Gemini 2.0 API Limits (Uncapped)', 'Custom Backtesting Scripts', 'Multi-monitor Desktop App', 'Live SEC Filings Feed', 'Priority Chat Support'].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check size={16} className="text-accent" /> {f}
                </div>
              ))}
            </div>

            <button onClick={() => setShowManage(true)} className="px-6 py-2.5 bg-surface-highlight border border-border text-text-primary font-bold rounded-sm hover:bg-white/5 transition-colors">
              Manage Plan
            </button>
          </div>

          <div className="p-6 bg-surface border border-border rounded-sm flex flex-col">
            <h3 className="text-sm font-bold uppercase text-text-primary mb-4 flex items-center gap-2"><CreditCard size={16} className="text-text-tertiary" /> Payment Method</h3>
            
            <div className="bg-background border border-border p-4 rounded-sm mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-text-primary">Visa ending in 4242</span>
                <span className="text-xs bg-surface-highlight px-2 py-0.5 rounded-sm">Default</span>
              </div>
              <div className="text-xs text-text-tertiary">Expires 12/2027</div>
            </div>

            <button onClick={() => alert('Stripe checkout modal triggered.')} className="w-full py-2 border border-border text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-highlight rounded-sm transition-colors mt-auto">
              Update Billing Info
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-border p-6 rounded-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-text-primary">Change Subscription</h2>
            <button onClick={() => setShowManage(false)} className="text-text-tertiary hover:text-text-primary text-sm font-bold">Cancel</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div 
              onClick={() => setSelectedPlan('pro')}
              className={`p-6 border rounded-sm cursor-pointer transition-all ${selectedPlan === 'pro' ? 'bg-accent/5 border-accent ring-1 ring-accent' : 'bg-background border-border hover:border-text-secondary'}`}
            >
              <div className="flex items-center gap-2 mb-2"><Zap size={20} className={selectedPlan === 'pro' ? 'text-accent' : 'text-text-tertiary'} /> <span className="font-bold text-lg">Pro</span></div>
              <div className="text-2xl font-mono font-bold mb-4">$499<span className="text-xs text-text-tertiary">/mo</span></div>
              <p className="text-xs text-text-secondary leading-relaxed">Perfect for individual systematic traders requiring low-latency infrastructure.</p>
            </div>

            <div 
              onClick={() => setSelectedPlan('enterprise')}
              className={`p-6 border rounded-sm cursor-pointer transition-all ${selectedPlan === 'enterprise' ? 'bg-accent/5 border-accent ring-1 ring-accent' : 'bg-background border-border hover:border-text-secondary'}`}
            >
              <div className="flex items-center gap-2 mb-2"><Building size={20} className={selectedPlan === 'enterprise' ? 'text-accent' : 'text-text-tertiary'} /> <span className="font-bold text-lg">Enterprise</span></div>
              <div className="text-2xl font-mono font-bold mb-4">Custom<span className="text-xs text-text-tertiary"> pricing</span></div>
              <p className="text-xs text-text-secondary leading-relaxed">For prop shops. API rate limit waivers, FIX protocol support, and multi-seat licensing.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <button onClick={() => alert('Are you sure you want to cancel? You will lose access at the end of the billing period.')} className="text-negative text-xs font-bold hover:underline flex items-center gap-1">
              <AlertTriangle size={12} /> Cancel Subscription
            </button>
            <button onClick={() => { alert('Plan updated successfully.'); setShowManage(false); }} className="px-6 py-2.5 bg-accent text-accent-text text-sm font-bold uppercase rounded-sm hover:opacity-90 transition-opacity">
              Confirm Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}