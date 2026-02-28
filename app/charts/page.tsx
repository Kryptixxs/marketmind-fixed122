'use client';

import { useState, useEffect } from 'react';
import { Settings, Maximize, Camera, Search, Clock } from 'lucide-react';
import { TradingChart } from '@/components/TradingChart';

export default function Charts() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [scrollToTime, setScrollToTime] = useState<number | undefined>();

  useEffect(() => {
    // Initial mock data for the chart
    const generateData = () => {
      const data = [];
      let time = Math.floor(Date.now() / 1000) - 86400 * 30; // 30 days ago
      let price = 60000;
      for (let i = 0; i < 1000; i++) {
        const open = price + (Math.random() - 0.5) * 100;
        const high = open + Math.random() * 100;
        const low = open - Math.random() * 100;
        const close = (open + high + low) / 3;
        data.push({ time, open, high, low, close });
        price = close;
        time += 3600; // 1 hour candles
      }
      return data;
    };

    const initialData = generateData();
    setChartData(initialData);
    setCurrentPrice(initialData[initialData.length - 1].close);

    // Connect to Binance WebSocket for live BTCUSDT data
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@kline_1m');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.k) {
        const candle = message.k;
        const newCandle = {
          time: Math.floor(candle.t / 1000),
          open: parseFloat(candle.o),
          high: parseFloat(candle.h),
          low: parseFloat(candle.l),
          close: parseFloat(candle.c),
        };

        setChartData((prevData) => {
          const lastCandle = prevData[prevData.length - 1];
          if (lastCandle && lastCandle.time === newCandle.time) {
            // Update current candle
            return [...prevData.slice(0, -1), newCandle];
          } else {
            // Add new candle
            return [...prevData, newCandle];
          }
        });

        setCurrentPrice(newCandle.close);
        setPriceChange(newCandle.close - parseFloat(candle.o));
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleEventClick = (timestamp: number) => {
    setScrollToTime(timestamp);
  };

  const events = [
    { title: 'CPI Data Release (Past)', time: '2 days ago', timestamp: Math.floor(Date.now() / 1000) - 86400 * 2 },
    { title: 'Fed Rate Decision (Past)', time: '1 week ago', timestamp: Math.floor(Date.now() / 1000) - 86400 * 7 },
    { title: 'NFP Report (Past)', time: '2 weeks ago', timestamp: Math.floor(Date.now() / 1000) - 86400 * 14 },
  ];

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-background">
      {/* Chart Area */}
      <div className="flex-1 flex flex-col border-r border-border">
        {/* Chart Header */}
        <div className="flex items-center justify-between p-2 border-b border-border bg-surface">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-text-secondary" />
              <span className="text-sm font-bold">BTCUSDT</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>1m</span>
              <span>|</span>
              {currentPrice && (
                <>
                  <span className={priceChange && priceChange >= 0 ? 'text-positive' : 'text-negative'}>
                    {currentPrice.toFixed(2)}
                  </span>
                  <span className={priceChange && priceChange >= 0 ? 'text-positive' : 'text-negative'}>
                    {priceChange && priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Chart Body */}
        <div className="flex-1 relative bg-[#1a1a1c] p-4 flex flex-col">
          <div className="text-sm font-medium text-text-secondary mb-2">Bitcoin / TetherUS • Binance</div>
          
          <div className="flex-1 mt-4 relative">
             <TradingChart data={chartData} scrollToTime={scrollToTime} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 flex flex-col bg-surface shrink-0">
        <div className="flex items-center justify-between p-2 border-b border-border">
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors">
              <Settings size={16} />
            </button>
            <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors">
              <Camera size={16} />
            </button>
            <button className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors">
              <Maximize size={16} />
            </button>
          </div>
          <div className="flex bg-background rounded-md p-0.5 border border-border">
            <button className="px-3 py-1 text-xs font-medium rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover">Upcoming</button>
            <button className="px-3 py-1 text-xs font-medium rounded bg-surface-hover text-text-primary">Past</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          <div className="text-xs text-text-secondary mb-2 px-1">Click an event to replay historical price action</div>
          {events.map((event, i) => (
            <div 
              key={i} 
              className="bg-background border border-border rounded-lg p-3 hover:border-accent transition-colors cursor-pointer group"
              onClick={() => handleEventClick(event.timestamp)}
            >
              <div className="flex items-start gap-2">
                <div className="w-4 h-3 mt-1 shrink-0 bg-accent rounded-[2px]" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors">{event.title}</span>
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Clock size={12} />
                    {event.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
