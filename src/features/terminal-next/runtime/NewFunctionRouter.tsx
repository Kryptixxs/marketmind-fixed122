'use client';

import React, { useEffect } from 'react';
import { useTerminalOS } from './TerminalOSContext';
import { EmptyFill } from './primitives';
import { WakeUpScreen } from './WakeUpScreen';
import { addTrailStep } from './navigationIntelStore';

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
import { FnNOTES } from './functions/FnNOTES';
import { FnAUD } from './functions/FnAUD';
import { FnSTAT } from './functions/FnSTAT';
import { FnLAT } from './functions/FnLAT';
import { FnCACH } from './functions/FnCACH';
import { FnERR } from './functions/FnERR';
import { FnENT } from './functions/FnENT';
import { FnCOMP } from './functions/FnCOMP';
import { FnPOL } from './functions/FnPOL';
import { FnEnterpriseStub } from './functions/FnEnterpriseStub';
import { FnLINE } from './functions/FnLINE';
import { FnFLD } from './functions/FnFLD';
import { FnMAP } from './functions/FnMAP';
import { FnQLT } from './functions/FnQLT';
import { FnCOLS } from './functions/FnCOLS';
import { FnPIN } from './functions/FnPIN';
import { FnNAV } from './functions/FnNAV';
import { FnNX } from './functions/FnNX';
import { FnCLIP, FnEXP, FnGRABPlus, FnHOT, FnJOB, FnMAC, FnRPT, FnTPL } from './functions/FnWave4Workflow';
import { FnCHAT, FnKILL, FnNOTE, FnSHAR, FnTASK, FnTCA, FnVEN } from './functions/FnWave4CollabExecution';
import { FnCORRPlus, FnESG, FnREG, FnSENT, FnSHCK, FnWEB, FnXAS } from './functions/FnWave4CrossAsset';
import { FnGEO, FnGEOA, FnGEOC, FnGEOE, FnGEOF, FnGEOM, FnGEON, FnGEOR, FnGEOS, FnGEOX } from './functions/FnGeoMapIntel';
import { FnBASK, FnEVID, FnIMP, FnNET, FnOUT, FnPATH, FnRELG, FnRELT, FnSENTR, FnTHEMEGraph } from './functions/FnRelationshipIntel';
import { FnNEX, FnNMAP, FnNQ, FnNREL, FnNTIM, FnRGN, FnRGNC, FnRGNM, FnRGNN, FnRGNR } from './functions/FnRegionNewsIntel';
import { FnBETAX, FnCUST, FnFAC, FnHEDGE, FnREGI, FnSCN, FnSCNR, FnSHOCKG, FnSUPPConcentration, FnXDRV } from './functions/FnSupplyDriverIntel';
import { FnBKMK, FnCITY, FnCMPY, FnCTY, FnFOCUS, FnINDY, FnNAVG, FnRELATE, FnSECT, FnTRAIL } from './functions/FnNavDossierIntel';
import { FnADMIN, FnALRTPlus, FnAPI, FnAUDITPlus, FnCMDK, FnDIAG, FnDOCK, FnFLOAT, FnFOCUSPlus, FnKEYMAP, FnLAYOUT, FnLINK, FnMONPlus, FnNAVTREE, FnOFFLINE, FnPINBAR, FnPOLICYPlus, FnSRC, FnSTATUS } from './functions/FnPlatformOS';

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
  NOTES: FnNOTES as FnC,
  AUD: FnAUD as FnC,
  STAT: FnSTAT as FnC,
  LAT: FnLAT as FnC,
  CACH: FnCACH as FnC,
  ERR: FnERR as FnC,
  ENT: FnENT as FnC,
  COMP: FnCOMP as FnC,
  POL: FnPOL as FnC,
  LINE: FnLINE as FnC,
  FLD: FnFLD as FnC,
  MAP: FnMAP as FnC,
  QLT: FnQLT as FnC,
  MAC: FnMAC as FnC,
  JOB: FnJOB as FnC,
  HOT: FnHOT as FnC,
  TPL: FnTPL as FnC,
  RPT: FnRPT as FnC,
  EXP: FnEXP as FnC,
  'GRAB+': FnGRABPlus as FnC,
  CLIP: FnCLIP as FnC,
  CHAT: FnCHAT as FnC,
  SHAR: FnSHAR as FnC,
  NOTE: FnNOTE as FnC,
  TASK: FnTASK as FnC,
  TCA: FnTCA as FnC,
  VEN: FnVEN as FnC,
  IMP: FnIMP as FnC,
  KILL: FnKILL as FnC,
  REG: FnREG as FnC,
  SHCK: FnSHCK as FnC,
  XAS: FnXAS as FnC,
  'CORR+': FnCORRPlus as FnC,
  SENT: FnSENT as FnC,
  WEB: FnWEB as FnC,
  ESG: FnESG as FnC,
  GEO: FnGEO as FnC,
  'GEO.N': FnGEON as FnC,
  'GEO.C': FnGEOC as FnC,
  'GEO.R': FnGEOR as FnC,
  'GEO.M': FnGEOM as FnC,
  'GEO.X': FnGEOX as FnC,
  'GEO.S': FnGEOS as FnC,
  'GEO.E': FnGEOE as FnC,
  'GEO.F': FnGEOF as FnC,
  'GEO.A': FnGEOA as FnC,
  RELG: FnRELG as FnC,
  RELT: FnRELT as FnC,
  OUT: FnOUT as FnC,
  NET: FnNET as FnC,
  EVID: FnEVID as FnC,
  PATH: FnPATH as FnC,
  BASK: FnBASK as FnC,
  SENTR: FnSENTR as FnC,
  RGN: FnRGN as FnC,
  'RGN.C': FnRGNC as FnC,
  'RGN.N': FnRGNN as FnC,
  'RGN.M': FnRGNM as FnC,
  'RGN.R': FnRGNR as FnC,
  NMAP: FnNMAP as FnC,
  NREL: FnNREL as FnC,
  NEX: FnNEX as FnC,
  NTIM: FnNTIM as FnC,
  NQ: FnNQ as FnC,
  SCN: FnSCN as FnC,
  'SCN.R': FnSCNR as FnC,
  FAC: FnFAC as FnC,
  CUST: FnCUST as FnC,
  XDRV: FnXDRV as FnC,
  'BETA.X': FnBETAX as FnC,
  REGI: FnREGI as FnC,
  HEDGE: FnHEDGE as FnC,
  'SHOCK.G': FnSHOCKG as FnC,
  NAVG: FnNAVG as FnC,
  BKMK: FnBKMK as FnC,
  TRAIL: FnTRAIL as FnC,
  RELATE: FnRELATE as FnC,
  FOCUS: FnFOCUS as FnC,
  CMPY: FnCMPY as FnC,
  SECT: FnSECT as FnC,
  INDY: FnINDY as FnC,
  CTY: FnCTY as FnC,
  CITY: FnCITY as FnC,
  DOCK: FnDOCK as FnC,
  FLOAT: FnFLOAT as FnC,
  LAYOUT: FnLAYOUT as FnC,
  'FOCUS+': FnFOCUSPlus as FnC,
  PINBAR: FnPINBAR as FnC,
  NAVTREE: FnNAVTREE as FnC,
  KEYMAP: FnKEYMAP as FnC,
  CMDK: FnCMDK as FnC,
  LINK: FnLINK as FnC,
  PREF: FnEnterpriseStub as FnC,
  FORMAT: FnEnterpriseStub as FnC,
  AUTH: FnEnterpriseStub as FnC,
  MFA: FnEnterpriseStub as FnC,
  SESS: FnEnterpriseStub as FnC,
  ROLE: FnENT as FnC,
  'HL+': FnEnterpriseStub as FnC,
  RECENT: FnNAVG as FnC,
  SNAP: FnWS as FnC,
  MIG: FnEnterpriseStub as FnC,
  SHARE: FnSHAR as FnC,
  NOTIF: FnEnterpriseStub as FnC,
  ROUTE: FnEnterpriseStub as FnC,
  'ALRT+': FnALRTPlus as FnC,
  'MON+': FnMONPlus as FnC,
  ADMIN: FnADMIN as FnC,
  AUDIT: FnAUDITPlus as FnC,
  POLICY: FnPOLICYPlus as FnC,
  DLP: FnCOMP as FnC,
  SRC: FnSRC as FnC,
  API: FnAPI as FnC,
  WEBHOOK: FnEnterpriseStub as FnC,
  PLUG: FnEnterpriseStub as FnC,
  STATUS: FnSTATUS as FnC,
  DIAG: FnDIAG as FnC,
  OFFLINE: FnOFFLINE as FnC,
  UPDATE: FnEnterpriseStub as FnC,
  HELP: FnEnterpriseStub as FnC,
  TUTOR: FnEnterpriseStub as FnC,
  DOCS: FnEnterpriseStub as FnC,
  LOCK: FnEnterpriseStub as FnC,
  PRIV: FnEnterpriseStub as FnC,
  CONSENT: FnEnterpriseStub as FnC,
  GRIDCFG: FnEnterpriseStub as FnC,
  THEMEPRO: FnTHEMEGraph as FnC,
  SUPP: FnSUPPConcentration as FnC,
  DOC: FnEnterpriseStub as FnC,
  EXTR: FnEnterpriseStub as FnC,
  'COMP+': FnEnterpriseStub as FnC,
  'HIST+': FnEnterpriseStub as FnC,
  GRID: FnEnterpriseStub as FnC,
  THEME: FnTHEMEGraph as FnC,
  COLS: FnCOLS as FnC,
  PIN: FnPIN as FnC,
  ADM: FnEnterpriseStub as FnC,
  CFG: FnEnterpriseStub as FnC,
  UPD: FnEnterpriseStub as FnC,
  SEC: FnEnterpriseStub as FnC,
  NAV: FnNAV as FnC,
  NX: FnNX as FnC,
};

const WAKE_MNEMONICS = new Set(['WAKE', 'HOME', '']);

export function NewFunctionRouter({ panelIdx }: { panelIdx: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;
  const code = p.activeMnemonic.toUpperCase();

  useEffect(() => {
    addTrailStep({
      panelIdx,
      action: 'navigate',
      mnemonic: code,
      security: p.activeSecurity,
      sector: p.marketSector,
      timeframe: p.timeframe,
      selectionCursor: p.selectionCursor,
      scrollPosition: p.scrollPosition,
    });
  }, [panelIdx, code, p.activeSecurity, p.marketSector, p.timeframe, p.selectionCursor, p.scrollPosition]);

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
