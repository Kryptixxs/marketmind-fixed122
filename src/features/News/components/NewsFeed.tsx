'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { fetchNews } from '@/app/actions/fetchNews';

interface NewsItem {
  id?: string;
  title: string;
  source: string;
  time: string;
  category: string;
  link: string;
  contentSnippet?: string;
}

export function NewsFeed({ activeSymbol, onSelectArticle }: { activeSymbol?: string; onSelectArticle?: (item: NewsItem) => void }) {
  const [activeTab, setActiveTab] = useState('General');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      const data = await fetchNews(tab, activeSymbol);
      let filtered = data;
      if (activeSymbol) {
        const sym = activeSymbol.split('-')[0].split('=')[0].replace('^', '');
        filtered = [
          ...data.filter(item => item.title.toUpperCase().includes(sym)),
          ...data.filter(item => !item.title.toUpperCase().includes(sym))
        ].slice(0, 20);
      }
      setNews(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeSymbol]);

  useEffect(() => { loadNews(activeTab); }, [activeTab, loadNews]);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex border-b border-border bg-surface shrink-0">
        {['General', 'Stock', 'Crypto', 'Forex'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? 'text-accent border-b border-accent bg-accent/5'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin text-text-tertiary" size={14} />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border/50">
            {news.map((item, i) => (
              <div
                key={i}
                className="px-3 py-2 hover:bg-surface-highlight block group transition-colors border-b border-border/50"
              >
                <div className="flex justify-between items-center mb-1 gap-2">
                  <span className="text-[8px] font-bold text-accent uppercase tracking-wider truncate">{item.source}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[8px] text-text-tertiary">{item.time}</span>
                    {item.link && item.link !== '#' && (
                      <a href={item.link} target="_blank" className="text-text-tertiary hover:text-accent">
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onSelectArticle?.(item)}
                  className="text-left w-full"
                >
                <h4 className="text-[10px] text-text-primary font-medium leading-snug group-hover:text-accent transition-colors line-clamp-2">
                  {item.title}
                </h4>
                {item.contentSnippet && (
                  <p className="text-[9px] text-text-tertiary mt-1 line-clamp-2">{item.contentSnippet}</p>
                )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
