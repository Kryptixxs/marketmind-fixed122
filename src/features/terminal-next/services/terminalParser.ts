export type YellowKey = 'EQUITY' | 'CURNCY' | 'CMDTY' | 'INDEX';

export interface ParsedTerminalCommand {
  ticker: string;
  market: string;
  yellowKey: YellowKey;
  function: string;
  sector: 'EQUITY' | 'CORP' | 'CURNCY' | 'INDEX';
  normalizedSecurity: string;
  normalizedCommand: string;
}

type ParseOk = { ok: true; value: ParsedTerminalCommand };
type ParseErr = { ok: false; error: string };

const YELLOW_KEY_ALIASES: Record<string, YellowKey> = {
  EQUITY: 'EQUITY',
  CURNCY: 'CURNCY',
  CURRENCY: 'CURNCY',
  CMDTY: 'CMDTY',
  COMMODITY: 'CMDTY',
  INDEX: 'INDEX',
};

const MARKET_BY_YELLOW_KEY: Record<YellowKey, string> = {
  EQUITY: 'US',
  CURNCY: 'Curncy',
  CMDTY: 'Comdty',
  INDEX: 'Index',
};

const KNOWN_FUNCTIONS = new Set([
  'WEI', 'TOP', 'DES', 'CN', 'GP', 'FA', 'HP', 'DVD', 'MGMT', 'OWN', 'RELS',
  'N', 'MKT', 'EXEC', 'YAS', 'OVME', 'PORT', 'NEWS', 'CAL', 'SEC', 'INTEL',
  'IMAP', 'ECO', 'FXC', 'GC', 'IB', 'ALRT', 'ANR', 'MENU',
]);

const clean = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function inferCurrencyPair(token: string): string {
  const compact = token.replace(/[^A-Z]/g, '');
  if (compact.length === 6) return compact;
  if (compact.length === 3) return `${compact}USD`;
  return compact || token;
}

export function parseTerminalCommand(
  input: string,
  defaultYellowKey: YellowKey = 'EQUITY',
  fallbackFunction = 'GP'
): ParseOk | ParseErr {
  const normalized = clean(input);
  if (!normalized) return { ok: false, error: 'EMPTY COMMAND' };

  const rawTokens = normalized.split(' ').filter(Boolean);
  const tokens = rawTokens[rawTokens.length - 1] === 'GO' ? rawTokens.slice(0, -1) : rawTokens;
  let fn = fallbackFunction.toUpperCase();
  let securityTokens = [...tokens];
  const maybeFn = tokens[tokens.length - 1]!;
  if (KNOWN_FUNCTIONS.has(maybeFn) && !YELLOW_KEY_ALIASES[maybeFn]) {
    fn = maybeFn;
    securityTokens = tokens.slice(0, -1);
  } else if (tokens.length < 1) {
    return { ok: false, error: 'FORMAT: <TICKER> [MARKET] [YELLOW_KEY] <FUNCTION>' };
  }
  let yellowKey = defaultYellowKey;
  const maybeYk = securityTokens[securityTokens.length - 1];
  if (maybeYk && YELLOW_KEY_ALIASES[maybeYk]) {
    yellowKey = YELLOW_KEY_ALIASES[maybeYk];
    securityTokens.pop();
  }

  if (securityTokens.length === 0) return { ok: false, error: 'MISSING SECURITY' };

  let ticker = securityTokens[0]!;
  let market = securityTokens[1] ?? MARKET_BY_YELLOW_KEY[yellowKey];
  let sector: ParsedTerminalCommand['sector'] = yellowKey === 'CMDTY' ? 'CORP' : yellowKey;

  if (yellowKey === 'CURNCY') {
    ticker = inferCurrencyPair(ticker);
    market = 'Curncy';
    sector = 'CURNCY';
  } else if (!market) {
    market = MARKET_BY_YELLOW_KEY[yellowKey];
  }

  if (yellowKey === 'EQUITY' && market === 'Index') sector = 'INDEX';

  const normalizedSecurity = `${ticker}${market ? ` ${market}` : ''}`;
  return {
    ok: true,
    value: {
      ticker,
      market,
      yellowKey,
      function: fn,
      sector,
      normalizedSecurity,
      normalizedCommand: `${normalizedSecurity} ${fn} GO`,
    },
  };
}
