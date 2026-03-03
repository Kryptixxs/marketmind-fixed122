'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchNews, NewsItem } from '@/app/actions/fetchNews';
import { Loader2, Search, Tag, Layers } from 'lucide-react';
import { NewsReader } from '@/components/NewsReader';
import { useRouter } from 'next/navigation';

export default function NewsPage() {
  const [category, setCategory] = useState('General');
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let symbols: string[] = [];
      if (category === 'Watchlist') {
        const saved = localStorage.getItem('vantage_watchlist');
        if (saved) symbols = JSON.parse(saved);
      }
      const data = await fetchNews(category, symbols);
      setArticles(data);
      setLoading(false);
    };
    load();
  }, [category]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.entities.some(e => e.toLowerCase().includes(q))
    );
  }, [articles, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface p-2 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
          {['General', 'Watchlist', 'Stock', 'Crypto', 'Forex'].map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                category === c 
                  ? 'bg-accent text-accent-text' 
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-highlight'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-background border border-border px-2 py-1 rounded ml-4 max-w-xs w-full">
          <Search size={12} className="text-text-tertiary" />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter wire..."
            className="bg-transparent border-none outline-none text-[10px] text-text-primary w-full"
          />
        </div>
      </div>

      {/* Wire List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 max-w-4xl mx-auto w-full space-y-2">
        {loading ? (
          <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-accent"/></div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center pt-20 text-text-tertiary text-xs">No matching stories found in the wire.</div>
        ) : (
          filteredArticles.map((article) => (
            <div 
              key={article.id} 
              onClick={() => setSelectedArticle(article)}
              className="bg-surface border border-border rounded-sm p-3 hover:border-accent/40 transition-colors group cursor-pointer"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-accent uppercase">{article.sources[0]}</span>
                  {article.sources.length > 1 && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-text-tertiary bg-surface-highlight px-1 rounded">
                      <Layers size={8} /> +{article.sources.length - 1} sources
                    </span>
                  )}
                  <span className="text-[9px] text-text-tertiary">• {article.time}</span>
                </div>
              </div>
              
              <h2 className="text-sm font-bold text-text-primary mb-2 leading-snug group-hover:text-white">
                {article.title}
              </h2>
              
              <div className="flex flex-wrap gap-1.5">
                {article.entities.map(entity => (
                  <span 
                    key={entity}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/charts?symbol=${entity}`);
                    }}
                    className="px-1.5 py-0.5 bg-background border border-border rounded text-[8px] text-text-tertiary font-mono hover:text-accent hover:border-accent/30 transition-colors"
                  >
                    {entity}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reader Pane */}
      <NewsReader 
        article={selectedArticle} 
        onClose={() => setSelectedArticle(null)} 
      />
    </div>
  );
}