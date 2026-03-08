import { DENSITY } from '../constants/layoutDensity';

export type MarketSector = 'EQUITY' | 'CORP' | 'CURNCY' | 'COMDTY' | 'INDEX' | 'GOVT' | 'MUNI' | 'MTGE';
export type LinkColor = 'red' | 'green' | 'blue' | 'yellow' | null;

export interface HistoryEntry {
  security: string;
  mnemonic: string;
  sector: MarketSector;
  timeframe: string;
  scrollPosition: number;
  selectionIndex: number;
  ts: number;
}

export interface PanelState {
  id: number;
  activeSecurity: string;
  activeMnemonic: string;
  marketSector: MarketSector;
  history: HistoryEntry[];
  historyIdx: number;
  favorites: string[];
  recentSecurities: string[];
  recentMnemonics: string[];
  linkGroup: LinkColor;
  timeframe: string;
  selectionCursor: number;
  scrollPosition: number;
  commandInput: string;
  overlayMode: 'none' | 'menu' | 'help' | 'help-desk' | 'search' | 'inspector';
  helpPressCount: number;
}

export function createDefaultPanel(id: number, mnemonic: string, security = 'AAPL US Equity'): PanelState {
  const entry: HistoryEntry = { security, mnemonic, sector: 'EQUITY', timeframe: '1Y', scrollPosition: 0, selectionIndex: 0, ts: Date.now() };
  return {
    id,
    activeSecurity: security,
    activeMnemonic: mnemonic,
    marketSector: 'EQUITY',
    history: [entry],
    historyIdx: 0,
    favorites: [],
    recentSecurities: ['AAPL US Equity', 'MSFT US Equity', 'NVDA US Equity'],
    recentMnemonics: ['DES', 'GP', 'HP', 'WEI'],
    linkGroup: null,
    timeframe: '1Y',
    selectionCursor: 0,
    scrollPosition: 0,
    commandInput: '',
    overlayMode: 'none',
    helpPressCount: 0,
  };
}

export type PanelAction =
  | { type: 'NAVIGATE'; mnemonic: string; security?: string; sector?: MarketSector; timeframe?: string }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' }
  | { type: 'SET_SECURITY'; security: string; sector?: MarketSector }
  | { type: 'SET_MNEMONIC'; mnemonic: string }
  | { type: 'SET_COMMAND_INPUT'; value: string }
  | { type: 'SET_TIMEFRAME'; tf: string }
  | { type: 'SET_LINK_GROUP'; color: LinkColor }
  | { type: 'SET_OVERLAY'; mode: PanelState['overlayMode'] }
  | { type: 'TOGGLE_FAVORITE'; item: string }
  | { type: 'SET_CURSOR'; row: number }
  | { type: 'SET_SCROLL'; pos: number }
  | { type: 'PRESS_HELP' };

export function panelReducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'NAVIGATE': {
      const sec = action.security ?? state.activeSecurity;
      const sector = action.sector ?? state.marketSector;
      const tf = action.timeframe ?? state.timeframe;
      const entry: HistoryEntry = {
        security: sec, mnemonic: action.mnemonic, sector, timeframe: tf,
        scrollPosition: 0, selectionIndex: 0, ts: Date.now(),
      };
      // Save current state into current history slot before pushing
      const savedHistory = state.history.map((h, i) =>
        i === state.historyIdx
          ? { ...h, scrollPosition: state.scrollPosition, selectionIndex: state.selectionCursor }
          : h
      );
      const trimmed = savedHistory.slice(0, state.historyIdx + 1);
      const history = [...trimmed, entry].slice(-40);
      const recent = [sec, ...state.recentSecurities.filter((s) => s !== sec)].slice(0, 10);
      const recentMn = [action.mnemonic, ...state.recentMnemonics.filter((m) => m !== action.mnemonic)].slice(0, 10);
      return {
        ...state,
        activeSecurity: sec,
        activeMnemonic: action.mnemonic,
        marketSector: sector,
        timeframe: tf,
        history,
        historyIdx: history.length - 1,
        recentSecurities: recent,
        recentMnemonics: recentMn,
        overlayMode: 'none',
        helpPressCount: 0,
        commandInput: '',
        scrollPosition: 0,
        selectionCursor: 0,
      };
    }
    case 'GO_BACK': {
      if (state.historyIdx <= 0) return state;
      // Save current scroll/selection before going back
      const savedHistory = state.history.map((h, i) =>
        i === state.historyIdx
          ? { ...h, scrollPosition: state.scrollPosition, selectionIndex: state.selectionCursor }
          : h
      );
      const idx = state.historyIdx - 1;
      const entry = savedHistory[idx]!;
      return {
        ...state,
        history: savedHistory,
        activeSecurity: entry.security,
        activeMnemonic: entry.mnemonic,
        marketSector: entry.sector,
        timeframe: entry.timeframe,
        scrollPosition: entry.scrollPosition,
        selectionCursor: entry.selectionIndex,
        historyIdx: idx,
      };
    }
    case 'GO_FORWARD': {
      if (state.historyIdx >= state.history.length - 1) return state;
      const savedHistory = state.history.map((h, i) =>
        i === state.historyIdx
          ? { ...h, scrollPosition: state.scrollPosition, selectionIndex: state.selectionCursor }
          : h
      );
      const idx = state.historyIdx + 1;
      const entry = savedHistory[idx]!;
      return {
        ...state,
        history: savedHistory,
        activeSecurity: entry.security,
        activeMnemonic: entry.mnemonic,
        marketSector: entry.sector,
        timeframe: entry.timeframe,
        scrollPosition: entry.scrollPosition,
        selectionCursor: entry.selectionIndex,
        historyIdx: idx,
      };
    }
    case 'SET_SECURITY': {
      const sector = action.sector ?? state.marketSector;
      const entry: HistoryEntry = {
        security: action.security, mnemonic: state.activeMnemonic, sector,
        timeframe: state.timeframe, scrollPosition: 0, selectionIndex: 0, ts: Date.now(),
      };
      const trimmed = state.history.slice(0, state.historyIdx + 1);
      const history = [...trimmed, entry].slice(-40);
      return { ...state, activeSecurity: action.security, marketSector: sector, history, historyIdx: history.length - 1, scrollPosition: 0, selectionCursor: 0 };
    }
    case 'SET_MNEMONIC': return { ...state, activeMnemonic: action.mnemonic };
    case 'SET_COMMAND_INPUT': return { ...state, commandInput: action.value };
    case 'SET_TIMEFRAME': return { ...state, timeframe: action.tf };
    case 'SET_LINK_GROUP': return { ...state, linkGroup: action.color };
    case 'SET_OVERLAY': return { ...state, overlayMode: action.mode, helpPressCount: action.mode === 'none' ? 0 : state.helpPressCount };
    case 'TOGGLE_FAVORITE': {
      const has = state.favorites.includes(action.item);
      return { ...state, favorites: has ? state.favorites.filter((f) => f !== action.item) : [...state.favorites, action.item].slice(0, 20) };
    }
    case 'SET_CURSOR': return { ...state, selectionCursor: action.row };
    case 'SET_SCROLL': return { ...state, scrollPosition: action.pos };
    case 'PRESS_HELP': {
      const count = state.helpPressCount + 1;
      if (count === 1) return { ...state, overlayMode: 'help', helpPressCount: count };
      if (count >= 2) return { ...state, overlayMode: 'help-desk', helpPressCount: count };
      return state;
    }
    default: return state;
  }
}
