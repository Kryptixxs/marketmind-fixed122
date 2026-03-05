import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Position {
  symbol: string;
  side: 'LONG' | 'SHORT';
  quantity: number;
  avgPrice: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP';
  quantity: number;
  price?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  timestamp: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: number;
}

interface TradingState {
  balance: number;
  initialBalance: number;
  positions: Record<string, Position>;
  orders: Order[];
  trades: Trade[];
  
  // Actions
  submitOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>, currentPrice: number) => void;
  cancelOrder: (id: string) => void;
  resetAccount: () => void;
}

export const useTradingStore = create<TradingState>()(
  persist(
    (set, get) => ({
      balance: 100000,
      initialBalance: 100000,
      positions: {},
      orders: [],
      trades: [],

      submitOrder: (orderData, currentPrice) => {
        const id = `ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const timestamp = Date.now();
        
        // For now, we auto-fill MARKET orders immediately
        if (orderData.type === 'MARKET') {
          const fillPrice = currentPrice;
          const tradeId = `TRD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
          
          const newTrade: Trade = {
            id: tradeId,
            symbol: orderData.symbol,
            side: orderData.side,
            quantity: orderData.quantity,
            price: fillPrice,
            timestamp
          };

          const newOrder: Order = {
            ...orderData,
            id,
            status: 'FILLED',
            timestamp,
            price: fillPrice
          };

          set((state) => {
            const nextPositions = { ...state.positions };
            const existing = nextPositions[orderData.symbol];
            
            // Logic for updating positions
            if (orderData.side === 'BUY') {
              if (existing && existing.side === 'SHORT') {
                // Closing a short
                const remaining = existing.quantity - orderData.quantity;
                if (remaining <= 0) delete nextPositions[orderData.symbol];
                else nextPositions[orderData.symbol] = { ...existing, quantity: remaining };
              } else {
                // Opening or adding to long
                const qty = (existing?.quantity || 0) + orderData.quantity;
                const avg = existing 
                  ? (existing.avgPrice * existing.quantity + fillPrice * orderData.quantity) / qty
                  : fillPrice;
                nextPositions[orderData.symbol] = { symbol: orderData.symbol, side: 'LONG', quantity: qty, avgPrice: avg };
              }
            } else {
              // SELL logic
              if (existing && existing.side === 'LONG') {
                // Closing a long
                const remaining = existing.quantity - orderData.quantity;
                if (remaining <= 0) delete nextPositions[orderData.symbol];
                else nextPositions[orderData.symbol] = { ...existing, quantity: remaining };
              } else {
                // Opening or adding to short
                const qty = (existing?.quantity || 0) + orderData.quantity;
                const avg = existing 
                  ? (existing.avgPrice * existing.quantity + fillPrice * orderData.quantity) / qty
                  : fillPrice;
                nextPositions[orderData.symbol] = { symbol: orderData.symbol, side: 'SHORT', quantity: qty, avgPrice: avg };
              }
            }

            return {
              orders: [newOrder, ...state.orders],
              trades: [newTrade, ...state.trades],
              positions: nextPositions,
              // Deduct/Add to balance (simplified cash account)
              balance: state.balance - (orderData.side === 'BUY' ? fillPrice * orderData.quantity : -fillPrice * orderData.quantity)
            };
          });
        } else {
          // Limit/Stop orders stay pending
          const newOrder: Order = { ...orderData, id, status: 'PENDING', timestamp };
          set((state) => ({ orders: [newOrder, ...state.orders] }));
        }
      },

      cancelOrder: (id) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o)
      })),

      resetAccount: () => set({ balance: 100000, initialBalance: 100000, positions: {}, orders: [], trades: [] })
    }),
    { name: 'vantage-trading-account' }
  )
);