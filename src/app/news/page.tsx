'use client';

import { useState, useEffect } from 'react';
import { fetchNews } from '@/app/actions/fetchNews';
import { Loader2, ExternalLink, Radio, Clock, Newspaper } from 'lucide-react';
import { useTunnel } from '@/features/Terminal/context/TunnelContext';

const CATEGORIES = ['General', 'Stock', 'Crypto', 'Forex'];

export default function NewsPage() {
  const { push } = useTunnel();
  const [category, setCategory] = useState('General');
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchNews(category).then(data => {
      setArticles(data);
      setLoading(false);
    });
  }, [category]);

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="h-10 border-b border-border bg-surface flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-cyan" />
          <span className="text-xs font-bold uppercase tracking-widest text-text-primary">Intelligence Wire</span>
        </div>

        <div className="h-5 w-px bg-border" />

        <div className="flex items-center gap-1 bg-background border border-border rounded overflow-hidden">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors ${
                category === c
                  ? 'bg-accent text-white'
                  : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-highlight'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <div className="flex items-center gap-1.5 text-[9px] text-text-tertiary">
          <Radio size={10} className="text-positive" />
          <span className="font-bold uppercase tracking-wider">Live Feed</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="animate-spin text-accent" size={24} />
            <span className="text-[10px] text-text-tertiary uppercase tracking-widest font-bold">Loading Intelligence...</span>
          </div>
        ) : (
          <div className="p-4 max-w-6xl mx-auto">
            {/* Featured Article */}
            {featured && (
              <button
                onClick={() =>
                  push({
                    type: 'ARTICLE',
                    id: `featured-${featured.source}-${featured.time}`,
                    title: featured.title,
                    label: featured.title,
                    source: featured.source,
                    time: featured.time,
                    snippet: featured.contentSnippet,
                    link: featured.link,
                  })
                }
                className="w-full text-left block bg-surface border border-border rounded-lg p-6 mb-4 hover:border-accent/30 transition-all group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="badge badge-accent">{featured.source}</span>
                  <span className="text-[10px] text-text-tertiary flex items-center gap-1">
                    <Clock size={9} /> {featured.time}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-text-primary leading-tight mb-2 group-hover:text-accent transition-colors">
                  {featured.title}
                </h2>
                {featured.contentSnippet && (
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 font-sans">
                    {featured.contentSnippet}
                  </p>
                )}
              </button>
            )}

            {/* Article Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rest.map((article: any, i: number) => (
                <button
                  key={i}
                  onClick={() =>
                    push({
                      type: 'ARTICLE',
                      id: `news-${article.source}-${article.time}-${i}`,
                      title: article.title,
                      label: article.title,
                      source: article.source,
                      time: article.time,
                      snippet: article.contentSnippet,
                      link: article.link,
                    })
                  }
                  className="text-left bg-surface border border-border rounded-lg p-4 hover:border-accent/30 transition-all group flex flex-col"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-accent uppercase">{article.source}</span>
                    <span className="text-[9px] text-text-tertiary">{article.time}</span>
                  </div>
                  <h3 className="text-xs font-bold text-text-primary leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-3 flex-1">
                    {article.title}
                  </h3>
                  {article.contentSnippet && (
                    <p className="text-[10px] text-text-tertiary line-clamp-2 font-sans leading-relaxed">
                      {article.contentSnippet}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50 text-text-tertiary group-hover:text-accent transition-colors">
                    <ExternalLink size={9} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Read More</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
