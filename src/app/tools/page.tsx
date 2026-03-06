'use client';

import Link from 'next/link';
import { Calculator, DollarSign, BarChart3, Wrench, ArrowRight, Percent, Globe } from 'lucide-react';

const TOOLS = [
  {
    href: '/tools/options',
    icon: Calculator,
    title: 'Options Calculator',
    description: 'Black-Scholes pricing with Greeks visualization. Calculate P&L, breakeven, and risk for any options strategy.',
    color: 'text-accent',
    bg: 'bg-accent/5 border-accent/10 hover:border-accent/30',
  },
  {
    href: '/tools/forex',
    icon: Globe,
    title: 'Forex Position Sizer',
    description: 'Calculate optimal lot size based on account balance, risk percentage, and stop loss distance.',
    color: 'text-cyan',
    bg: 'bg-cyan/5 border-cyan/10 hover:border-cyan/30',
  },
  {
    href: '/tools/futures',
    icon: BarChart3,
    title: 'Futures Risk Calculator',
    description: 'Compute margin requirements, tick values, and position sizing for major futures contracts.',
    color: 'text-warning',
    bg: 'bg-warning/5 border-warning/10 hover:border-warning/30',
  },
];

export default function ToolsPage() {
  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto custom-scrollbar">
      <div className="border-b border-border bg-surface p-3 shrink-0">
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-accent" />
          <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Trading Tools</span>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`${tool.bg} border rounded-lg p-5 group transition-all flex flex-col`}
            >
              <tool.icon size={20} className={`${tool.color} mb-3`} />
              <h3 className="text-xs font-bold text-text-primary mb-1.5 uppercase tracking-wider">{tool.title}</h3>
              <p className="text-[10px] text-text-secondary leading-relaxed flex-1 font-sans">{tool.description}</p>
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border/30">
                <span className={`text-[9px] font-bold uppercase tracking-wider ${tool.color} group-hover:underline`}>Open Tool</span>
                <ArrowRight size={10} className={`${tool.color} group-hover:translate-x-0.5 transition-transform`} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
