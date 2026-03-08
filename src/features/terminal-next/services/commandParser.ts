import { AssetClass, CommandResult, FunctionCode, SecurityContext, TerminalFunction } from '../types';

const FUNCTION_CODES: FunctionCode[] = ['EXEC', 'ESC', 'DES', 'FA', 'WEI', 'HP', 'YAS', 'TOP', 'ECO', 'NI', 'OVME', 'PORT', 'NEWS', 'CAL', 'SEC', 'MKT', 'INTEL', 'IMAP', 'FXC', 'GC', 'CN', 'OQ', 'IB'];
const ASSET_CLASSES: AssetClass[] = ['EQUITY', 'CORP', 'GOVT', 'CMDTY', 'CURNCY'];

const normalize = (value: string) =>
  value
    .replace(/[<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

function inferAssetClass(market: string): AssetClass {
  if (market === 'GOVT') return 'GOVT';
  if (market === 'CURNCY') return 'CURNCY';
  if (market === 'CMDTY') return 'CMDTY';
  if (market === 'INDEX') return 'EQUITY';
  return 'EQUITY';
}

function mapActiveFunction(functionCode: FunctionCode): TerminalFunction {
  if (functionCode === 'EXEC') return 'EXEC';
  if (functionCode === 'ESC') return 'EXEC';
  if (functionCode === 'DES') return 'DES';
  if (functionCode === 'FA') return 'FA';
  if (functionCode === 'HP') return 'HP';
  if (functionCode === 'WEI') return 'WEI';
  if (functionCode === 'YAS') return 'YAS';
  if (functionCode === 'OVME') return 'OVME';
  if (functionCode === 'PORT') return 'PORT';
  if (functionCode === 'NEWS') return 'NEWS';
  if (functionCode === 'CAL') return 'CAL';
  if (functionCode === 'SEC') return 'SEC';
  if (functionCode === 'MKT') return 'MKT';
  if (functionCode === 'INTEL') return 'INTEL';
  if (functionCode === 'IMAP') return 'IMAP';
  if (functionCode === 'ECO') return 'ECO';
  if (functionCode === 'FXC') return 'FXC';
  if (functionCode === 'GC') return 'GC';
  if (functionCode === 'CN') return 'NEWS';
  if (functionCode === 'OQ') return 'OVME';
  if (functionCode === 'IB') return 'IB';
  return 'EXEC';
}

function parseSecurity(tokens: string[]): SecurityContext | null {
  if (tokens.length === 3) {
    const [ticker, market, asset] = tokens;
    if (!ASSET_CLASSES.includes(asset as AssetClass)) return null;
    return { ticker, market, assetClass: asset as AssetClass };
  }

  if (tokens.length === 2) {
    const [a, b] = tokens;
    if (ASSET_CLASSES.includes(b as AssetClass)) {
      return { ticker: a, market: '', assetClass: b as AssetClass };
    }
    return { ticker: a, market: b, assetClass: inferAssetClass(b) };
  }

  if (tokens.length === 1) {
    return { ticker: tokens[0], market: '', assetClass: 'EQUITY' };
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

  if (tokens.length < 3) {
    return { ok: false, normalized, error: 'FORMAT: <TICKER> <FUNCTION> GO OR <TICKER> <MARKET> <ASSET> <FUNCTION> GO' };
  }

  let functionToken = tokens[tokens.length - 2] as string;
  if (functionToken === 'GP' || functionToken === 'GIP' || functionToken === 'GCDS') functionToken = 'MKT';
  if (functionToken === 'N') functionToken = 'NEWS';
  if (!FUNCTION_CODES.includes(functionToken as FunctionCode)) {
    return { ok: false, normalized, error: `UNKNOWN FUNCTION ${tokens[tokens.length - 2]}` };
  }
  const functionCode = functionToken as FunctionCode;

  const securityTokens = tokens.slice(0, -2);
  const security = parseSecurity(securityTokens);
  if (!security) {
    return {
      ok: false,
      normalized,
      error: 'SECURITY FORMAT INVALID. USE TICKER FUNCTION GO OR TICKER MARKET ASSET FUNCTION GO',
    };
  }

  return {
    ok: true,
    normalized: `${security.ticker}${security.market ? ` ${security.market}` : ''} ${functionCode} GO`,
    security,
    functionCode,
    activeFunction: mapActiveFunction(functionCode),
  };
}
