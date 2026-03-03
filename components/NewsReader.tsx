'use client';

import { X, ExternalLink, Share2, Bookmark, Tag } from 'lucide-react';
import { NewsItem } from '@/app/actions/fetchNews';
import { useRouter } from 'next/navigation';

interface NewsReaderProps {
  article: NewsItem | null;
  onClose: () => void;
}

export function NewsReader({ article, onClose }: NewsReaderProps) {
  const router = useRouter();
  if (!article) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-surface border-l border-border z-[100] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="panel-header shrink-0 flex justify-between items-center px-4 py-3 h-auto border-b border-border bg-surface-highlight">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Article Reader</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-tertiary uppercase">
            <span>{article.sources.join(' + ')}</span>
            <span>•</span>
            <span>{article.time}</span>
          </div>
          <h2 className="text-xl font-bold text-text-primary leading-tight">
            {article.title}
          </h2>
        </div>

        <div className="flex gap-2">
          {article.entities.map(entity => (
            <button
              key={entity}
              onClick={() => {
                router.push(`/charts?symbol=${entity}`);
                onClose();
              }}
              className="px-2 py-1 bg-accent/10 border border-accent/20 rounded text-[10px] font-bold text-accent hover:bg-accent/20 transition-colors flex items-center gap-1"
            >
              <Tag size={10} /> {entity}
            </button>
          ))}
        </div>

        <div className="text-sm text-text-secondary leading-relaxed space-y-4">
          <p>{article.contentSnippet || "No additional summary available for this story."}</p>
        </div>

        <div className="pt-6 border-t border-border flex flex-col gap-3">
          <a 
            href={article.link} 
            target="_blank" 
            className="w-full py-2.5 bg-accent text-accent-text text-xs font-bold rounded flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <ExternalLink size={14} /> Read Full Story
          </a>
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-surface-highlight border border-border rounded text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-white/5">
              <Bookmark size={12} /> Save
            </button>
            <button className="flex-1 py-2 bg-surface-highlight border border-border rounded text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-white/5">
              <Share2 size={12} /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}