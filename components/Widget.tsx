'use client';

import React, { useState } from 'react';
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
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const handlePopOut = () => {
    if (route) {
      popOutWidget(title, route);
    }
    setShowContextMenu(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!route) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  return (
    <div 
      className="flex flex-col h-full w-full bg-background border border-border overflow-hidden relative"
      onContextMenu={handleContextMenu}
      onClick={() => setShowContextMenu(false)}
    >
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

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          className="fixed z-[1000] bg-surface border border-border rounded shadow-xl py-1 min-w-[120px]"
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          <button 
            onClick={handlePopOut}
            className="w-full text-left px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-primary hover:bg-accent/10 hover:text-accent flex items-center gap-2"
          >
            <ExternalLink size={12} />
            Pop Out
          </button>
        </div>
      )}
    </div>
  );
}