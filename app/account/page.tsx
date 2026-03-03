'use client';

import { useState } from 'react';
import { User, Shield, Key, Check, X } from 'lucide-react';

export default function AccountPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('Institutional User');
  const [email, setEmail] = useState('pro-trader@vantage.terminal');
  
  const [keys, setKeys] = useState([
    { id: 1, name: 'Binance Read-Only', prefix: 'sk_live_1a2b...' },
    { id: 2, name: 'Polygon Market Data', prefix: 'pk_prod_9x8z...' }
  ]);

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, this would dispatch an API call
  };

  const removeKey = (id: number) => {
    setKeys(keys.filter(k => k.id !== id));
  };

  return (
    <div className="flex-1 p-8 max-w-3xl mx-auto w-full space-y-8 overflow-y-auto custom-scrollbar">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Account Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your institutional profile and security configurations.</p>
      </div>

      {/* Profile Section */}
      <div className="p-6 bg-surface border border-border rounded-sm flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center text-accent border border-accent/20">
              <User size={28} />
            </div>
            {isEditing ? (
              <div className="flex flex-col gap-2">
                <input value={name} onChange={e => setName(e.target.value)} className="bg-background border border-border px-3 py-1 text-sm font-bold text-text-primary rounded-sm outline-none focus:border-accent" />
                <input value={email} onChange={e => setEmail(e.target.value)} className="bg-background border border-border px-3 py-1 text-xs text-text-secondary rounded-sm outline-none focus:border-accent" />
              </div>
            ) : (
              <div>
                <div className="text-lg font-bold text-text-primary">{name}</div>
                <div className="text-sm text-text-tertiary">{email}</div>
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-surface-highlight border border-border text-xs font-bold rounded-sm hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-accent text-accent-text text-xs font-bold rounded-sm hover:opacity-90 transition-opacity">Save Profile</button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-surface-highlight border border-border text-xs font-bold rounded-sm hover:bg-white/5 transition-colors">Edit Profile</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security */}
        <div className="p-6 bg-surface border border-border rounded-sm space-y-4">
          <div className="flex items-center gap-2 text-text-primary border-b border-border pb-2">
            <Shield size={18} className="text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Security</h2>
          </div>
          
          <div className="flex items-center justify-between bg-background p-3 rounded-sm border border-border">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text-primary">Two-Factor Authentication</span>
              <span className="text-xs text-text-tertiary">Authenticator App (TOTP)</span>
            </div>
            <span className="px-2 py-1 bg-positive/10 text-positive border border-positive/20 text-[10px] font-bold uppercase rounded-sm flex items-center gap-1">
              <Check size={12} /> Enabled
            </span>
          </div>

          <button className="w-full py-2 border border-border text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-highlight rounded-sm transition-colors">
            Change Password
          </button>
        </div>

        {/* API Keys */}
        <div className="p-6 bg-surface border border-border rounded-sm space-y-4 flex flex-col">
          <div className="flex items-center gap-2 text-text-primary border-b border-border pb-2">
            <Key size={18} className="text-warning" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Broker API Keys</h2>
          </div>
          
          <div className="flex-1 space-y-2">
            {keys.map(key => (
              <div key={key.id} className="flex items-center justify-between bg-background p-2 rounded-sm border border-border group">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-text-primary">{key.name}</span>
                  <span className="text-[10px] font-mono text-text-tertiary">{key.prefix}</span>
                </div>
                <button onClick={() => removeKey(key.id)} className="p-1.5 text-text-tertiary hover:text-negative opacity-0 group-hover:opacity-100 transition-all rounded-sm hover:bg-negative/10">
                  <X size={14} />
                </button>
              </div>
            ))}
            {keys.length === 0 && (
              <div className="text-xs text-text-tertiary italic text-center py-4">No active API keys.</div>
            )}
          </div>

          <button onClick={() => alert('New key generation modal triggered.')} className="w-full py-2 bg-surface-highlight border border-border text-xs font-bold text-text-primary hover:border-accent/50 transition-colors rounded-sm mt-auto">
            Generate New Key
          </button>
        </div>
      </div>
    </div>
  );
}