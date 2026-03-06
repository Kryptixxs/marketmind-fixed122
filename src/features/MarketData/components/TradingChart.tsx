'use client';

import { useEffect, useRef, memo } from 'react';

const TV_SYMBOL_MAP: Record<string, string> = {
  AAPL: 'NASDAQ:AAPL', NVDA: 'NASDAQ:NVDA', MSFT: 'NASDAQ:MSFT', TSLA: 'NASDAQ:TSLA',
  GOOGL: 'NASDAQ:GOOGL', AMZN: 'NASDAQ:AMZN', META: 'NASDAQ:META', AMD: 'NASDAQ:AMD',
  NFLX: 'NASDAQ:NFLX', INTC: 'NASDAQ:INTC', PYPL: 'NASDAQ:PYPL', UBER: 'NYSE:UBER',
  DIS: 'NYSE:DIS', CRM: 'NYSE:CRM', ORCL: 'NYSE:ORCL', ADBE: 'NASDAQ:ADBE',
  CSCO: 'NASDAQ:CSCO', QCOM: 'NASDAQ:QCOM', AVGO: 'NASDAQ:AVGO', TXN: 'NASDAQ:TXN',

  NAS100: 'PEPPERSTONE:NAS100', SPX500: 'FOREXCOM:SPXUSD', US30: 'FOREXCOM:DJI',
  RUSSELL: 'TVC:RUT', DAX40: 'PEPPERSTONE:GER40', FTSE100: 'PEPPERSTONE:UK100',
  NIKKEI: 'TVC:NI225', HSI: 'TVC:HSI', AS51: 'PEPPERSTONE:AUS200',

  GOLD: 'TVC:GOLD', SILVER: 'TVC:SILVER', CRUDE: 'TVC:USOIL', NATGAS: 'PEPPERSTONE:NATGAS',
  COPPER: 'TVC:COPPER', PLATINUM: 'TVC:PLATINUM',

  DXY: 'TVC:DXY', VIX: 'TVC:VIX', US10Y: 'TVC:US10Y', US2Y: 'TVC:US02Y', MOVE: 'TVC:MOVE',

  EURUSD: 'FX:EURUSD', GBPUSD: 'FX:GBPUSD', USDJPY: 'FX:USDJPY',
  AUDUSD: 'FX:AUDUSD', USDCAD: 'FX:USDCAD', USDCHF: 'FX:USDCHF', NZDUSD: 'FX:NZDUSD',

  BTCUSD: 'COINBASE:BTCUSD', ETHUSD: 'COINBASE:ETHUSD', SOLUSD: 'COINBASE:SOLUSD',
  BNBUSD: 'BINANCE:BNBUSDT', XRPUSD: 'BINANCE:XRPUSDT', ADAUSD: 'BINANCE:ADAUSDT',
};

function TradingChartInner({ symbol = 'AAPL', data: _data }: { symbol?: string; data?: ChartData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const tvSymbol = TV_SYMBOL_MAP[symbol] || symbol;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: '15',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#060a13',
      gridColor: 'rgba(30, 41, 59, 0.3)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';

    container.appendChild(wrapper);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ height: '100%', width: '100%' }}
    />
  );
}

export const TradingChart = memo(TradingChartInner);

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}
