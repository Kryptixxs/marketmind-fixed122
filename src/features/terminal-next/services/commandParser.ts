import { AssetClass, CommandResult, FunctionCode, SecurityContext } from '../types';

const FUNCTION_CODES: FunctionCode[] = ['DES', 'FA', 'WEI', 'HP', 'YAS', 'TOP', 'ECO', 'NI', 'OVME', 'PORT'];
const ASSET_CLASSES: AssetClass[] = ['EQUITY', 'CORP', 'GOVT', 'CMDTY', 'CURNCY'];

const normalize = (value: string) =>
  value
    .replace(/[<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

function parseSecurity(tokens: string[]): SecurityContext | null {
  if (tokens.length === 3) {
    const [ticker, market, asset] = tokens;
    if (!ASSET_CLASSES.includes(asset as AssetClass)) return null;
    return { ticker, market, assetClass: asset as AssetClass };
  }

  if (tokens.length === 2) {
    const [ticker, asset] = tokens;
    if (!ASSET_CLASSES.includes(asset as AssetClass)) return null;
    return { ticker, market: '', assetClass: asset as AssetClass };
  }

  return null;
}

export function parseCommand(input: string): CommandResult {
  const normalized = normalize(input);
  if (!normalized) return { ok: false, normalized, error: 'EMPTY COMMAND' };

  const tokens = normalized.split(' ');
  if (tokens[tokens.length - 1] !== 'GO') {
    return { ok: false, normalized, error: 'COMMAND MUST END WITH GO' };
  }

  if (tokens.length < 4) {
    return { ok: false, normalized, error: 'FORMAT: <TICKER> <ASSET_CLASS> <FUNCTION> GO' };
  }

  const functionToken = tokens[tokens.length - 2] as FunctionCode;
  if (!FUNCTION_CODES.includes(functionToken)) {
    return { ok: false, normalized, error: `UNKNOWN FUNCTION ${tokens[tokens.length - 2]}` };
  }

  const securityTokens = tokens.slice(0, -2);
  const security = parseSecurity(securityTokens);
  if (!security) {
    return {
      ok: false,
      normalized,
      error: 'SECURITY FORMAT INVALID. USE TICKER MARKET ASSET OR TICKER ASSET',
    };
  }

  return {
    ok: true,
    normalized: `${security.ticker}${security.market ? ` ${security.market}` : ''} ${security.assetClass} ${functionToken} GO`,
    security,
    functionCode: functionToken,
  };
}
