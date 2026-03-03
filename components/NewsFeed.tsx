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
      setNews(data.slice(0, 20));
    } catch (e) {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  if (loading) return <div className="flex h-full items-center justify-center font-mono text-[10px]">[SYSLOG] POLLING_WIRE...</div>;

  return (
    <div className={`flex flex-col h-full overflow-y-auto hide-scrollbar ${isTerminal ? 'p-1' : 'p-2'}`}>
      {news.map((item, i) => {
        if (isTerminal) {
          // TERMINAL MODE: [HH:MM] SOURCE_WIRE: HEADLINE (Pure text density)
          return (
            <a key={i} href={item.link} target="_blank" className="flex items-start py-1 hover:bg-[#111111] hover:text-white cursor-pointer leading-tight">
              <span className="opacity-60 shrink-0 w-20">[{item.time.padStart(6, ' ')}]</span>
              <span className="shrink-0 w-24">{item.source.substring(0, 8).toUpperCase()}_WIRE:</span>
              <span className="truncate ml-2">{item.title.toUpperCase()}</span>
            </a>
          );
        }

        // ARCHITECT MODE: High contrast, elegant spacing
        return (
          <a key={i} href={item.link} target="_blank" className="flex flex-col gap-1.5 py-4 px-3 border-b border-border/50 hover:bg-white/[0.02] transition-all rounded-xl cursor-pointer">
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-bold text-accent tracking-wide">{item.source}</span>
               <span className="text-[10px] text-text-tertiary">{item.time}</span>
             </div>
             <span className="text-[13px] text-text-primary font-medium leading-snug">{item.title}</span>
          </a>
        );
      })}
    </div>
  );
}