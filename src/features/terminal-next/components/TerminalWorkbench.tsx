'use client';

import React from 'react';
import { TerminalProvider } from '../store/TerminalStore';
import { TopTickerBar } from './TopTickerBar';
import { CommandKeyBar } from './CommandKeyBar';
import { CommandInputBar } from './CommandInputBar';
import { DeskStatusStrip } from './DeskStatusStrip';
import { MonitorPanel } from './MonitorPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { RightRailPanel } from './RightRailPanel';
import { CrossAssetMatrixPanel } from './CrossAssetMatrixPanel';
import { FeedPanel } from './FeedPanel';
import { BlotterPanel } from './BlotterPanel';
import { FooterSystemStrip } from './FooterSystemStrip';

function WorkbenchLayout() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      background: '#060a13',
      color: '#e2e8f0',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '10px',
      overflow: 'hidden',
    }}>
      {/* Row 1: Ticker Tape */}
      <TopTickerBar />

      {/* Row 2: Function Keys + Regime */}
      <CommandKeyBar />

      {/* Row 3: Desk Status */}
      <DeskStatusStrip />

      {/* Row 4: Main Grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '220px 1fr 200px',
        gridTemplateRows: '1fr 180px',
        gap: '1px',
        background: '#1e293b',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Left: Quote Monitor */}
        <div style={{ background: '#0c1221', overflow: 'hidden', gridRow: '1 / 3' }}>
          <MonitorPanel />
        </div>

        {/* Center Top: Depth Ladder + Cross Asset */}
        <div style={{
          background: '#0c1221',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr 200px',
          gap: '1px',
        }}>
          <AnalyticsPanel />
          <CrossAssetMatrixPanel />
        </div>

        {/* Right: Risk Rail */}
        <div style={{ background: '#0c1221', overflow: 'hidden', gridRow: '1 / 3' }}>
          <RightRailPanel />
        </div>

        {/* Center Bottom: Blotter + Feed */}
        <div style={{
          background: '#0c1221',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px',
        }}>
          <BlotterPanel />
          <FeedPanel />
        </div>
      </div>

      {/* Row 5: Command Input */}
      <CommandInputBar />

      {/* Row 6: Footer */}
      <FooterSystemStrip />
    </div>
  );
}

export default function TerminalWorkbench() {
  return (
    <TerminalProvider>
      <WorkbenchLayout />
    </TerminalProvider>
  );
}
