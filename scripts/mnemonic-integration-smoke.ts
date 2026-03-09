import * as catalog from '../src/features/terminal-next/mnemonics/catalog';
import * as fabric from '../src/features/terminal-next/services/dataFabric';
import { resolveLink } from '../src/features/terminal-next/runtime/entities/linkResolver';
import { makeFunction } from '../src/features/terminal-next/runtime/entities/types';
import { MNEMONIC_DEFS } from '../src/features/terminal-next/runtime/MnemonicRegistry';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

function seeded(seed = 1337): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function sampleDeterministic<T>(arr: T[], count: number, rnd: () => number): T[] {
  if (count >= arr.length) return [...arr];
  const out: T[] = [];
  const used = new Set<number>();
  while (out.length < count) {
    const idx = Math.floor(rnd() * arr.length);
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(arr[idx]!);
  }
  return out;
}

function viewIsValid(mnemonic: string, security: string): void {
  const code = mnemonic.toUpperCase();
  const def = catalog.getCatalogMnemonic(code);
  assert(Boolean(def || MNEMONIC_DEFS[code]), `Open failed for mnemonic ${code}`);
  if (def) assert(def.helpMarkdown.trim().length > 40, `${code} missing usable HELP text`);
  const related = def
    ? catalog.buildIntegratedRelatedCodes(code, 16)
    : Array.from(new Set([...(MNEMONIC_DEFS[code]?.relatedCodes ?? []), 'DES', 'TOP', 'LINE', 'FLD', 'NAV', 'NX', 'MON', 'RPT', 'WS', 'TUTOR'])).slice(0, 16);
  assert(related.length >= 10, `${code} MENU related functions < 10`);
  const category = def?.category ?? 'EQUITY';
  const rows = fabric.denseRowsForMnemonic(category, def?.requiresSecurity ? security : `${category}-CORE-UNIVERSE`, 220);
  assert(rows.length >= 200, `${code} density rows below threshold`);
  const entities = fabric.relatedEntitiesFor(security, 24);
  assert(entities.length >= 20, `${code} related entities below threshold`);
}

const all = catalog.listCatalogMnemonics();
assert(all.length >= 5000, `Expected >=5000 mnemonics for scale verification, got ${all.length}`);

const rnd = seeded(20260307);
const openSample = sampleDeterministic(all, 200, rnd);
for (const m of openSample) {
  viewIsValid(m.code, 'AAPL US Equity');
}

const chainStarts = sampleDeterministic(all, 50, rnd);
for (const start of chainStarts) {
  let currentCode = start.code;
  let currentSecurity = 'AAPL US Equity';
  let sameCount = 0;

  for (let step = 0; step < 10; step += 1) {
    let actionMnemonic = currentCode;
    let nextSecurity = currentSecurity;

    if (step % 2 === 0) {
      const related = catalog.getCatalogMnemonic(currentCode)
        ? catalog.buildIntegratedRelatedCodes(currentCode, 16)
        : Array.from(new Set([...(MNEMONIC_DEFS[currentCode]?.relatedCodes ?? []), 'DES', 'TOP', 'LINE', 'FLD', 'NAV', 'NX', 'MON', 'RPT', 'WS', 'TUTOR'])).slice(0, 16);
      assert(related.length >= 10, `${currentCode} produced dead-end related function list`);
      const fn = related[Math.floor(rnd() * related.length)]!;
      const action = resolveLink(makeFunction(fn, fn), 'OPEN_IN_PLACE', 0, currentCode);
      actionMnemonic = action.mnemonic;
      nextSecurity = action.security ?? nextSecurity;
    } else {
      const entities = fabric.relatedEntitiesFor(currentSecurity, 24);
      assert(entities.length >= 20, `${currentCode} produced dead-end related entities`);
      const entity = entities[Math.floor(rnd() * entities.length)]!;
      const action = resolveLink(entity, 'OPEN_IN_PLACE', 0, currentCode);
      actionMnemonic = action.mnemonic;
      nextSecurity = action.security ?? nextSecurity;
    }

    const normalized = actionMnemonic.toUpperCase();
    assert(Boolean(catalog.getCatalogMnemonic(normalized) || MNEMONIC_DEFS[normalized]), `Drill step failed to resolve mnemonic: ${normalized}`);
    if (normalized === currentCode.toUpperCase()) sameCount += 1;
    else sameCount = 0;
    assert(sameCount < 3, `Drill chain looped on ${normalized} for >=3 steps`);

    currentCode = normalized;
    currentSecurity = nextSecurity;
    viewIsValid(currentCode, currentSecurity);
  }
}

const searchQueries = sampleDeterministic(all, 120, rnd).flatMap((m) => [m.code, m.title.split(' ')[0] ?? m.title, m.keywords[0] ?? m.category]);
const timings: number[] = [];
for (const q of searchQueries) {
  const t0 = performance.now();
  const results = catalog.searchMnemonicCatalog(q);
  const t1 = performance.now();
  timings.push(t1 - t0);
  assert(results.length > 0, `Search yielded no results for "${q}"`);
}
const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
const max = Math.max(...timings);
assert(avg < 45, `NavTree-scale search average too slow: ${avg.toFixed(2)}ms`);
assert(max < 220, `NavTree-scale search max too slow: ${max.toFixed(2)}ms`);

console.log(`Integration smoke passed: opened=200, chains=50x10, avgSearchMs=${avg.toFixed(2)}, maxSearchMs=${max.toFixed(2)}, catalog=${all.length}`);
