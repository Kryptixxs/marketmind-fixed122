'use server';

import { supabase } from '@/integrations/supabase/client';
import { getSupplyChain } from '@/lib/supply-chain-data';
import type { SupplyChainData, SupplyChainEntry } from '@/lib/supply-chain-data';

export async function fetchSupplyChain(symbol: string): Promise<SupplyChainData | null> {
  const sym = symbol.toUpperCase().replace(/\s+.*$/, '');

  const { data: entityRow } = await supabase
    .from('entities')
    .select('id, symbol, name')
    .eq('symbol', sym)
    .limit(1)
    .maybeSingle();

  if (!entityRow) return getSupplyChain(sym);

  const { data: rels } = await supabase
    .from('relationships')
    .select(`
      relationship_type,
      segment,
      note,
      target:entities!target_entity_id(name)
    `)
    .eq('source_entity_id', entityRow.id);

  const customers: SupplyChainEntry[] = [];
  const suppliers: SupplyChainEntry[] = [];
  const partners: SupplyChainEntry[] = [];

  for (const r of rels ?? []) {
    const targetRel = r.target as { name?: string } | Array<{ name?: string }> | null;
    const target = Array.isArray(targetRel) ? targetRel[0] : targetRel;
    const entry: SupplyChainEntry = {
      name: target?.name ?? 'Unknown',
      type: r.relationship_type as 'customer' | 'supplier' | 'partner',
      segment: r.segment ?? undefined,
      note: r.note ?? undefined,
    };
    if (r.relationship_type === 'customer') customers.push(entry);
    else if (r.relationship_type === 'supplier') suppliers.push(entry);
    else partners.push(entry);
  }

  return {
    symbol: entityRow.symbol ?? sym,
    name: entityRow.name,
    customers,
    suppliers,
    partners,
  };
}
