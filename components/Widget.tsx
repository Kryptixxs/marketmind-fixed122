'use client';

import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Maximize2, ExternalLink, X, Download, RotateCcw, Minimize2 } from 'lucide-react';
import { popOutWidget } from '@/lib/tauri';
import { cn, exportToCSV } from '@/lib/utils';

export function Widget({ 
  title, 
  children, 
  actions,
  route,
  data // Optional data for CSV export
}: { 
  title: string; 
  children: React.ReactNode; 
  actions?: React.ReactNode;
  route?: string;
  data?: any[];
}) {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  // Handle ESC to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  if (isClosed) return null;

  const handlePopOut = () => {
    if (route) {
      popOutWidget(title, route);
    }
    setShowContextMenu(false);
    setShowMoreMenu(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!route) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleExport = () => {
    if (data) {
      exportToCSV(data, title.toLowerCase().replace(/\s+/g, '_'));
    }
    setShowMoreMenu(false);
  };

  return (
    <div 
      className={cn(
        "flex flex-col bg-background border border-border overflow-hidden relative transition-all duration-200",
        isFullscreen ? "fixed inset-0 z-[100] m-0 rounded-none" : "h-full w-full"
      )}
      onContextMenu={handleContextMenu}
      onClick={() => {
        setShowContextMenu(false);
        setShowMoreMenu(false);
      }}
    >
      {/* Header */}
      <div className="panel-header shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3 bg-accent opacity-50"></span>
          <span className="truncate max-w-[150px]">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {route && (
            <button 
              onClick={(e) => { e.stopPropagation(); handlePopOut(); }}
              className="text-text-tertiary hover:text-text-primary hidden md:block"
              title="Pop out window"
            >
              <ExternalLink size={12} />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(!isFullscreen); }}
            className="text-text-tertiary hover:text-text-primary"
            title={isFullscreen ? "Minimize" : "Maximize"}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
              className="text-text-tertiary hover:text-text-primary"
            >
              <MoreHorizontal size={12} />
            </button>
            
            {/* More Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute top-full right-0 mt-1 w-40 bg-surface border border-border rounded shadow-2xl py-1 z-[110] animate-in fade-in zoom-in-95 duration-100">
                {data && (
                  <button onClick={handleExport} className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-primary hover:bg-accent/10 hover:text-accent flex items-center gap-2">
                    <Download size={12} /> Export CSV
                  </button>
                )}
                {route && (
                  <button onClick={handlePopOut} className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-primary hover:bg-accent/10 hover:text-accent flex items-center gap-2">
                    <ExternalLink size={12} /> Pop Out
                  </button>
                )}
                <button onClick={() => window.location.reload()} className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-primary hover:bg-accent/10 hover:text-accent flex items-center gap-2">
                  <RotateCcw size={12} /> Reset Widget
                </button>
                <button onClick={() => setIsClosed(true)} className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-negative hover:bg-negative/10 flex items-center gap-2 border-t border-border mt-1">
                  <X size={12} /> Close Widget
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="panel-content custom-scrollbar relative flex-1 flex flex-col min-h-0">
        {children}
      </div>

      {/* Context Menu (Right Click) */}
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