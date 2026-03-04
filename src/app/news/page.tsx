'use client';

import { useState, useEffect } from 'react';
import { fetchNews } from '@/app/actions/fetchNews';
import { Loader2, ExternalLink, Tag } from 'lucide-react';

export default function NewsPage() {
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

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-4 border-b border-border bg-surface p-2">
        {['General', 'Stock', 'Crypto', 'Forex'].map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider transition-colors ${
              category === c 
                ? 'bg-accent text-accent-text' 
                : 'text-text-tertiary hover:text-text-primary hover:bg-surface-highlight'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 max-w-4xl mx-auto w-full space-y-4">
        {loading ? (
          <div className="flex justify-center pt-20"><Loader2 className="animate-spin text-accent"/></div>
        ) : (
          articles.map((article, i) => (
            <div key={i} className="bg-surface border border-border rounded p-4 hover:border-accent/40 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-accent">{article.source}</span>
                  <span className="text-xs text-text-tertiary">• {article.time}</span>
                </div>
                <a href={article.link} target="_blank" className="text-text-tertiary hover:text-text-primary">
                  <ExternalLink size={14} />
                </a>
              </div>
              
              <h2 className="text-lg font-bold text-text-primary mb-2 leading-snug group-hover:text-white">
                {article.title}
              </h2>
              
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                {article.contentSnippet}
              </p>

              <div className="flex gap-2 mt-4">
                <span className="px-2 py-0.5 rounded-full bg-background border border-border text-[10px] text-text-tertiary font-mono flex items-center gap-1">
                  <Tag size={10} /> {category}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}