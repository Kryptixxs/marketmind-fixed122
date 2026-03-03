'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Info } from 'lucide-react';

export default function OptionsCalculator() {
  const [type, setType] = useState<'Call' | 'Put'>('Call');
  const [action, setAction] = useState<'Buy' | 'Sell'>('Buy');
  const [strike, setStrike] = useState('150');
  const [premium, setPremium] = useState('2.50');
  const [contracts, setContracts] = useState('1');

  const s = parseFloat(strike) || 0;
  const p = parseFloat(premium) || 0;
  const c = parseInt(contracts) || 1;
  const multiplier = 100; // standard equity option multiplier

  const costOrCredit = p * c * multiplier;
  
  // Calculations at expiration
  let maxProfit = 'Unlimited';
  let maxLoss = '0';
  let breakeven = 0;

  if (type === 'Call' && action === 'Buy') {
    maxLoss = `$${costOrCredit.toFixed(2)}`;
    breakeven = s + p;
  } else if (type === 'Call' && action === 'Sell') {
    maxProfit = `$${costOrCredit.toFixed(2)}`;
    maxLoss = 'Unlimited';
    breakeven = s + p;
  } else if (type === 'Put' && action === 'Buy') {
    maxProfit = `$${((s - p) * c * multiplier).toFixed(2)}`;
    maxLoss = `$${costOrCredit.toFixed(2)}`;
    breakeven = s - p;
  } else if (type === 'Put' && action === 'Sell') {
    maxProfit = `$${costOrCredit.toFixed(2)}`;
    maxLoss = `$${((s - p) * c * multiplier).toFixed(2)}`;
    breakeven = s - p;
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-background overflow-y-auto">
      <div className="max-w-3xl w-full mx-auto">
        <Link href="/tools" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent text-sm font-medium mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Tools
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Options Profit Calculator</h1>
        <p className="text-text-secondary text-sm mb-8">Calculate payoff scenarios at expiration for basic options strategies.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border p-6 rounded-sm flex flex-col gap-5">
            <div className="flex gap-2">
              <button onClick={() => setAction('Buy')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-sm border ${action === 'Buy' ? 'bg-positive/10 border-positive text-positive' : 'border-border text-text-tertiary'}`}>Buy</button>
              <button onClick={() => setAction('Sell')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-sm border ${action === 'Sell' ? 'bg-negative/10 border-negative text-negative' : 'border-border text-text-tertiary'}`}>Sell</button>
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => setType('Call')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-sm border ${type === 'Call' ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-tertiary'}`}>Call</button>
              <button onClick={() => setType('Put')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-sm border ${type === 'Put' ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-tertiary'}`}>Put</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Strike Price ($)</label>
              <input type="number" value={strike} onChange={e => setStrike(e.target.value)} className="w-full bg-background border border-border rounded-sm px-4 py-2.5 text-text-primary focus:border-accent outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Premium/Price ($)</label>
              <input type="number" value={premium} onChange={e => setPremium(e.target.value)} className="w-full bg-background border border-border rounded-sm px-4 py-2.5 text-text-primary focus:border-accent outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase mb-2">Number of Contracts</label>
              <input type="number" value={contracts} onChange={e => setContracts(e.target.value)} className="w-full bg-background border border-border rounded-sm px-4 py-2.5 text-text-primary focus:border-accent outline-none font-mono" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-surface border border-border p-6 rounded-sm flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-text-tertiary mb-4">
                <Info size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Payoff Profile</span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                  <span className="text-sm text-text-secondary">Net {action === 'Buy' ? 'Debit' : 'Credit'}</span>
                  <span className="text-lg font-mono font-bold text-text-primary">${costOrCredit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                  <span className="text-sm text-text-secondary">Breakeven Price</span>
                  <span className="text-lg font-mono font-bold text-accent">${breakeven.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                  <span className="text-sm text-text-secondary">Max Profit</span>
                  <span className={`text-lg font-mono font-bold ${maxProfit !== 'Unlimited' ? 'text-positive' : 'text-accent'}`}>{maxProfit}</span>
                </div>
                <div className="flex justify-between items-end pb-2">
                  <span className="text-sm text-text-secondary">Max Loss</span>
                  <span className={`text-lg font-mono font-bold ${maxLoss !== 'Unlimited' ? 'text-negative' : 'text-warning'}`}>{maxLoss}</span>
                </div>
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 p-4 rounded-sm text-xs text-text-secondary leading-relaxed">
              <span className="font-bold text-accent">Strategy:</span> You are {action === 'Buy' ? 'buying' : 'selling'} {c} {type} contract(s) at a strike of ${s.toFixed(2)}. 
              You will {action === 'Buy' ? 'need the underlying asset to move' : 'want the underlying asset to stay'} {type === 'Call' ? 'above' : 'below'} ${breakeven.toFixed(2)} by expiration to be profitable.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}