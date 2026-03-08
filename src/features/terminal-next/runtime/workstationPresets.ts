'use client';

import type { MarketSector } from './panelState';
import type { DockNode, DockLayoutState } from './dockLayoutStore';
import { replacePinItems, type PinItem } from './pinboardStore';

export type WorkstationPreset = 'MARKET-WALL' | 'NEWSROOM' | 'RESEARCH' | 'TRADING';

export interface WorkstationPresetApi {
  panels: Array<{ activeSecurity: string; activeMnemonic: string; marketSector: MarketSector }>;
  focusedPanel: number;
  addPanel: (seedFromPanelIdx?: number) => number;
  navigatePanel: (panelIdx: number, mnemonic: string, security?: string, sector?: MarketSector) => void;
  setFocusedPanel: (idx: number) => void;
  setDockLayout: (next: Partial<DockLayoutState>) => void;
}

const mkTabs = (id: string, tabs: number[], activeTab?: number): DockNode => ({ id, type: 'tabs', tabs, activeTab: activeTab ?? tabs[0] ?? 0 });
const mkSplit = (id: string, direction: 'horizontal' | 'vertical', children: [DockNode, DockNode], sizes: [number, number]): DockNode => ({ id, type: 'split', direction, children, sizes });

function ensurePaneCount(api: WorkstationPresetApi, count: number) {
  while (api.panels.length < count) api.addPanel(Math.max(0, api.focusedPanel));
}

function applyMappings(api: WorkstationPresetApi, mappings: Array<{ idx: number; mnemonic: string; security?: string; sector?: MarketSector }>) {
  mappings.forEach((m) => api.navigatePanel(m.idx, m.mnemonic, m.security, m.sector));
}

function setHeadsUpPins(activeTicker = 'AAPL US Equity') {
  const ts = Date.now();
  const pins: PinItem[] = [
    { id: 'ws-spx', label: 'SPX', value: '5249.21', provenance: 'SIM', targetMnemonic: 'WEI', targetSecurity: 'SPX Index', ts },
    { id: 'ws-vix', label: 'VIX', value: '14.66', provenance: 'SIM', targetMnemonic: 'WEI', targetSecurity: 'VIX Index', ts },
    { id: 'ws-2y', label: 'US2Y', value: '4.71%', provenance: 'SIM', targetMnemonic: 'ECO', targetSecurity: 'USGG2YR Index', ts },
    { id: 'ws-dxy', label: 'DXY', value: '103.47', provenance: 'SIM', targetMnemonic: 'XAS', targetSecurity: 'DXY Curncy', ts },
    { id: 'ws-oil', label: 'OIL', value: '79.40', provenance: 'SIM', targetMnemonic: 'XAS', targetSecurity: 'CL1 Comdty', ts },
    { id: 'ws-act', label: 'ACTIVE', value: activeTicker.split(' ')[0] ?? 'AAPL', provenance: 'SIM', targetMnemonic: 'DES', targetSecurity: activeTicker, ts },
  ];
  replacePinItems(pins);
}

