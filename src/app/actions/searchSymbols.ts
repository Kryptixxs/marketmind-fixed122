'use server';

import { searchPrototypeSymbols } from '@/lib/prototype-data';

export async function searchSymbols(query: string) {
  if (!query || query.trim().length < 1) return [];
  return searchPrototypeSymbols(query);
}