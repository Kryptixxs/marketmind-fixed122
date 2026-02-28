'use client';

import { useState } from 'react';
import { MiniChart } from '@/components/MiniChart';
import { EconomicCalendarList } from '@/components/EconomicCalendarList';
import { NewsFeed } from '@/components/NewsFeed';

const CHART_GROUPS = {
  Crypto: [
    { title: 'BTC/USD',  symbol: 'BTC-USD'   },
    { title: 'ETH/USD',  symbol: 'ETH-USD'   },
    { title: 'SOL/USD',  symbol: 'SOL-USD'   },
    { title: 'BNB/USD',  symbol: 'BNB-USD'   },
    { title: 'XRP/USD',  symbol: 'XRP-USD'   },
    { title: 'ADA/USD',  symbol: 'ADA-USD'   },
  ],
  Indexes: [
    { title: 'S&P 500',      symbol: '^GSPC'        },
    { title: 'Nasdaq 100',   symbol: '^NDX'         },
    { title: 'Dow Jones',    symbol: '^DJI'         },
    { title: 'Russell 2000', symbol: '^RUT'         },
    { title: 'DXY Index',    symbol: 'DX-Y.NYB'    },
    { title: 'Gold',         symbol: 'GC=F'         },
  ],
  Forex: [
    { title: 'EUR/USD', symbol: 'EURUSD=X' },
    { title: 'GBP/USD', symbol: 'GBPUSD=X' },
    { title: 'USD/JPY', symbol: 'JPY=X'    },
    { title: 'AUD/USD', symbol: 'AUDUSD=X' },
    { title: 'USD/CAD', symbol: 'CAD=X'    },
    { title: 'USD/CHF', symbol: 'CHF=X'    },
  ],
};

type Tab = keyof typeof CHART_GROUPS;
const TABS: Tab[] = ['Indexes', 'Forex', 'Crypto'];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('Crypto');
  const charts = CHART_GROUPS[activeTab];
  const isCrypto = activeTab === 'Crypto';

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: '20px 20px 24px',
      gap: 18, overflow: 'hidden', position: 'relative', zIndex: 1,
    }}>

      {/* Tab selector row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.055)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.11)',
          borderRadius: 999,
          padding: '4px 5px',
          gap: 2,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 2px 12px rgba(0,0,0,0.30)',
        }}>
          {TABS.map(tab => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '7px 18px',
                  borderRadius: 999,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  background: isActive ? 'rgba(255,255,255,0.13)' : 'transparent',
                  color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.42)',
                  border: isActive ? '1px solid rgba(255,255,255,0.20)' : '1px solid transparent',
                  boxShadow: isActive
                    ? 'inset 0 1px 0 rgba(255,255,255,0.26), 0 2px 10px rgba(0,0,0,0.28)'
                    : 'none',
                  transform: isActive ? 'scale(1)' : 'scale(0.96)',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Live indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.03em',
          color: 'rgba(255,255,255,0.35)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-positive)',
            boxShadow: '0 0 6px rgba(48,209,88,0.7)',
            display: 'inline-block',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          Live · 1m refresh
        </div>
      </div>

      {/* Mini charts grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 10,
      }}
        className="sm:grid-cols-3 lg:grid-cols-6"
      >
        {charts.map((chart, i) => (
          <div key={`${activeTab}-${i}`} style={{ animation: `liquid-in 0.4s cubic-bezier(0.25, 1.0, 0.5, 1) both`, animationDelay: `${i * 0.06}s` }}>
            <MiniChart {...chart} isCrypto={isCrypto} />
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, minHeight: 0 }}>
        <EconomicCalendarList />
        <NewsFeed />
      </div>

      <style>{`
        .sm\\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        @media (min-width: 1024px) {
          .lg\\:grid-cols-6 { grid-template-columns: repeat(6, 1fr) !important; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(48,209,88,0.7); }
          50% { opacity: 0.6; box-shadow: 0 0 12px rgba(48,209,88,0.4); }
        }
      `}</style>
    </div>
  );
}
