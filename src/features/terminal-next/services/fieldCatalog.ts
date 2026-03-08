export interface FieldDef {
  id: string;
  label: string;
  definition: string;
  unit: string;
  valueType: 'scalar' | 'series';
  dataType: 'number' | 'string' | 'date' | 'enum';
  chartable: boolean;
  availability: Array<'EQUITY' | 'INDEX' | 'ETF' | 'FX' | 'RATE' | 'FUTURE' | 'OPTION' | 'COUNTRY' | 'ALL'>;
  cadence: 'tick' | 'daily' | 'monthly' | 'quarterly' | 'static';
  updateFreq: 'tick' | 'daily' | 'monthly' | 'quarterly' | 'static';
  provenance: 'SIM' | 'LIVE' | 'CALC';
  description: string;
}

export const FIELD_CATALOG: Record<string, FieldDef> = {
  PX_LAST:         { id: 'PX_LAST',         label: 'Last Price',            definition: 'Most recent traded price for instrument.', unit: 'USD',      valueType: 'series', dataType: 'number', chartable: true,  availability: ['ALL'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'SIM',  description: 'Last traded price' },
  PX_BID:          { id: 'PX_BID',          label: 'Bid Price',             definition: 'Best executable bid quote.', unit: 'USD',      valueType: 'series', dataType: 'number', chartable: true,  availability: ['ALL'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'SIM',  description: 'National best bid' },
  PX_ASK:          { id: 'PX_ASK',          label: 'Ask Price',             definition: 'Best executable ask quote.', unit: 'USD',      valueType: 'series', dataType: 'number', chartable: true,  availability: ['ALL'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'SIM',  description: 'National best ask' },
  PX_CHG:          { id: 'PX_CHG',          label: 'Price Change',          definition: 'Absolute move versus previous close.', unit: 'USD',      valueType: 'series', dataType: 'number', chartable: false, availability: ['ALL'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'CALC', description: 'Price change vs prior close' },
  PCT_CHG:         { id: 'PCT_CHG',         label: 'Percent Change',        definition: 'Percent move versus previous close.', unit: '%',        valueType: 'series', dataType: 'number', chartable: true,  availability: ['ALL'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'CALC', description: 'Percentage change vs prior close' },
  MARKET_CAP:      { id: 'MARKET_CAP',      label: 'Market Capitalization', definition: 'Equity value: shares outstanding multiplied by last price.', unit: 'USD',      valueType: 'scalar', dataType: 'number', chartable: true,  availability: ['EQUITY', 'ETF'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'CALC', description: 'Shares outstanding × last price' },
  PE_RATIO:        { id: 'PE_RATIO',        label: 'P/E Ratio (TTM)',       definition: 'Price over trailing twelve month EPS.', unit: 'x',        valueType: 'scalar', dataType: 'number', chartable: true,  availability: ['EQUITY'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'CALC', description: 'Price divided by trailing 12M EPS' },
  EPS:             { id: 'EPS',             label: 'EPS (TTM)',             definition: 'Trailing twelve month earnings per share.', unit: 'USD',      valueType: 'scalar', dataType: 'number', chartable: true,  availability: ['EQUITY'], cadence: 'quarterly', updateFreq: 'quarterly', provenance: 'SIM',  description: 'Earnings per share, trailing twelve months' },
  DIV_YIELD:       { id: 'DIV_YIELD',       label: 'Dividend Yield',        definition: 'Annual dividend as a percent of price.', unit: '%',        valueType: 'scalar', dataType: 'number', chartable: true,  availability: ['EQUITY', 'ETF'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'CALC', description: 'Annual dividend divided by current price' },
  BETA:            { id: 'BETA',            label: 'Beta (vs S&P 500)',     definition: 'Rolling beta against benchmark index.', unit: 'ratio',    valueType: 'scalar', dataType: 'number', chartable: false, availability: ['EQUITY', 'ETF'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'CALC', description: '252-day beta vs SPX' },
  VOLUME:          { id: 'VOLUME',          label: 'Volume',                definition: 'Traded volume over session.', unit: 'shares',   valueType: 'series', dataType: 'number', chartable: true,  availability: ['ALL'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'SIM',  description: 'Shares traded today' },
  VWAP:            { id: 'VWAP',            label: 'VWAP',                  definition: 'Volume weighted average traded price.', unit: 'USD',      valueType: 'series', dataType: 'number', chartable: true,  availability: ['ALL'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'CALC', description: 'Volume-weighted average price today' },
  MACD:            { id: 'MACD',            label: 'MACD',                  definition: 'EMA12 minus EMA26 momentum oscillator.', unit: 'USD',      valueType: 'series', dataType: 'number', chartable: true,  availability: ['ALL'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'CALC', description: 'MACD EMA12 - EMA26' },
  '52W_HIGH':      { id: '52W_HIGH',        label: '52-Week High',          definition: 'Highest print over prior 52 weeks.', unit: 'USD',      valueType: 'scalar', dataType: 'number', chartable: false, availability: ['ALL'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'SIM',  description: 'Highest traded price in past 52 weeks' },
  '52W_LOW':       { id: '52W_LOW',         label: '52-Week Low',           definition: 'Lowest print over prior 52 weeks.', unit: 'USD',      valueType: 'scalar', dataType: 'number', chartable: false, availability: ['ALL'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'SIM',  description: 'Lowest traded price in past 52 weeks' },
  SHARES_OUT:      { id: 'SHARES_OUT',      label: 'Shares Outstanding',    definition: 'Fully diluted shares outstanding.', unit: 'M shares', valueType: 'scalar', dataType: 'number', chartable: false, availability: ['EQUITY'], cadence: 'quarterly', updateFreq: 'quarterly', provenance: 'SIM',  description: 'Total diluted shares outstanding' },
  PRIMARY_EXCHANGE:{ id: 'PRIMARY_EXCHANGE',label: 'Primary Exchange',      definition: 'Main listing venue.', unit: '',         valueType: 'scalar', dataType: 'string', chartable: false, availability: ['EQUITY', 'ETF'], cadence: 'static',    updateFreq: 'static',    provenance: 'SIM',  description: 'Primary listing exchange' },
  SECTOR:          { id: 'SECTOR',          label: 'GICS Sector',           definition: 'Top-level GICS sector classification.', unit: '',         valueType: 'scalar', dataType: 'string', chartable: false, availability: ['EQUITY', 'ETF'], cadence: 'static',    updateFreq: 'static',    provenance: 'SIM',  description: 'GICS sector classification' },
  INDUSTRY:        { id: 'INDUSTRY',        label: 'GICS Industry',         definition: 'Industry-level classification.', unit: '',         valueType: 'scalar', dataType: 'string', chartable: false, availability: ['EQUITY', 'ETF'], cadence: 'static',    updateFreq: 'static',    provenance: 'SIM',  description: 'GICS industry group' },
  COUNTRY:         { id: 'COUNTRY',         label: 'Country of Risk',       definition: 'Primary country exposure.', unit: '',         valueType: 'scalar', dataType: 'string', chartable: false, availability: ['ALL'], cadence: 'static',    updateFreq: 'static',    provenance: 'SIM',  description: 'Primary country of risk' },
  DELTA:           { id: 'DELTA',           label: 'Option Delta',          definition: 'First derivative of option price to underlying.', unit: 'ratio',    valueType: 'series', dataType: 'number', chartable: true,  availability: ['OPTION'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'CALC', description: 'Rate of change of option value vs underlying' },
  VEGA:            { id: 'VEGA',            label: 'Option Vega',           definition: 'Sensitivity to implied volatility.', unit: 'USD/%',    valueType: 'series', dataType: 'number', chartable: false, availability: ['OPTION'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'CALC', description: 'Sensitivity to implied volatility changes' },
  GAMMA:           { id: 'GAMMA',           label: 'Option Gamma',          definition: 'Second derivative risk of option.', unit: 'ratio',    valueType: 'series', dataType: 'number', chartable: false, availability: ['OPTION'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'CALC', description: 'Rate of change of delta' },
  THETA:           { id: 'THETA',           label: 'Option Theta',          definition: 'Time decay estimate per day.', unit: 'USD/day',  valueType: 'series', dataType: 'number', chartable: false, availability: ['OPTION'], cadence: 'tick',      updateFreq: 'tick',      provenance: 'CALC', description: 'Time decay per calendar day' },
  YLD_YTM:         { id: 'YLD_YTM',         label: 'Yield to Maturity',     definition: 'Bond yield if held to maturity.', unit: '%',        valueType: 'series', dataType: 'number', chartable: true,  availability: ['RATE'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'CALC', description: 'Internal rate of return if held to maturity' },
  SPREAD_OAS:      { id: 'SPREAD_OAS',      label: 'OAS Spread',            definition: 'Credit spread adjusted for options.', unit: 'bps',      valueType: 'series', dataType: 'number', chartable: true,  availability: ['RATE'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'CALC', description: 'Option-adjusted spread vs Treasury' },
  DURATION:        { id: 'DURATION',        label: 'Modified Duration',     definition: 'Price sensitivity to yield changes.', unit: 'years',    valueType: 'scalar', dataType: 'number', chartable: false, availability: ['RATE'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'CALC', description: 'Price sensitivity per 1% yield change' },
  GDP:             { id: 'GDP',             label: 'GDP',                   definition: 'Nominal gross domestic product.', unit: 'USD T',    valueType: 'series', dataType: 'number', chartable: true,  availability: ['COUNTRY'], cadence: 'quarterly', updateFreq: 'quarterly', provenance: 'SIM',  description: 'Gross Domestic Product' },
  INFLATION_RATE:  { id: 'INFLATION_RATE',  label: 'Inflation Rate',        definition: 'Consumer inflation year-over-year.', unit: '%',        valueType: 'series', dataType: 'number', chartable: true,  availability: ['COUNTRY'], cadence: 'monthly',   updateFreq: 'monthly',   provenance: 'SIM',  description: 'Consumer price index YoY change' },
  POLICY_RATE:     { id: 'POLICY_RATE',     label: 'Policy Rate',           definition: 'Reference central bank policy rate.', unit: '%',        valueType: 'series', dataType: 'number', chartable: true,  availability: ['COUNTRY'], cadence: 'daily',     updateFreq: 'daily',     provenance: 'SIM',  description: 'Central bank overnight lending rate' },
  SHARES_HELD:     { id: 'SHARES_HELD',     label: 'Shares Held',           definition: 'Institutional position size in shares.', unit: 'M shares', valueType: 'scalar', dataType: 'number', chartable: false, availability: ['EQUITY'], cadence: 'quarterly', updateFreq: 'quarterly', provenance: 'SIM',  description: 'Institutional position in shares' },
  SHARE_CHANGE:    { id: 'SHARE_CHANGE',    label: 'QoQ Position Change',   definition: 'Quarterly delta of held shares.', unit: 'M shares', valueType: 'series', dataType: 'number', chartable: false, availability: ['EQUITY'], cadence: 'quarterly', updateFreq: 'quarterly', provenance: 'SIM',  description: 'Change in shares held vs prior quarter' },
};

export function getFieldDef(fieldId: string): FieldDef | undefined {
  return FIELD_CATALOG[fieldId];
}

export function listFieldDefs(): FieldDef[] {
  return Object.values(FIELD_CATALOG);
}

export function searchFieldDefs(query: string): FieldDef[] {
  const q = query.trim().toUpperCase();
  if (!q) return listFieldDefs();
  return listFieldDefs().filter((f) =>
    `${f.id} ${f.label} ${f.definition} ${f.description} ${f.unit} ${f.availability.join(' ')}`.toUpperCase().includes(q),
  );
}

export function getProvenanceBadge(fieldId: string): string {
  const def = FIELD_CATALOG[fieldId];
  return def?.provenance ?? 'SIM';
}

export function formatFieldValue(fieldId: string, value: unknown): string {
  const def = FIELD_CATALOG[fieldId];
  if (def == null || value == null) return String(value ?? '—');
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(n)) return String(value);
  switch (def.unit) {
    case 'USD': return n >= 1e12 ? `$${(n / 1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${n.toFixed(2)}`;
    case '%': return n.toFixed(2) + '%';
    case 'x': return n.toFixed(1) + 'x';
    case 'bps': return n.toFixed(0) + 'bps';
    case 'years': return n.toFixed(2) + 'y';
    case 'ratio': return n.toFixed(3);
    default: return n.toFixed(2);
  }
}
