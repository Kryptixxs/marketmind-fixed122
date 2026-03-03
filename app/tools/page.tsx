'use client';

import Link from 'next/link';
import { Calculator, Activity, ArrowUpRight, Percent, DollarSign, Globe } from 'lucide-react';

const TOOLS = [
  {
    title: "Forex Position Size",
    desc: "Calculate lot size based on risk percentage and stop loss distance.",
    icon: Globe,
    href: "/tools/forex",
    color: "text-blue-400",
    bg: "bg-blue-400/10"
  },
  {
    title: "Futures Risk Calc",
    desc: "Determine contract size for ES, NQ, CL and other futures markets.",
    icon: Activity,
    href: "/tools/futures",
    color: "text-orange-400",
    bg: "bg-orange-400/10"
  },
  {
    title: "Options Profit Calc",
    desc: "Visualizer and payoff calculator for basic options strategies.",
    icon: Percent,
    href: "/tools/options",
    color: "text-green-400",
    bg: "bg-green-400/10"
  },
];

export default function ToolsPage() {
  return (
    <div className="flex-1 p-6 bg-background overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 rounded-sm bg-surface border border-border flex items-center justify-center">
             <Calculator size={20} className="text-text-primary" />
           </div>
           <div>
             <h1 className="text-2xl font-bold text-text-primary">Trading Tools</h1>
             <p className="text-sm text-text-secondary">Professional grade calculators for risk management.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool) => (
            <Link 
              key={tool.href}
              href={tool.href}
              className="group bg-surface border border-border p-6 rounded-sm hover:border-accent/50 transition-all hover:bg-surface-highlight"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-sm ${tool.bg} flex items-center justify-center`}>
                  <tool.icon size={20} className={tool.color} />
                </div>
                <ArrowUpRight size={16} className="text-text-tertiary group-hover:text-accent transition-colors" />
              </div>
              
              <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-accent transition-colors">
                {tool.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {tool.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}