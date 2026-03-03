import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
  symbols: string[];
  activeSymbol: string;
  addSymbol: (symbol: string) => void;
  removeSymbol: (symbol: string) => void;
  setActiveSymbol: (symbol: string) => void;
}

const DEFAULT_SYMBOLS = ['^NDX', '^GSPC', 'CL=F', 'GC=F', 'EURUSD=X', 'BTC-USD'];

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      symbols: DEFAULT_SYMBOLS,
      activeSymbol: '^NDX',
      addSymbol: (symbol) => set((state) => {
        const upperSymbol = symbol.toUpperCase().trim();
        if (!upperSymbol || state.symbols.includes(upperSymbol)) return state;
        return { symbols: [upperSymbol, ...state.symbols] };
      }),
      removeSymbol: (symbol) => set((state) => {
        const newSymbols = state.symbols.filter((s) => s !== symbol);
        return {
          symbols: newSymbols,
          activeSymbol: state.activeSymbol === symbol ? (newSymbols[0] || '') : state.activeSymbol
        };
      }),
      setActiveSymbol: (symbol) => set({ activeSymbol: symbol.toUpperCase().trim() }),
    }),
    {
      name: 'vantage_watchlist_v1',
    }
  )
);