'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, TrendingDown, Info, Calculator, Activity } from 'lucide-react';

export default function OptionsCalculator() {
  const [type, setType] = useState<'Call' | 'Put'>('Call');
  const [action, setAction] = useState<'Buy' | 'Sell'>('Buy');
  const [strike, setStrike] = useState('150');
  const [premium, setPremium] = useState('2.50');
  const [contracts, setContracts] = useState('1');
  const [underlying, setUnderlying] = useState('150');
  const [iv, setIv] = useState('30');
  const [dte, setDte] = useState('30');

  const s = parseFloat(strike) || 0;
  const p = parseFloat(premium) || 0;
  const c = parseInt(contracts) || 1;
  const u = parseFloat(underlying) || 0;
  const ivVal = (parseFloat(iv) || 30) / 100;
  const dteVal = parseInt(dte) || 30;
  const multiplier = 100;
  const costOrCredit = p * c * multiplier;

  const greeks = useMemo(() => {
    const T = dteVal / 365;
    const sqrtT = Math.sqrt(T);
    if (T <= 0 || s <= 0 || u <= 0 || ivVal <= 0) return { delta: 0, gamma: 0, theta: 0, vega: 0 };

    const d1 = (Math.log(u / s) + (0.05 + ivVal * ivVal / 2) * T) / (ivVal * sqrtT);
    const d2 = d1 - ivVal * sqrtT;

    const cdf = (x: number) => {
      const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
      const pp = 0.3275911;
      const sign = x < 0 ? -1 : 1;
      x = Math.abs(x) / Math.sqrt(2);
      const t = 1.0 / (1.0 + pp * x);
      const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      return 0.5 * (1.0 + sign * y);
    };
    const pdf = (x: number) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);

    let delta = type === 'Call' ? cdf(d1) : cdf(d1) - 1;
    const gamma = pdf(d1) / (u * ivVal * sqrtT);
    let theta = (-(u * pdf(d1) * ivVal) / (2 * sqrtT) - 0.05 * s * Math.exp(-0.05 * T) * (type === 'Call' ? cdf(d2) : cdf(-d2))) / 365;
    const vega = u * pdf(d1) * sqrtT / 100;

    if (action === 'Sell') { delta = -delta; theta = -theta; }

    return { delta, gamma, theta, vega };
  }, [u, s, ivVal, dteVal, type, action]);

  let maxProfit = 'Unlimited', maxLoss = '0', breakeven = 0;
  if (type === 'Call' && action === 'Buy') { maxLoss = `$${costOrCredit.toFixed(2)}`; breakeven = s + p; }
  else if (type === 'Call' && action === 'Sell') { maxProfit = `$${costOrCredit.toFixed(2)}`; maxLoss = 'Unlimited'; breakeven = s + p; }
  else if (type === 'Put' && action === 'Buy') { maxProfit = `$${((s - p) * c * multiplier).toFixed(2)}`; maxLoss = `$${costOrCredit.toFixed(2)}`; breakeven = s - p; }
  else { maxProfit = `$${costOrCredit.toFixed(2)}`; maxLoss = `$${((s - p) * c * multiplier).toFixed(2)}`; breakeven = s - p; }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-y-auto custom-scrollbar">
      <div className="border-b border-border bg-surface p-3 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/tools" className="text-text-tertiary hover:text-text-primary transition-colors">
            <ArrowLeft size={14} />
          </Link>
          <Calculator size={14} className="text-accent" />
          <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Options Calculator</span>
          <div className="badge badge-accent ml-2">Black-Scholes</div>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto w-full space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input Panel */}
          <div className="bg-surface border border-border rounded p-4 space-y-3">
            <div className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary mb-2">Position Setup</div>

            <div className="flex gap-2">
              {(['Buy', 'Sell'] as const).map(a => (
                <button key={a} onClick={() => setAction(a)} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded border transition-colors ${
                  action === a
                    ? a === 'Buy' ? 'bg-positive/10 border-positive/30 text-positive' : 'bg-negative/10 border-negative/30 text-negative'
                    : 'border-border text-text-tertiary hover:text-text-secondary'
                }`}>{a}</button>
              ))}
            </div>

            <div className="flex gap-2">
              {(['Call', 'Put'] as const).map(t => (
                <button key={t} onClick={() => setType(t)} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded border transition-colors ${
                  type === t ? 'bg-accent/10 border-accent/30 text-accent' : 'border-border text-text-tertiary hover:text-text-secondary'
                }`}>{t}</button>
              ))}
            </div>

            {[
              { label: 'Underlying Price ($)', value: underlying, set: setUnderlying, step: '0.01' },
              { label: 'Strike Price ($)', value: strike, set: setStrike, step: '0.01' },
              { label: 'Premium ($)', value: premium, set: setPremium, step: '0.01' },
              { label: 'Contracts', value: contracts, set: setContracts },
              { label: 'Implied Volatility (%)', value: iv, set: setIv, step: '1' },
              { label: 'Days to Expiration', value: dte, set: setDte },
            ].map(f => (
              <div key={f.label}>
                <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider">{f.label}</label>
                <input
                  type="number" step={f.step} value={f.value} onChange={e => f.set(e.target.value)}
                  className="w-full bg-background border border-border rounded px-3 py-1.5 text-xs text-text-primary font-mono mt-1 focus:border-accent outline-none"
                />
              </div>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-4">
            {/* Payoff Profile */}
            <div className="bg-surface border border-border rounded p-4">
              <div className="flex items-center gap-2 mb-3">
                <Info size={12} className="text-cyan" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">Payoff Profile</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: `Net ${action === 'Buy' ? 'Debit' : 'Credit'}`, value: `$${costOrCredit.toFixed(2)}`, color: 'text-text-primary' },
                  { label: 'Breakeven', value: `$${breakeven.toFixed(2)}`, color: 'text-accent' },
                  { label: 'Max Profit', value: maxProfit, color: maxProfit !== 'Unlimited' ? 'text-positive' : 'text-cyan' },
                  { label: 'Max Loss', value: maxLoss, color: maxLoss !== 'Unlimited' ? 'text-negative' : 'text-warning' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center border-b border-border/30 pb-2 last:border-0 last:pb-0">
                    <span className="text-[10px] text-text-secondary">{row.label}</span>
                    <span className={`text-sm font-mono font-bold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Greeks */}
            <div className="bg-surface border border-border rounded p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={12} className="text-warning" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-text-tertiary">Greeks (Black-Scholes)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Delta (Δ)', value: greeks.delta.toFixed(4), desc: 'Price sensitivity', color: 'text-accent' },
                  { label: 'Gamma (Γ)', value: greeks.gamma.toFixed(4), desc: 'Delta acceleration', color: 'text-cyan' },
                  { label: 'Theta (Θ)', value: greeks.theta.toFixed(4), desc: 'Time decay / day', color: 'text-warning' },
                  { label: 'Vega (ν)', value: greeks.vega.toFixed(4), desc: 'Vol sensitivity', color: 'text-positive' },
                ].map(g => (
                  <div key={g.label} className="bg-background border border-border rounded p-2.5">
                    <div className="text-[8px] text-text-tertiary font-bold uppercase">{g.label}</div>
                    <div className={`text-base font-mono font-bold ${g.color} mt-0.5`}>{g.value}</div>
                    <div className="text-[8px] text-text-muted mt-0.5">{g.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategy Summary */}
            <div className="bg-accent/5 border border-accent/15 rounded p-3">
              <span className="text-[10px] text-text-secondary leading-relaxed">
                <span className="font-bold text-accent">Strategy:</span> {action === 'Buy' ? 'Long' : 'Short'} {c} {type} @ ${s.toFixed(2)} strike, {dteVal} DTE, {(ivVal * 100).toFixed(0)}% IV.
                {' '}Delta exposure: {(greeks.delta * c * multiplier).toFixed(1)} shares equivalent.
                {' '}Daily theta burn: ${Math.abs(greeks.theta * c * multiplier).toFixed(2)}.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
