'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Loader2, Newspaper, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchNews } from '@/app/actions/fetchNews';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  time: string;
  category: string;
  imageUrl: string | null;
  contentSnippet: string;
}

const TABS = ['General', 'Stock', 'Crypto', 'Forex'];

const SOURCE_COLORS: Record<string, string> = {
  'CoinTelegraph':  '#FF6B35',
  'CoinDesk':       '#1A73E8',
  'Decrypt':        '#9333EA',
  'CryptoNews':     '#E91E63',
  'CNBC':           '#0066CC',
  'CNBC Markets':   '#0066CC',
  'MarketWatch':    '#CE0000',
  'Financial Times':'#F25022',
  'Investopedia':   '#1B4F72',
  'FXStreet':       '#00A99D',
  'ForexLive':      '#1E88E5',
  'DailyFX':        '#F4A261',
};

export function NewsFeed() {
  const [activeTab, setActiveTab] = useState('General');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = useCallback(async (tab: string, isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const data = await fetchNews(tab);
      if (data?.length > 0) {
        setNews(data);
      } else {
        setNews([]);
        setError('No news available right now. RSS feeds may be temporarily unavailable.');
      }
    } catch {
      setError('Failed to load news. Please try again.');
      setNews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadNews(activeTab); }, [activeTab, loadNews]);

  const handleTab = (tab: string) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setNews([]);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.042)',
        backdropFilter: 'blur(48px) saturate(160%)',
        WebkitBackdropFilter: 'blur(48px) saturate(160%)',
        borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), inset 1px 0 0 rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.40)',
        position: 'relative',
      }}
    >
      {/* Lensing overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 24, pointerEvents: 'none',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 40%, transparent 60%)',
        zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(255,255,255,0.025)',
        backdropFilter: 'blur(20px)',
        position: 'relative', zIndex: 1,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'rgba(10,132,255,0.15)',
              border: '1px solid rgba(10,132,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
              <Newspaper size={15} color="var(--color-accent)" />
            </div>
            <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.92)' }}>
              Market News
            </span>
          </div>
          <button
            onClick={() => loadNews(activeTab, true)}
            disabled={refreshing || loading}
            style={{
              width: 30, height: 30, borderRadius: 999,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              color: refreshing ? 'var(--color-accent)' : 'rgba(255,255,255,0.40)',
              opacity: (refreshing || loading) ? 0.5 : 1,
              transition: 'all 0.2s',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.80)')}
            onMouseLeave={e => (e.currentTarget.style.color = refreshing ? 'var(--color-accent)' : 'rgba(255,255,255,0.40)')}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Tab selector */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.25)',
          padding: '4px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.08)',
          gap: 2,
        }}>
          {TABS.map(tab => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => handleTab(tab)}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 999,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  cursor: 'pointer',
                  transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                  background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.40)',
                  border: isActive ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                  boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.22), 0 2px 8px rgba(0,0,0,0.25)' : 'none',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed */}
      <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 10 }}>
            <Loader2 size={28} color="var(--color-accent)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              Loading {activeTab} news…
            </span>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 10, padding: '0 24px' }}>
            <AlertCircle size={32} color="var(--color-negative)" style={{ opacity: 0.5 }} />
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.40)', textAlign: 'center', lineHeight: 1.5 }}>{error}</p>
            <button
              onClick={() => loadNews(activeTab)}
              className="btn-glass"
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
            >
              Try Again
            </button>
          </div>
        ) : news.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {news.map((item, i) => {
              const sourceColor = SOURCE_COLORS[item.source] || 'var(--color-accent)';
              const hasRealSnippet = item.contentSnippet &&
                item.contentSnippet.toLowerCase().trim() !== item.title.toLowerCase().trim() &&
                item.contentSnippet.length > 30;

              return (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.042)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
                    backdropFilter: 'blur(12px)',
                    animation: `liquid-fade 0.3s ease both`,
                    animationDelay: `${i * 0.04}s`,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.background = 'rgba(255,255,255,0.075)';
                    el.style.borderColor = 'rgba(255,255,255,0.14)';
                    el.style.transform = 'translateY(-1px)';
                    el.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.14), 0 6px 24px rgba(0,0,0,0.35)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.background = 'rgba(255,255,255,0.042)';
                    el.style.borderColor = 'rgba(255,255,255,0.07)';
                    el.style.transform = '';
                    el.style.boxShadow = '';
                  }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* Source + time */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.05em',
                          textTransform: 'uppercase', color: sourceColor,
                        }}>
                          {item.source}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.20)', fontSize: '0.625rem' }}>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
                          <Clock size={9} />
                          {item.time}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        letterSpacing: '-0.015em',
                        color: 'rgba(255,255,255,0.88)',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                      }}>
                        {item.title}
                      </h3>

                      {/* Description */}
                      {hasRealSnippet && (
                        <p style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.42)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          margin: 0,
                          marginTop: 2,
                        }}>
                          {item.contentSnippet}
                        </p>
                      )}
                    </div>

                    {/* Thumbnail */}
                    {item.imageUrl && (
                      <div style={{
                        width: 68, height: 68,
                        borderRadius: 10,
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.08)',
                        alignSelf: 'flex-start',
                      }}>
                        <img
                          src={item.imageUrl}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: 10, paddingTop: 8,
                    borderTop: '1px solid rgba(255,255,255,0.055)',
                  }}>
                    <span style={{
                      fontSize: '0.5625rem', fontWeight: 700, letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 999,
                      padding: '2px 8px',
                      color: 'rgba(255,255,255,0.30)',
                    }}>
                      {item.category}
                    </span>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: '0.6875rem', fontWeight: 600,
                      color: 'var(--color-accent)',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                    }}
                      className="news-read-link"
                    >
                      Read <ExternalLink size={11} />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 10 }}>
            <Newspaper size={36} style={{ opacity: 0.12 }} />
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.30)', fontWeight: 500 }}>
              No news available for this category.
            </p>
          </div>
        )}
      </div>

      <style>{`
        a:hover .news-read-link { opacity: 1 !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
