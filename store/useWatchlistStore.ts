import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
  symbols: string[]; // These are now instrumentIds (e.g., 'NDX', 'EURUSD')
  activeSymbol: string;
  addSymbol: (id: string) => void;
  removeSymbol: (id: string) => void;
  setActiveSymbol: (id: string) => void;
}

const DEFAULT_INSTRUMENTS = ['NDX', 'SPX', 'CL', 'GC', 'EURUSD', 'BTCUSD'];

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      symbols: DEFAULT_INSTRUMENTS,
      activeSymbol: 'NDX',
      addSymbol: (id) => set((state) => {
        const upperId = id.toUpperCase().trim();
        if (!upperId || state.symbols.includes(upperId)) return state;
        return { symbols: [upperId, ...state.symbols] };
      }),
      removeSymbol: (id) => set((state) => {
        const newSymbols = state.symbols.filter((s) => s !== id);
        return {
          symbols: newSymbols,
          activeSymbol: state.activeSymbol === id ? (newSymbols[0] || '') : state.activeSymbol
        };
      }),
      setActiveSymbol: (id) => set({ activeSymbol: id.toUpperCase().trim() }),
    }),
    {
      name: 'vantage_watchlist_v2',
    }
  )
);