export function applyWorkstationPreset(api: WorkstationPresetApi, preset: WorkstationPreset) {
  if (preset === 'MARKET-WALL') {
    ensurePaneCount(api, 12);
    const leftRoot = mkSplit(
      'mw-root-l',
      'horizontal',
      [
        mkSplit('mw-left-col', 'vertical', [mkTabs('mw-lt', [0, 1], 0), mkTabs('mw-lb', [2], 2)], [58, 42]),
        mkSplit('mw-right-col', 'vertical', [mkTabs('mw-rt', [3, 4], 3), mkTabs('mw-rb', [5], 5)], [55, 45]),
      ],
      [56, 44],
    );
    const rightRoot = mkSplit(
      'mw-root-r',
      'horizontal',
      [
        mkSplit('mw-r-left', 'vertical', [mkTabs('mw-rlt', [6], 6), mkTabs('mw-rlb', [7, 8], 7)], [52, 48]),
        mkSplit('mw-r-right', 'vertical', [mkTabs('mw-rrt', [9], 9), mkTabs('mw-rrb', [10, 11], 10)], [52, 48]),
      ],
      [52, 48],
    );
    api.setDockLayout({
      twoUpMode: true,
      activeWorkspace: 'left',
      highDensityMode: true,
      pinbarVisible: true,
      navtreeVisible: true,
      root: leftRoot,
      secondaryRoot: rightRoot,
    });
    applyMappings(api, [
      { idx: 0, mnemonic: 'WEI', security: 'SPX Index', sector: 'INDEX' },
      { idx: 1, mnemonic: 'GMOV', security: 'SPX Index', sector: 'INDEX' },
      { idx: 2, mnemonic: 'SECH', security: 'SPX Index', sector: 'INDEX' },
      { idx: 3, mnemonic: 'RFCM', security: 'DXY Curncy', sector: 'CURNCY' },
      { idx: 4, mnemonic: 'CRSP', security: 'USGG10YR Index', sector: 'GOVT' },
      { idx: 5, mnemonic: 'CAL24', security: 'US Macro', sector: 'INDEX' },
      { idx: 6, mnemonic: 'TOP', security: 'SPX Index', sector: 'INDEX' },
      { idx: 7, mnemonic: 'NINT', security: 'SPX Index', sector: 'INDEX' },
      { idx: 8, mnemonic: 'GP', security: 'SPX Index', sector: 'INDEX' },
      { idx: 9, mnemonic: 'DES', security: 'AAPL US Equity', sector: 'EQUITY' },
      { idx: 10, mnemonic: 'ALRT+', security: 'SPX Index', sector: 'INDEX' },
      { idx: 11, mnemonic: 'MON+', security: 'SPX Index', sector: 'INDEX' },
    ]);
    api.setFocusedPanel(0);
    setHeadsUpPins('AAPL US Equity');
    return;
  }

  if (preset === 'NEWSROOM') {
    ensurePaneCount(api, 10);
    const leftRoot = mkSplit('nr-left', 'vertical', [mkTabs('nr-lt', [0], 0), mkTabs('nr-lb', [1, 2], 1)], [62, 38]);
    const rightRoot = mkSplit('nr-right', 'vertical', [mkTabs('nr-rt', [3, 4], 3), mkSplit('nr-rb', 'horizontal', [mkTabs('nr-rbl', [5, 6], 5), mkTabs('nr-rbr', [7, 8, 9], 7)], [54, 46])], [48, 52]);
    api.setDockLayout({ twoUpMode: true, activeWorkspace: 'left', highDensityMode: true, root: leftRoot, secondaryRoot: rightRoot, pinbarVisible: true, navtreeVisible: true });
    applyMappings(api, [
      { idx: 0, mnemonic: 'TOP', security: 'SPX Index', sector: 'INDEX' },
      { idx: 1, mnemonic: 'CN', security: 'AAPL US Equity', sector: 'EQUITY' },
      { idx: 2, mnemonic: 'NINT', security: 'SPX Index', sector: 'INDEX' },
      { idx: 3, mnemonic: 'NMAP', security: 'SPX Index', sector: 'INDEX' },
      { idx: 4, mnemonic: 'NREL', security: 'SPX Index', sector: 'INDEX' },
      { idx: 5, mnemonic: 'RGN.N', security: 'US', sector: 'INDEX' },
      { idx: 6, mnemonic: 'NEX', security: 'SPX Index', sector: 'INDEX' },
      { idx: 7, mnemonic: 'ALRT', security: 'SPX Index', sector: 'INDEX' },
      { idx: 8, mnemonic: 'MON+', security: 'SPX Index', sector: 'INDEX' },
      { idx: 9, mnemonic: 'CAL24', security: 'US Macro', sector: 'INDEX' },
    ]);
    api.setFocusedPanel(0);
    setHeadsUpPins('AAPL US Equity');
    return;
  }

  if (preset === 'RESEARCH') {
    ensurePaneCount(api, 8);
    const root = mkSplit(
      'rs-root',
      'horizontal',
      [
        mkSplit('rs-left', 'vertical', [mkTabs('rs-lt', [0, 1], 0), mkTabs('rs-lb', [2], 2)], [55, 45]),
        mkSplit('rs-right', 'vertical', [mkTabs('rs-rt', [3, 4], 3), mkSplit('rs-rb', 'horizontal', [mkTabs('rs-rbl', [5], 5), mkTabs('rs-rbr', [6, 7], 6)], [50, 50])], [56, 44]),
      ],
      [52, 48],
    );
    api.setDockLayout({ twoUpMode: false, activeWorkspace: 'left', highDensityMode: true, root, secondaryRoot: null, pinbarVisible: true, navtreeVisible: true });
    applyMappings(api, [
      { idx: 0, mnemonic: 'DES', security: 'AAPL US Equity', sector: 'EQUITY' },
      { idx: 1, mnemonic: 'FA', security: 'AAPL US Equity', sector: 'EQUITY' },
      { idx: 2, mnemonic: 'EE', security: 'AAPL US Equity', sector: 'EQUITY' },
      { idx: 3, mnemonic: 'OWN', security: 'AAPL US Equity', sector: 'EQUITY' },
      { idx: 4, mnemonic: 'RELS', security: 'AAPL US Equity', sector: 'EQUITY' },
      { idx: 5, mnemonic: 'GP', security: 'AAPL US Equity', sector: 'EQUITY' },
      { idx: 6, mnemonic: 'CN', security: 'AAPL US Equity', sector: 'EQUITY' },
      { idx: 7, mnemonic: 'TOP', security: 'SPX Index', sector: 'INDEX' },
    ]);
    api.setFocusedPanel(0);
    setHeadsUpPins('AAPL US Equity');
    return;
  }

  ensurePaneCount(api, 8);
  const root = mkSplit(
    'tr-root',
    'horizontal',
    [
      mkSplit('tr-left', 'vertical', [mkTabs('tr-lt', [0], 0), mkTabs('tr-lb', [1, 2], 1)], [58, 42]),
      mkSplit('tr-right', 'vertical', [mkTabs('tr-rt', [3, 4], 3), mkSplit('tr-rb', 'horizontal', [mkTabs('tr-rbl', [5], 5), mkTabs('tr-rbr', [6, 7], 6)], [52, 48])], [56, 44]),
    ],
    [52, 48],
  );
  api.setDockLayout({ twoUpMode: false, activeWorkspace: 'left', highDensityMode: true, root, secondaryRoot: null, pinbarVisible: true, navtreeVisible: true });
  applyMappings(api, [
    { idx: 0, mnemonic: 'ORD', security: 'AAPL US Equity', sector: 'EQUITY' },
    { idx: 1, mnemonic: 'BLTR', security: 'AAPL US Equity', sector: 'EQUITY' },
    { idx: 2, mnemonic: 'DEPTH', security: 'AAPL US Equity', sector: 'EQUITY' },
    { idx: 3, mnemonic: 'TCA', security: 'AAPL US Equity', sector: 'EQUITY' },
    { idx: 4, mnemonic: 'ALRT+', security: 'AAPL US Equity', sector: 'EQUITY' },
    { idx: 5, mnemonic: 'MON+', security: 'AAPL US Equity', sector: 'EQUITY' },
    { idx: 6, mnemonic: 'GMOV', security: 'SPX Index', sector: 'INDEX' },
    { idx: 7, mnemonic: 'RFCM', security: 'DXY Curncy', sector: 'CURNCY' },
  ]);
  api.setFocusedPanel(0);
  setHeadsUpPins('AAPL US Equity');
}

