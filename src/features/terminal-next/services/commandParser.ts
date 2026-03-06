import { CommandResult, INSTRUMENTS } from '../types';

const VALID_FUNCTIONS = ['DES', 'FA', 'HP', 'CHART', 'DEPTH', 'NEWS', 'HELP'] as const;

export function parseCommand(input: string): CommandResult {
  const raw = input.trim().toUpperCase();
  if (!raw) return { type: 'ERROR', message: 'Empty command' };

  const tokens = raw.split(/\s+/);

  if (tokens[0] === 'HELP') {
    return {
      type: 'INFO',
      message: 'Commands: <TICKER> GO | <TICKER> <FUNCTION> | BUY/SELL <TICKER> <QTY> [@ PRICE] | HELP',
    };
  }

  // BUY / SELL orders
  if (tokens[0] === 'BUY' || tokens[0] === 'SELL') {
    return parseOrderCommand(tokens);
  }

  // Cancel order
  if (tokens[0] === 'CANCEL' && tokens.length >= 2) {
    return {
      type: 'EXEC',
      message: `Cancel request: ${tokens[1]}`,
      payload: { action: 'cancel', orderId: tokens[1] },
    };
  }

  // Symbol lookup
  const symbol = tokens[0];
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);

  if (!inst) {
    return { type: 'ERROR', message: `Unknown symbol: ${symbol}` };
  }

  // <TICKER> GO or just <TICKER>
  const lastToken = tokens[tokens.length - 1];
  if (tokens.length === 1 || lastToken === 'GO') {
    return {
      type: 'NAV',
      message: `Loading ${inst.name} (${inst.symbol})`,
      payload: { symbol: inst.symbol, function: 'DES' },
    };
  }

  // <TICKER> <FUNCTION>
  const fn = tokens[1];
  if (VALID_FUNCTIONS.includes(fn as typeof VALID_FUNCTIONS[number])) {
    return {
      type: 'NAV',
      message: `${inst.symbol} ${fn}`,
      payload: { symbol: inst.symbol, function: fn },
    };
  }

  return { type: 'ERROR', message: `Unknown function: ${fn}. Valid: ${VALID_FUNCTIONS.join(', ')}` };
}

function parseOrderCommand(tokens: string[]): CommandResult {
  const side = tokens[0] as 'BUY' | 'SELL';

  if (tokens.length < 3) {
    return { type: 'ERROR', message: `Usage: ${side} <TICKER> <QTY> [@ <PRICE>]` };
  }

  const symbol = tokens[1];
  const inst = INSTRUMENTS.find(i => i.symbol === symbol);
  if (!inst) {
    return { type: 'ERROR', message: `Unknown symbol: ${symbol}` };
  }

  const qty = parseInt(tokens[2], 10);
  if (isNaN(qty) || qty <= 0) {
    return { type: 'ERROR', message: `Invalid quantity: ${tokens[2]}` };
  }

  const atIdx = tokens.indexOf('@');
  let price = 0;
  let orderType: 'MKT' | 'LMT' = 'MKT';

  if (atIdx !== -1 && atIdx + 1 < tokens.length) {
    price = parseFloat(tokens[atIdx + 1]);
    if (isNaN(price) || price <= 0) {
      return { type: 'ERROR', message: `Invalid price: ${tokens[atIdx + 1]}` };
    }
    orderType = 'LMT';
  }

  return {
    type: 'EXEC',
    message: `${side} ${qty} ${symbol} ${orderType}${orderType === 'LMT' ? ` @ ${price}` : ''}`,
    payload: { action: 'order', side, symbol, qty, price, orderType },
  };
}
