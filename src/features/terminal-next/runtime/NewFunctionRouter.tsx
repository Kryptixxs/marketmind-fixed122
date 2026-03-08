'use client';

import React from 'react';
import { useTerminalOS } from './TerminalOSContext';
import { EmptyFill } from './primitives';
import { WakeUpScreen } from './WakeUpScreen';

import { FnWEI } from './functions/FnWEI';
import { FnTOP, FnCN } from './functions/FnTOP';
import { FnDES } from './functions/FnDES';
import { FnHP } from './functions/FnHP';
import { FnOWN } from './functions/FnOWN';
import { FnRELS } from './functions/FnRELS';
import { FnMGMT } from './functions/FnMGMT';
import { FnDVD } from './functions/FnDVD';
import { FnFA } from './functions/FnFA';
import { FnECO } from './functions/FnECO';
import { FnGP, FnGIP } from './functions/FnGP';
import { FnALRT } from './functions/FnALRT';
import { FnBLTR } from './functions/FnBLTR';
import { FnIB } from './functions/FnIB';
import { FnEVT } from './functions/FnEVT';
import { FnORD } from './functions/FnORD';
import { FnFXC } from './functions/FnFXC';
import { FnIMAP } from './functions/FnIMAP';
import { AnalyticsMonitor } from '../components/visualizations/AnalyticsMonitor';
import { FnMON, FnWS } from './functions/FnMON';
import { FnRV } from './functions/FnRV';
import { FnGC } from './functions/FnGC';
import { FnMKT } from './functions/FnMKT';

type FnC = React.ComponentType<{ panelIdx: number }>;

const FUNCTION_MAP: Record<string, FnC> = {
  WEI: FnWEI,
  TOP: FnTOP,
  N: FnTOP,
  NEWS: FnTOP,
  CN: FnCN,
  DES: FnDES,
  HP: FnHP,
  DVD: FnDVD,
  MGMT: FnMGMT,
  OWN: FnOWN,
  RELS: FnRELS,
  FA: FnFA,
  ECO: FnECO as FnC,
  GP: FnGP,
  GIP: FnGIP,
  ALRT: FnALRT as FnC,
  BLTR: FnBLTR as FnC,
  IB: FnIB as FnC,
  EVT: FnEVT,
  ORD: FnORD,
  TRADE: FnORD,
  FXC: FnFXC as FnC,
  WCR: FnFXC as FnC,
  IMAP: FnIMAP as FnC,
  ANR: AnalyticsMonitor as FnC,
  MON: FnMON,
  WS: FnWS,
  WSMGR: FnWS,
  RV: FnRV,
  GC: FnGC as FnC,
  MKT: FnMKT as FnC,
};

const WAKE_MNEMONICS = new Set(['WAKE', 'HOME', '']);

export function NewFunctionRouter({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const code = p.activeMnemonic.toUpperCase();

  if (WAKE_MNEMONICS.has(code)) {
    return <WakeUpScreen panelIdx={panelIdx} />;
  }

  const Fn = FUNCTION_MAP[code];

  if (!Fn) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <WakeUpScreen panelIdx={panelIdx} />
      </div>
    );
  }

  return <Fn panelIdx={panelIdx} />;
}
