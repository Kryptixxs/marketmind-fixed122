'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

const TABS = ['Metrics', 'Structure', 'Flow', 'Macro', 'Risk'];

export function QuantSidePanel({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState('Metrics');

  if (!isOpen) return null;

  return (
    <div className="w-96 border-l border-border bg-background flex flex-col quant-panel-enter z-50">
      <div className="h-12 border-b border-border flex items-center px-4 justify-between">
        <div className="flex items-center gap-1">
          {TABS.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-text-primary' : 'text-text-tertiary hover:text-text-secondary'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="text-text-tertiary hover:text-text-primary transition-colors"><X size={16} strokeWidth={1.5} /></button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {/* Content would be filtered by activeTab here */}
        {children}
      </div>
    </div>
  );
}