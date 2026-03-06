'use client';

import React, { useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { useTunnel, TunnelLayer } from '../context/TunnelContext';
import { useRouter } from 'next/navigation';
import {
  SymbolLayer,
  OptionsLayer,
  NewsLayer,
  FinancialsLayer,
  ArticleLayer,
  EventLayer,
  OrderDetailLayer,
  TapeDetailLayer,
} from './TunnelLayers';

function getLayerLabel(l: TunnelLayer): string {
  switch (l.type) {
    case 'ROOT': return l.label;
    case 'MARKETS': return 'Markets';
    case 'SYMBOL': return l.symbol;
    case 'OPTIONS': return `${l.symbol} Options`;
    case 'NEWS': return l.symbol ? `News — ${l.symbol}` : 'News';
    case 'SCREENER': return 'Screener';
    case 'PORTFOLIO': return 'Portfolio';
    case 'CALENDAR': return 'Calendar';
    case 'QUANT': return 'Quant';
    case 'ALGO': return 'Algo Lab';
    case 'TOOLS': return l.tool ? `Tools — ${l.tool}` : 'Tools';
    case 'EVENT': return l.label;
    case 'ARTICLE': return l.title.slice(0, 40) + (l.title.length > 40 ? '…' : '');
    case 'ORDER': return `${l.symbol} Order`;
    case 'TAPE': return `${l.symbol} Print`;
    default: return 'Layer';
  }
}

function BreadcrumbTrail({ stack, onPopTo }: { stack: TunnelLayer[]; onPopTo: (i: number) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap text-[10px] font-mono">
      <button
        onClick={() => onPopTo(-1)}
        className="text-text-tertiary hover:text-accent transition-colors px-1 py-0.5 rounded"
      >
        ◀
      </button>
      {stack.map((l, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={10} className="text-text-muted shrink-0" />}
          <button
            onClick={() => onPopTo(i)}
            className={`px-1.5 py-0.5 rounded truncate max-w-[140px] ${
              i === stack.length - 1 ? 'bg-accent/20 text-accent font-bold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {getLayerLabel(l)}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

export function TunnelOverlay() {
  const { stack, pop, popTo, clear, depth } = useTunnel();
  const router = useRouter();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (depth === 0) return;
      if (e.key === 'Escape' && e.shiftKey) {
        clear();
        return;
      }
      if (e.key === 'Escape') pop();
      if (e.key === 'Backspace') {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
        e.preventDefault();
        pop();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [clear, depth, pop]);

  if (depth === 0) return null;

  const top = stack[stack.length - 1];

  const handlePopTo = (i: number) => {
    if (i < 0) {
      pop();
      return;
    }
    popTo(i);
  };

  const renderContent = () => {
    switch (top.type) {
      case 'ROOT':
        if (top.path) router.push(top.path);
        return null;
      case 'MARKETS':
        router.push('/dashboard');
        return null;
      case 'SYMBOL':
        return <SymbolLayer symbol={top.symbol} />;
      case 'OPTIONS':
        return <OptionsLayer symbol={top.symbol} />;
      case 'NEWS':
        return <NewsLayer symbol={top.symbol} />;
      case 'SCREENER':
        router.push('/screener');
        return null;
      case 'PORTFOLIO':
        router.push('/portfolio');
        return null;
      case 'CALENDAR':
        router.push('/calendar');
        return null;
      case 'QUANT':
        router.push('/confluences');
        return null;
      case 'ALGO':
        router.push('/algo');
        return null;
      case 'TOOLS':
        if (top.tool === 'financials' && top.symbol) {
          return <FinancialsLayer symbol={top.symbol} />;
        }
        router.push(top.tool ? `/tools/${top.tool}` : '/tools');
        return null;
      case 'ARTICLE':
        return (
          <ArticleLayer
            title={top.title}
            source={top.source}
            time={top.time}
            snippet={top.snippet}
            link={top.link}
          />
        );
      case 'EVENT':
        return <EventLayer label={top.label} detail={top.detail} impact={top.impact} />;
      case 'ORDER':
        return <OrderDetailLayer symbol={top.symbol} side={top.side} qty={top.qty} price={top.price} />;
      case 'TAPE':
        return <TapeDetailLayer symbol={top.symbol} side={top.side} qty={top.qty} price={top.price} time={top.time} />;
      default:
        return (
          <div className="p-6 text-text-secondary text-sm">
            <p className="font-mono">{getLayerLabel(top)}</p>
            <p className="text-[10px] mt-2 text-text-tertiary">Drill-down view — use ⌘K to navigate</p>
          </div>
        );
    }
  };

  const content = renderContent();
  if (content === null) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-background/98 backdrop-blur-sm border-l-2 border-accent/30 shadow-2xl animate-in slide-in-from-right-5 duration-200">
      <div className="h-9 border-b border-border bg-surface flex items-center justify-between px-3 shrink-0">
        <BreadcrumbTrail stack={stack} onPopTo={handlePopTo} />
        <div className="flex items-center gap-1">
          <button
            onClick={clear}
            className="px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-text-tertiary hover:text-accent rounded transition-colors"
            title="Clear all layers (Shift+Esc)"
          >
            clear
          </button>
          <button
            onClick={pop}
            className="p-1.5 text-text-tertiary hover:text-text-primary rounded transition-colors"
            aria-label="Close"
            title="Close one layer (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        {content}
      </div>
    </div>
  );
}
