export interface SeededRandom {
  next: () => number;
  float: (min: number, max: number) => number;
  int: (min: number, max: number) => number;
  pick: <T>(arr: readonly T[]) => T;
}

export function hashSymbol(symbol: string): number {
  let hash = 2166136261;
  const normalized = symbol.trim().toUpperCase();
  for (let i = 0; i < normalized.length; i += 1) {
    hash ^= normalized.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
}

export function createSeededRandom(seed: number): SeededRandom {
  let state = seed || 1;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  return {
    next,
    float: (min, max) => min + (max - min) * next(),
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  };
}

export function toDateISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export function pseudoUuid(seed: number, index: number): string {
  const hex = (n: number, len: number) => n.toString(16).padStart(len, '0').slice(0, len);
  const a = hex((seed * 2654435761 + index * 17) >>> 0, 8);
  const b = hex((seed * 2246822519 + index * 31) >>> 0, 4);
  const c = `4${hex((seed * 3266489917 + index * 73) >>> 0, 3)}`;
  const d = `${((8 + (seed + index) % 4) & 0xf).toString(16)}${hex((seed * 668265263 + index * 97) >>> 0, 3)}`;
  const e = hex((seed * 1597334677 + index * 109) >>> 0, 12);
  return `${a}-${b}-${c}-${d}-${e}`;
}
