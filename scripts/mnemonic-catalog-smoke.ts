import * as catalog from '../src/features/terminal-next/mnemonics/catalog';
import * as fabric from '../src/features/terminal-next/services/dataFabric';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

function randomSample<T>(arr: T[], count: number): T[] {
  if (arr.length <= count) return [...arr];
  const out: T[] = [];
  const used = new Set<number>();
  while (out.length < count) {
    const i = Math.floor(Math.random() * arr.length);
    if (used.has(i)) continue;
    used.add(i);
    out.push(arr[i]!);
  }
  return out;
}

const all = catalog.listCatalogMnemonics();
assert(all.length >= 2000, `Expected >=2000 mnemonics, got ${all.length}`);

const recipeKinds = new Set(all.map((m) => m.defaultRecipeId));
assert(recipeKinds.size >= 8, `Expected >=8 recipe archetypes, got ${recipeKinds.size}`);

for (const m of randomSample(all, 50)) {
  assert(m.helpMarkdown.length > 40, `${m.code} help too short`);
  assert(m.relatedCodes.length >= 10, `${m.code} has <10 related codes`);
  assert(m.keywords.length >= 3, `${m.code} has too few keywords`);
  const rows = fabric.denseRowsForMnemonic(m.category, `${m.code} US Equity`, 220);
  assert(rows.length >= 200, `${m.code} rows too sparse`);
  const rel = fabric.relatedEntitiesFor(`${m.code} US Equity`, 24);
  assert(rel.length >= 20, `${m.code} related entities too sparse`);
}

const searchChecks = ['dividends', 'ownership', 'options chain', 'country dossier', 'monitor'];
for (const q of searchChecks) {
  const r = catalog.searchMnemonicCatalog(q);
  assert(r.length > 0, `Search returned no results for "${q}"`);
}

const mustCodes = ['R500', 'M500', 'S300', 'CTYUS', 'CTYCN', 'DESP', 'DES2', 'DESG', 'DESR', 'HP10', 'FA10', 'CURV2Y', 'CUR10Y', 'CURINF', 'FXMAJ', 'FXEM', 'FXVOL', 'CRIG', 'CRHY', 'CRCDS', 'CMDEN', 'CMDMET', 'CMDAG', 'CHN200', 'VOL200', 'FLOW200', 'FCAT'];
const byCode = new Set(all.map((m) => m.code));
for (const c of mustCodes) {
  assert(byCode.has(c), `Missing required family code ${c}`);
}

console.log(`Mnemonic smoke checks passed. Count=${all.length}, recipeKinds=${recipeKinds.size}`);
