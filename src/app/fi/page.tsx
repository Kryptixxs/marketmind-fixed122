'use client';

import { useState } from 'react';
import { TerminalPanel } from '@/features/Terminal/components/TerminalPanel';
import { analyzeBond, BondSpec } from '@/lib/engines/bond-pricer';

export default function FixedIncomePage() {
    const [spec, setSpec] = useState<BondSpec>({
        faceValue: 100,
        couponRate: 0.045,
        frequency: 2,
        maturityYears: 10
    });
    const [price, setPrice] = useState(98.5);

    const analytics = analyzeBond(spec, price);

    return (
        <div className="h-full p-3 grid grid-cols-12 gap-3 overflow-y-auto custom-scrollbar">
            <div className="col-span-4">
                <TerminalPanel title="Bond Specification" fnKey="FI">
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase">Coupon Rate (%)</label>
                            <input 
                                type="number" 
                                value={spec.couponRate * 100} 
                                onChange={e => setSpec({...spec, couponRate: parseFloat(e.target.value) / 100})}
                                className="w-full bg-background border border-border p-2 text-sm font-mono"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase">Market Price</label>
                            <input 
                                type="number" 
                                value={price} 
                                onChange={e => setPrice(parseFloat(e.target.value))}
                                className="w-full bg-background border border-border p-2 text-sm font-mono"
                            />
                        </div>
                    </div>
                </TerminalPanel>
            </div>

            <div className="col-span-8">
                <TerminalPanel title="Analytics Output">
                    <div className="grid grid-cols-2 gap-4 p-6">
                        <div className="bg-surface-highlight p-4 border border-border">
                            <div className="text-[10px] text-text-tertiary uppercase font-bold">Yield to Maturity</div>
                            <div className="text-3xl font-black text-accent">{(analytics.ytm * 100).toFixed(4)}%</div>
                        </div>
                        <div className="bg-surface-highlight p-4 border border-border">
                            <div className="text-[10px] text-text-tertiary uppercase font-bold">Modified Duration</div>
                            <div className="text-3xl font-black text-text-primary">{analytics.modifiedDuration.toFixed(4)}</div>
                        </div>
                        <div className="bg-surface-highlight p-4 border border-border">
                            <div className="text-[10px] text-text-tertiary uppercase font-bold">Convexity</div>
                            <div className="text-3xl font-black text-text-primary">{analytics.convexity.toFixed(4)}</div>
                        </div>
                    </div>
                </TerminalPanel>
            </div>
        </div>
    );
}