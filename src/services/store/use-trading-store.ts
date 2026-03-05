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
  submitOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>, currentPrice: number) => { success: boolean; error?: string };
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
        const state = get();
        
        // 1. SIMULATE SPREAD/SLIPPAGE (Institutional Reality)
        // Market orders fill slightly worse than the mid-price
        const spread = currentPrice * 0.0002; // 2bps spread
        const fillPrice = orderData.side === 'BUY' ? currentPrice + spread : currentPrice - spread;
        const totalCost = fillPrice * orderData.quantity;

        // 2. BUYING POWER CHECK
        if (orderData.side === 'BUY' && totalCost > state.balance) {
          return { success: false, error: 'Insufficient Buying Power' };
        }

        const id = `ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const timestamp = Date.now();
        
        if (orderData.type === 'MARKET') {
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
            
            if (orderData.side === 'BUY') {
              if (existing && existing.side === 'SHORT') {
                const remaining = existing.quantity - orderData.quantity;
                if (remaining <= 0) delete nextPositions[orderData.symbol];
                else nextPositions[orderData.symbol] = { ...existing, quantity: remaining };
              } else {
                const qty = (existing?.quantity || 0) + orderData.quantity;
                const avg = existing 
                  ? (existing.avgPrice * existing.quantity + fillPrice * orderData.quantity) / qty
                  : fillPrice;
                nextPositions[orderData.symbol] = { symbol: orderData.symbol, side: 'LONG', quantity: qty, avgPrice: avg };
              }
            } else {
              if (existing && existing.side === 'LONG') {
                const remaining = existing.quantity - orderData.quantity;
                if (remaining <= 0) delete nextPositions[orderData.symbol];
                else nextPositions[orderData.symbol] = { ...existing, quantity: remaining };
              } else {
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
              balance: state.balance - (orderData.side === 'BUY' ? totalCost : -totalCost)
            };
          });
          return { success: true };
        } else {
          const newOrder: Order = { ...orderData, id, status: 'PENDING', timestamp };
          set((state) => ({ orders: [newOrder, ...state.orders] }));
          return { success: true };
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