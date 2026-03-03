'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Layers, Tag } from 'lucide-react';
import { fetchNews, NewsItem } from '@/app/actions/fetchNews';
import { useRouter } from 'next/navigation';

export function NewsFeed() {
  const [activeTab, setActiveTab] = useState('General');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadNews = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      let symbols: string[] = [];
      if (tab === 'Watchlist') {
        const saved = localStorage.getItem('vantage_watchlist');
        if (saved) symbols = JSON.parse(saved);
      }
      const data = await fetchNews(tab, symbols);
      setNews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(activeTab); }, [activeTab, loadNews]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mini Tabs */}
      <div className="flex border-b border-border bg-surface overflow-x-auto no-scrollbar">
        {['General', 'Watchlist', 'Stock', 'Crypto', 'Forex'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 py-1.5 px-2 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap
              ${activeTab === tab ? 'text-accent bg-background border-b-2 border-accent' : 'text-text-tertiary hover:text-text-primary'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-text-tertiary" size={16}/></div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {news.map((item) => (
              <div 
                key={item.id} 
                onClick={() => router.push(`/news`)}
                className="p-2 hover:bg-surface-highlight block group transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                   <div className="flex items-center gap-1.5">
                     <span className="text-[8px] font-bold text-accent uppercase">{item.sources[0]}</span>
                     {item.sources.length > 1 && (
                       <span className="text-[8px] text-text-tertiary bg-surface-highlight px-1 rounded flex items-center gap-0.5">
                         <Layers size={7} /> +{item.sources.length - 1}
                       </span>
                     )}
                   </div>
                   <span className="text-[8px] text-text-tertiary">{item.time}</span>
                </div>
                <h4 className="text-[11px] text-text-primary font-medium leading-snug group-hover:text-white line-clamp-2 mb-1">
                  {item.title}
                </h4>
                <div className="flex flex-wrap gap-1">
                  {item.entities.slice(0, 3).map(entity => (
                    <span key={entity} className="text-[7px] font-mono text-text-tertiary border border-border px-1 rounded">
                      {entity}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}