'use client';

import { MoreHorizontal, Maximize2, ExternalLink } from 'lucide-react';
import { popOutWidget } from '@/lib/tauri';

export function Widget({ 
  title, 
  children, 
  actions,
  route
}: { 
  title: string; 
  children: React.ReactNode; 
  actions?: React.ReactNode;
  route?: string;
}) {
  const handlePopOut = () => {
    if (route) {
      popOutWidget(title, route);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background border border-border overflow-hidden">
      {/* Header */}
      <div className="panel-header shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3 bg-accent opacity-50"></span>
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {route && (
            <button 
              onClick={handlePopOut}
              className="text-text-tertiary hover:text-text-primary"
              title="Pop out window"
            >
              <ExternalLink size={12} />
            </button>
          )}
          <button className="text-text-tertiary hover:text-text-primary"><Maximize2 size={12} /></button>
          <button className="text-text-tertiary hover:text-text-primary"><MoreHorizontal size={12} /></button>
        </div>
      </div>
      
      {/* Body */}
      <div className="panel-content custom-scrollbar relative flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
}