import { MoreHorizontal, Maximize2 } from 'lucide-react';

export function Widget({ 
  title, 
  children, 
  actions 
}: { 
  title: string; 
  children: React.ReactNode; 
  actions?: React.ReactNode;
}) {
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
