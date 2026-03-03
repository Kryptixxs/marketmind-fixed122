'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchNews } from '@/app/actions/fetchNews';
import { useSettings } from '@/context/SettingsContext';

interface NewsItem {
  title: string;
  source: string;
  time: string;
  link: string;
}

export function NewsFeed({ activeSymbol }: { activeSymbol?: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const isTerminal = settings.uiTheme === 'terminal';

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNews('General');
      setNews(data.slice(0, 15));
    } catch (e) {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-text-tertiary" size={16}/></div>;

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar p-2">
      {news.map((item, i) => {
        if (isTerminal) {
          // TERMINAL MODE: [14:32] SOURCE > HEADLINE
          return (
            <a key={i} href={item.link} target="_blank" className="flex items-start gap-2 py-1.5 hover:bg-accent hover:text-accent-text cursor-pointer leading-tight group">
              <span className="opacity-70 shrink-0">[{item.time.padStart(6, ' ')}]</span>
              <span className="shrink-0">{item.source.substring(0, 8).toUpperCase().padEnd(8, ' ')} {'>'}</span>
              <span className="truncate group-hover:font-bold">{item.title}</span>
            </a>
          );
        }

        // ARCHITECT MODE: Sleek titles and sources
        return (
          <a key={i} href={item.link} target="_blank" className="flex flex-col gap-1 py-3 px-2 border-b border-border/50 hover:bg-surface-highlight/50 transition-colors">
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-bold text-accent">{item.source}</span>
               <span className="text-[10px] text-text-tertiary">{item.time}</span>
             </div>
             <span className="text-xs text-text-primary leading-snug line-clamp-2">{item.title}</span>
          </a>
        );
      })}
    </div>
  );
}