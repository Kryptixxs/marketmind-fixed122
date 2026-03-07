/**
 * Multi-modal search router.
 * Routes input by intent: ticker → EXEC, natural question / entity / date / country → INTEL.
 */

export type SearchIntent =
  | { type: 'TICKER'; ticker: string; market?: string }
  | { type: 'INTEL_ENTITY'; entity: string; filters?: { country?: string; date?: string } }
  | { type: 'UNKNOWN' };

const STANDARD_CMD_REGEX = /^[A-Z0-9.]+(\s+[A-Z0-9]+)*\s+(EXEC|DES|FA|WEI|HP|YAS|OVME|PORT|NEWS|CAL|SEC|MKT|INTEL)\s+GO$/i;

/** Extract entity from natural-language-like input (e.g. "Palantir Russia contracts", "AAPL news 08/09/2019") */
function extractEntityAndFilters(input: string): { entity: string; country?: string; date?: string } {
  const upper = input.toUpperCase().trim();
  const tokens = upper.split(/\s+/).filter(Boolean);

  let entity = '';
  let country: string | undefined;
  let date: string | undefined;

  // Date patterns: YYYY-MM-DD, MM/DD/YYYY, 08/09/2019
  const dateMatch = upper.match(/(\d{4})-(\d{2})-(\d{2})|(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    if (dateMatch[1]) {
      date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    } else if (dateMatch[4]) {
      const m = dateMatch[4].padStart(2, '0');
      const d = dateMatch[5].padStart(2, '0');
      date = `${dateMatch[6]}-${m}-${d}`;
    }
  }

  // Country keywords
  const countryKeywords = ['RUSSIA', 'CHINA', 'UK', 'EU', 'EUROPE', 'US', 'USA', 'JAPAN', 'GERMANY', 'FRANCE'];
  for (const t of tokens) {
    if (countryKeywords.includes(t) || countryKeywords.some((c) => t.includes(c))) {
      country = t;
      break;
    }
  }

  // Entity: first token that looks like a ticker (alphanumeric, 2-6 chars) or a company name
  const tickerLike = /^[A-Z]{2,6}(\.[A-Z])?$/;
  for (const t of tokens) {
    if (tickerLike.test(t) && !['GO', 'NEWS', 'CONTRACTS', 'CLIENTS'].includes(t)) {
      entity = t;
      break;
    }
  }
  if (!entity && tokens.length > 0) {
    // Use first token as entity (e.g. PALANTIR)
    entity = tokens.find((t) => !['NEWS', 'CONTRACTS', 'CLIENTS', 'RUSSIA', 'CHINA'].includes(t) && t.length >= 2) ?? tokens[0];
  }

  return { entity, country, date };
}

export function routeSearch(input: string): SearchIntent {
  const trimmed = input.replace(/\s+/g, ' ').trim();
  if (!trimmed) return { type: 'UNKNOWN' };

  const upper = trimmed.toUpperCase();

  // Standard command format: <TICKER> [MARKET] <FUNCTION> GO
  if (STANDARD_CMD_REGEX.test(upper)) {
    return { type: 'TICKER' };
  }

  // Natural language / entity-style queries
  const hasEntityKeywords =
    upper.includes('CONTRACTS') ||
    upper.includes('CLIENTS') ||
    upper.includes('NEWS') ||
    upper.includes('RUSSIA') ||
    upper.includes('CHINA') ||
    upper.includes('SUPPLY') ||
    upper.includes('CUSTOMERS') ||
    /\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/.test(upper);

  if (hasEntityKeywords || (upper.split(/\s+/).length >= 2 && !upper.endsWith('GO'))) {
    const { entity, country, date } = extractEntityAndFilters(trimmed);
    if (entity) {
      return {
        type: 'INTEL_ENTITY',
        entity: entity.includes(' ') ? entity.split(/\s+/)[0] : entity,
        filters: country || date ? { country, date } : undefined,
      };
    }
  }

  // Bare ticker (e.g. "AAPL" or "PLTR US")
  const tokens = upper.split(/\s+/);
  if (tokens.length <= 2 && /^[A-Z0-9.]+$/.test(tokens[0])) {
    return { type: 'TICKER', ticker: tokens[0], market: tokens[1] };
  }

  return { type: 'UNKNOWN' };
}
