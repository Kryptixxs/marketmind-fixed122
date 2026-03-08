/**
 * Fake News Generator – generates financial headlines every 30 seconds.
 * Pushes into NewsWire state via PUSH_HEADLINE.
 */

const TICKER_TEMPLATES = [
  (t: string) => `${t} reported earnings beat estimates`,
  (t: string) => `${t} raises full-year guidance on strong demand`,
  (t: string) => `${t} announces share buyback program`,
  (t: string) => `${t} downgraded by analyst on valuation concerns`,
  (t: string) => `${t} sees sector rotation flows amid macro shift`,
  (t: string) => `${t} faces regulatory scrutiny in EU`,
  (t: string) => `${t} CFO steps down; replacement named`,
  (t: string) => `${t} expands partnership with major cloud provider`,
];

const MACRO_TEMPLATES = [
  'Central Bank maintains rates; data-dependent stance affirmed',
  'ECB officials signal caution on further cuts ahead of CPI',
  'Fed Chair emphasizes inflation progress remains uneven',
  'Treasury yields edge higher on strong jobs data',
  'Dollar strengthens as safe-haven flows return',
  'Oil prices extend gains on supply concerns',
  'Equities rally on earnings optimism; breadth improves',
  'Credit spreads tighten as risk appetite returns',
  'Asian equities mixed; China PMI disappoints',
  'European bonds sell off on hawkish central bank commentary',
];

const TICKERS = ['AAPL', 'MSFT', 'NVDA', 'META', 'AMZN', 'GOOGL', 'TSLA', 'JPM', 'V', 'WMT'];

let headlineSeq = 0;

export function generateFakeHeadline(): string {
  headlineSeq += 1;
  const useTicker = Math.random() < 0.5;
  if (useTicker) {
    const ticker = TICKERS[Math.floor(Math.random() * TICKERS.length)];
    const template = TICKER_TEMPLATES[Math.floor(Math.random() * TICKER_TEMPLATES.length)];
    return template(ticker);
  }
  return MACRO_TEMPLATES[Math.floor(Math.random() * MACRO_TEMPLATES.length)];
}
