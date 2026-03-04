'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchNews } from '@/app/actions/fetchNews';

interface NewsItem {
  title: string;
  source: string;
  time: string;
  category: string;
  link: string;
}

export function NewsFeed({ activeSymbol }: { activeSymbol?: string }) {
  const [activeTab, setActiveTab] = useState('General');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = useCallback(async (tab: string) => {
    setLoading(true);
    try {
      const data = await fetchNews(tab);
      
      // If we have an active symbol, prioritize news that mentions it
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
      <div className="flex border-b border-border bg-surface">
        {['General', 'Stock', 'Crypto', 'Forex'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider
              ${activeTab === tab ? 'text-accent bg-background border-b-2 border-accent' : 'text-text-tertiary hover:text-text-primary'}
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="animate-spin text-text-tertiary" size={16}/></div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {news.map((item, i) => (
              <a 
                key={i} 
                href={item.link} 
                target="_blank" 
                className="p-2 hover:bg-surface-highlight block group transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                   <span className="text-[9px] font-bold text-accent uppercase">{item.source}</span>
                   <span className="text-[9px] text-text-tertiary">{item.time}</span>
                </div>
                <h4 className="text-xs text-text-primary font-medium leading-snug group-hover:text-white line-clamp-2">
                  {item.title}
                </h4>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}