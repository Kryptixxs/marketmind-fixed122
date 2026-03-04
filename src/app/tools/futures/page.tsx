'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function FuturesPositionSize() {
  const [accountBalance, setAccountBalance] = useState('');
  const [riskPercent, setRiskPercent] = useState('1');
  const [contractMultiplier, setContractMultiplier] = useState('50'); // e.g. ES
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  const balance = parseFloat(accountBalance) || 0;
  const risk = parseFloat(riskPercent) || 0;
  const mult = parseFloat(contractMultiplier) || 50;
  const entry = parseFloat(entryPrice) || 0;
  const stop = parseFloat(stopLoss) || 0;

  const riskAmount = balance * (risk / 100);
  const tickDistance = entry && stop ? Math.abs(entry - stop) : 0;
  const riskPerContract = tickDistance * mult;
  const numContracts = riskPerContract > 0 ? Math.floor(riskAmount / riskPerContract) : 0;

  return (
    <div className="flex-1 flex flex-col p-6 bg-background overflow-y-auto">
      <div className="max-w-lg w-full mx-auto">
        <Link
          href="/tools"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent text-sm font-medium mb-6"
        >
          <ArrowLeft size={16} />
          Back to Tools
        </Link>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Futures Position Size</h1>
        <p className="text-text-secondary text-sm mb-8">Size your futures position by risk.</p>

        <div className="glass-card p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Account balance ($)</label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              placeholder="50000"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Risk per trade (%)</label>
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              placeholder="1"
              step="0.1"
              min="0.1"
              max="10"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Contract multiplier ($ per point)</label>
            <input
              type="number"
              value={contractMultiplier}
              onChange={(e) => setContractMultiplier(e.target.value)}
              placeholder="50"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
            <p className="text-xs text-text-tertiary mt-1">e.g. 50 for ES, 20 for NQ, 10 for CL</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Entry price</label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="4500"
              step="0.25"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Stop loss price</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="4480"
              step="0.25"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-text-secondary mb-2">Risk amount: <span className="font-bold text-text-primary">${riskAmount.toFixed(2)}</span></p>
            <p className="text-sm text-text-secondary mb-2">Risk per contract: <span className="font-bold text-text-primary">${(riskPerContract || 0).toFixed(2)}</span></p>
            <p className="text-sm font-semibold text-accent">
              Suggested contracts: <span className="text-lg">{numContracts}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
