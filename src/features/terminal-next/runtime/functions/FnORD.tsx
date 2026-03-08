'use client';

import React, { useState } from 'react';
import { DENSITY } from '../../constants/layoutDensity';
import { PanelSubHeader, KeyValueGrid } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';

export function FnORD({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const ticker = panels[panelIdx]!.activeSecurity.split(' ')[0] ?? 'AAPL';
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [qty, setQty] = useState('100');
  const [price, setPrice] = useState('');
  const [orderType, setOrderType] = useState<'MKT' | 'LMT'>('MKT');
  const [submitted, setSubmitted] = useState(false);

  const fieldStyle: React.CSSProperties = { background: '#111', border: `1px solid ${DENSITY.borderColor}`, color: DENSITY.accentAmber, padding: '1px 4px', fontSize: DENSITY.fontSizeDefault, fontFamily: DENSITY.fontFamily, width: '100%', outline: 'none' };

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title={`ORD • Order Ticket — ${ticker}`} />
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar" style={{ padding: DENSITY.pad4, fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeDefault }}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1" style={{ maxWidth: 300 }}>
          <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>SECURITY</span>
          <span style={{ color: DENSITY.textPrimary }}>{ticker}</span>

          <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>SIDE</span>
          <div className="flex gap-1">
            {(['BUY', 'SELL'] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSide(s)} style={{ ...fieldStyle, width: 'auto', color: side === s ? (s === 'BUY' ? DENSITY.accentGreen : DENSITY.accentRed) : DENSITY.textMuted, borderColor: side === s ? (s === 'BUY' ? DENSITY.accentGreen : DENSITY.accentRed) : DENSITY.borderColor }}>{s}</button>
            ))}
          </div>

          <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>QTY</span>
          <input value={qty} onChange={(e) => setQty(e.target.value)} style={fieldStyle} />

          <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>TYPE</span>
          <div className="flex gap-1">
            {(['MKT', 'LMT'] as const).map((t) => (
              <button key={t} type="button" onClick={() => setOrderType(t)} style={{ ...fieldStyle, width: 'auto', color: orderType === t ? DENSITY.accentAmber : DENSITY.textMuted }}>{t}</button>
            ))}
          </div>

          {orderType === 'LMT' && (<>
            <span style={{ color: DENSITY.accentAmber, fontSize: DENSITY.fontSizeTiny }}>LIMIT PX</span>
            <input value={price} onChange={(e) => setPrice(e.target.value)} style={fieldStyle} placeholder="0.00" />
          </>)}
        </div>

        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
          <button type="button" onClick={() => setSubmitted(true)} style={{ background: side === 'BUY' ? '#004400' : '#440000', color: '#fff', padding: '2px 12px', border: `1px solid ${side === 'BUY' ? DENSITY.accentGreen : DENSITY.accentRed}`, fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeDefault }}>
            {side} {qty} {ticker} @ {orderType}
          </button>
          <button type="button" onClick={() => { setSubmitted(false); setQty('100'); setPrice(''); }} style={{ background: '#220000', color: DENSITY.accentRed, padding: '2px 8px', border: `1px solid ${DENSITY.accentRed}`, fontFamily: DENSITY.fontFamily, fontSize: DENSITY.fontSizeTiny, cursor: 'pointer' }} title="Cancel / Kill order">KILL</button>
        </div>

        {submitted && (
          <div style={{ marginTop: 4, color: DENSITY.accentGreen, fontSize: DENSITY.fontSizeTiny }}>ORDER SUBMITTED (SIM) — {side} {qty} {ticker} @ {orderType}{orderType === 'LMT' ? ` ${price}` : ''}</div>
        )}
      </div>
    </div>
  );
}
