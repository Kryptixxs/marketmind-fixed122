'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { listCatalogMnemonics } from '@/features/terminal-next/mnemonics/catalog';

export function FunctionExplorer({ limit = 36 }: { limit?: number }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const all = listCatalogMnemonics();
    const query = q.trim().toUpperCase();
    if (!query) return all.slice(0, limit);
    return all
      .filter((m) => `${m.code} ${m.title} ${m.keywords.join(' ')} ${m.searchSynonyms.join(' ')}`.toUpperCase().includes(query))
      .slice(0, limit);
  }, [q, limit]);

  return (
    <section className="border border-border bg-surface/30">
      <div className="p-3 border-b border-border flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider">NavTree Explorer</div>
          <div className="text-[11px] text-text-secondary">Discover mnemonics by code, title, and synonyms.</div>
        </div>
        <Link href="/app/terminal" className="text-xs px-2 py-1 border border-accent text-accent hover:bg-accent/10">Open full NavTree in Terminal</Link>
      </div>
      <div className="p-3 border-b border-border">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search mnemonic code/title/keyword"
          className="w-full bg-background border border-border px-2 py-2 text-xs outline-none focus:border-accent"
        />
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface border-b border-border">
            <tr>
              <th className="text-left p-2">Code</th>
              <th className="text-left p-2">Title</th>
              <th className="text-left p-2">Taxonomy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.code} className="border-b border-border/60">
                <td className="p-2 font-bold text-accent">{m.code}</td>
                <td className="p-2">{m.title}</td>
                <td className="p-2 text-text-secondary">{m.category}/{m.functionType}/{m.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <div className="p-4 text-xs text-text-secondary">No matching mnemonics. Try broader terms like “ownership”, “options”, or “country”.</div>}
    </section>
  );
}

