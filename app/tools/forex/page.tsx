'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ForexPositionSize() {
  const [accountBalance, setAccountBalance] = useState('');
  const [riskPercent, setRiskPercent] = useState('1');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [lotSize, setLotSize] = useState('100000'); // standard lot

  const balance = parseFloat(accountBalance) || 0;
  const risk = parseFloat(riskPercent) || 0;
  const entry = parseFloat(entryPrice) || 0;
  const stop = parseFloat(stopLoss) || 0;
  const lot = parseFloat(lotSize) || 100000;

  const riskAmount = balance * (risk / 100);
  const pipDistance = entry && stop ? Math.abs(entry - stop) : 0;
  const pipValuePerLot = 10; // approx for standard lot, major pairs
  const positionSizeLots = pipDistance > 0 ? riskAmount / (pipDistance * pipValuePerLot) : 0;
  const positionSizeUnits = Math.max(0, Math.min(positionSizeLots * lot, lot * 10));

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
        <h1 className="text-2xl font-bold text-text-primary mb-1">Forex Position Size</h1>
        <p className="text-text-secondary text-sm mb-8">Calculate lot size based on account risk.</p>

        <div className="glass-card p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Account balance ($)</label>
            <input
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
              placeholder="10000"
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
            <label className="block text-sm font-semibold text-text-primary mb-2">Entry price</label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="1.0850"
              step="0.0001"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Stop loss price</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="1.0800"
              step="0.0001"
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">Lot size (units per lot)</label>
            <select
              value={lotSize}
              onChange={(e) => setLotSize(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="1000">Micro (1,000)</option>
              <option value="10000">Mini (10,000)</option>
              <option value="100000">Standard (100,000)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-text-secondary mb-2">Risk amount: <span className="font-bold text-text-primary">${riskAmount.toFixed(2)}</span></p>
            <p className="text-sm text-text-secondary mb-2">Distance (price): <span className="font-bold text-text-primary">{pipDistance.toFixed(4)}</span></p>
            <p className="text-sm font-semibold text-accent">
              Suggested position size: <span className="text-lg">{positionSizeUnits.toFixed(0)}</span> units
              {positionSizeLots > 0 && positionSizeLots < 100 && (
                <span className="block text-text-secondary text-xs mt-1">≈ {(positionSizeUnits / lot).toFixed(2)} lots</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
