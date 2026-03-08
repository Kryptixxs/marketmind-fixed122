'use client';

import React from 'react';
import { DENSITY } from '../constants/layoutDensity';
import { NewPanelFrame } from './NewPanelFrame';
import { NewFunctionRouter } from './NewFunctionRouter';

export function NewPanelGrid() {
  return (
    <div
      className="grid flex-1 min-h-0 overflow-hidden"
      style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 0, background: DENSITY.gridlineColor }}
    >
      {[0, 1, 2, 3].map((idx) => (
        <NewPanelFrame key={idx} panelIdx={idx}>
          <NewFunctionRouter panelIdx={idx} />
        </NewPanelFrame>
      ))}
    </div>
  );
}
