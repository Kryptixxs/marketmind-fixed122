'use server';

export async function searchEarningsDate(query: string): Promise<{ date: string; symbol: string } | null> {
  const symbol = query.trim().toUpperCase();
  if (!symbol) return null;

  const d = new Date();
  d.setDate(d.getDate() + ((symbol.charCodeAt(0) || 1) % 21));
  return { date: d.toISOString().slice(0, 10), symbol };
}
