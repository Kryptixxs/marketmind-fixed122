import { listCatalogMnemonics } from '../src/features/terminal-next/mnemonics/catalog';
import { getInstrumentSlice } from '../src/features/terminal-next/services/dataFabric';
import { parseGoCommand } from '../src/features/terminal-next/runtime/PanelCommandLine';
import { resolveLink } from '../src/features/terminal-next/runtime/entities/linkResolver';
import { makeFunction, makeSecurity } from '../src/features/terminal-next/runtime/entities/types';

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

const catalog = listCatalogMnemonics();

// 1) Family grouping metadata exists and large families collapse into one group.
const familyCounts = new Map<string, number>();
for (const m of catalog) {
  assert(Boolean(m.familyId && m.familyLabel && m.variantLabel), `Missing family metadata on ${m.code}`);
  const key = `${m.category}:${m.familyId}`;
  familyCounts.set(key, (familyCounts.get(key) ?? 0) + 1);
}
const chnFamilyCount = familyCounts.get('DERIVS:CHN') ?? 0;
const volFamilyCount = familyCounts.get('DERIVS:VOL') ?? 0;
const monFamilyCount = familyCounts.get('PORTFOLIO:MON') ?? familyCounts.get('OPS_ADMIN:MON') ?? familyCounts.get('EQUITY:MON') ?? 0;
assert(chnFamilyCount >= 150, `Expected CHN family collapse size >=150, got ${chnFamilyCount}`);
assert(volFamilyCount >= 150, `Expected VOL family collapse size >=150, got ${volFamilyCount}`);
assert(monFamilyCount >= 50, `Expected MON family collapse size >=50, got ${monFamilyCount}`);

// 2) Instrument names should be realistic and should not use MarketMind fallback.
const sample = getInstrumentSlice(42, 300);
const bad = sample.filter((s) => s.name.toUpperCase().includes('MARKETMIND'));
assert(bad.length === 0, `Instrument naming fallback still uses MarketMind (${bad.length} rows)`);

// 3) Command parsing should honor security + mnemonic in both orders.
const p1 = parseGoCommand('GEO AAPL GO', 'MSFT US Equity', 'DES');
assert(p1.mnemonic === 'GEO', `Expected GEO mnemonic for "GEO AAPL", got ${p1.mnemonic ?? 'none'}`);
assert(Boolean(p1.security?.startsWith('AAPL')), `Expected AAPL security for "GEO AAPL", got ${p1.security ?? 'none'}`);

const p2 = parseGoCommand('AAPL US GEO GO', 'MSFT US Equity', 'DES');
assert(p2.mnemonic === 'GEO', `Expected GEO mnemonic for "AAPL US GEO", got ${p2.mnemonic ?? 'none'}`);
assert(Boolean(p2.security?.startsWith('AAPL US')), `Expected AAPL US security for "AAPL US GEO", got ${p2.security ?? 'none'}`);

// 4) Explicit target mnemonic should be honored for security drills.
const action = resolveLink(makeSecurity('AAPL US Equity', 'Apple Inc.'), 'OPEN_IN_PLACE', 0, 'DES', { targetMnemonic: 'GEO' });
assert(action.mnemonic === 'GEO', `Expected drill target mnemonic GEO, got ${action.mnemonic}`);
assert(action.security === 'AAPL US Equity', `Expected security context preserved, got ${action.security ?? 'none'}`);

// 5) Function open should preserve current security context.
const fnAction = resolveLink(makeFunction('GEO', 'Global Intelligence Map'), 'OPEN_IN_PLACE', 0, 'DES', { currentSecurity: 'AAPL US Equity' });
assert(fnAction.mnemonic === 'GEO', `Expected function drill mnemonic GEO, got ${fnAction.mnemonic}`);
assert(fnAction.security === 'AAPL US Equity', `Expected function drill to keep active security, got ${fnAction.security ?? 'none'}`);

console.log(`NavTree/routing smoke passed. catalog=${catalog.length}, CHN=${chnFamilyCount}, VOL=${volFamilyCount}`);
