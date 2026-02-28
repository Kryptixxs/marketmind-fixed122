/**
 * Map country names/codes to currency for filtering.
 * Used so "USD" filter matches events with country US, United States, etc.
 */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', USA: 'USD', 'United States': 'USD', 'United States of America': 'USD',
  EU: 'EUR', Eurozone: 'EUR', Germany: 'EUR', France: 'EUR', Italy: 'EUR', Spain: 'EUR',
  UK: 'GBP', 'United Kingdom': 'GBP', Britain: 'GBP',
  Japan: 'JPY', China: 'CNY', Australia: 'AUD', Canada: 'CAD', 'New Zealand': 'NZD',
  Switzerland: 'CHF', 'Hong Kong': 'HKD', 'South Korea': 'KRW', India: 'INR',
  Mexico: 'MXN', Brazil: 'BRL', 'South Africa': 'ZAR',
  NZD: 'NZD', EUR: 'EUR', GBP: 'GBP', JPY: 'JPY', AUD: 'AUD', CAD: 'CAD', CHF: 'CHF',
};

export function getEventCurrency(currency: string, country: string): string {
  const fromCountry = COUNTRY_TO_CURRENCY[country];
  const c = (currency || fromCountry || '').toUpperCase();
  return c || fromCountry || '';
}

export function eventMatchesCurrency(
  event: { currency: string; country: string },
  selectedCurrency: string
): boolean {
  if (selectedCurrency === 'All' || !selectedCurrency) return true;
  const want = selectedCurrency.toUpperCase();
  const eventCur = getEventCurrency(event.currency, event.country);
  return eventCur === want || event.currency?.toUpperCase() === want;
}
