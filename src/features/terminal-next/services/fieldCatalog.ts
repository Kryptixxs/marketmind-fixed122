export interface FieldDef {
  id: string;
  label: string;
  unit: string;
  dataType: 'number' | 'string' | 'date' | 'enum';
  chartable: boolean;
  updateFreq: 'tick' | 'daily' | 'quarterly' | 'static';
  provenance: 'SIM' | 'LIVE' | 'CALC';
  description: string;
}

export const FIELD_CATALOG: Record<string, FieldDef> = {
  PX_LAST:         { id: 'PX_LAST',         label: 'Last Price',           unit: 'USD',      dataType: 'number', chartable: true,  updateFreq: 'tick',      provenance: 'SIM',  description: 'Last traded price' },
  PX_BID:          { id: 'PX_BID',           label: 'Bid Price',            unit: 'USD',      dataType: 'number', chartable: true,  updateFreq: 'tick',      provenance: 'SIM',  description: 'National best bid' },
  PX_ASK:          { id: 'PX_ASK',           label: 'Ask Price',            unit: 'USD',      dataType: 'number', chartable: true,  updateFreq: 'tick',      provenance: 'SIM',  description: 'National best ask' },
  PX_CHG:          { id: 'PX_CHG',           label: 'Price Change',         unit: 'USD',      dataType: 'number', chartable: false, updateFreq: 'tick',      provenance: 'CALC', description: 'Price change vs prior close' },
  PCT_CHG:         { id: 'PCT_CHG',          label: 'Percent Change',       unit: '%',        dataType: 'number', chartable: true,  updateFreq: 'tick',      provenance: 'CALC', description: 'Percentage change vs prior close' },
  MARKET_CAP:      { id: 'MARKET_CAP',       label: 'Market Capitalization',unit: 'USD',      dataType: 'number', chartable: true,  updateFreq: 'daily',     provenance: 'CALC', description: 'Shares outstanding × last price' },
  PE_RATIO:        { id: 'PE_RATIO',         label: 'P/E Ratio (TTM)',      unit: 'x',        dataType: 'number', chartable: true,  updateFreq: 'daily',     provenance: 'CALC', description: 'Price divided by trailing 12M EPS' },
  EPS:             { id: 'EPS',              label: 'EPS (TTM)',            unit: 'USD',      dataType: 'number', chartable: true,  updateFreq: 'quarterly', provenance: 'SIM',  description: 'Earnings per share, trailing twelve months' },
  DIV_YIELD:       { id: 'DIV_YIELD',        label: 'Dividend Yield',       unit: '%',        dataType: 'number', chartable: true,  updateFreq: 'daily',     provenance: 'CALC', description: 'Annual dividend divided by current price' },
  BETA:            { id: 'BETA',             label: 'Beta (vs S&P 500)',    unit: 'ratio',    dataType: 'number', chartable: false, updateFreq: 'daily',     provenance: 'CALC', description: '252-day beta vs SPX' },
  VOLUME:          { id: 'VOLUME',           label: 'Volume',               unit: 'shares',   dataType: 'number', chartable: true,  updateFreq: 'tick',      provenance: 'SIM',  description: 'Shares traded today' },
  VWAP:            { id: 'VWAP',             label: 'VWAP',                 unit: 'USD',      dataType: 'number', chartable: true,  updateFreq: 'tick',      provenance: 'CALC', description: 'Volume-weighted average price today' },
  MACD:            { id: 'MACD',             label: 'MACD',                 unit: 'USD',      dataType: 'number', chartable: true,  updateFreq: 'tick',      provenance: 'CALC', description: 'MACD EMA12 - EMA26' },
  '52W_HIGH':      { id: '52W_HIGH',         label: '52-Week High',         unit: 'USD',      dataType: 'number', chartable: false, updateFreq: 'daily',     provenance: 'SIM',  description: 'Highest traded price in past 52 weeks' },
  '52W_LOW':       { id: '52W_LOW',          label: '52-Week Low',          unit: 'USD',      dataType: 'number', chartable: false, updateFreq: 'daily',     provenance: 'SIM',  description: 'Lowest traded price in past 52 weeks' },
  SHARES_OUT:      { id: 'SHARES_OUT',       label: 'Shares Outstanding',   unit: 'M shares', dataType: 'number', chartable: false, updateFreq: 'quarterly', provenance: 'SIM',  description: 'Total diluted shares outstanding' },
  PRIMARY_EXCHANGE:{ id: 'PRIMARY_EXCHANGE', label: 'Primary Exchange',     unit: '',         dataType: 'string', chartable: false, updateFreq: 'static',    provenance: 'SIM',  description: 'Primary listing exchange' },
  SECTOR:          { id: 'SECTOR',           label: 'GICS Sector',          unit: '',         dataType: 'string', chartable: false, updateFreq: 'static',    provenance: 'SIM',  description: 'GICS sector classification' },
  INDUSTRY:        { id: 'INDUSTRY',         label: 'GICS Industry',        unit: '',         dataType: 'string', chartable: false, updateFreq: 'static',    provenance: 'SIM',  description: 'GICS industry group' },
  COUNTRY:         { id: 'COUNTRY',          label: 'Country of Risk',      unit: '',         dataType: 'string', chartable: false, updateFreq: 'static',    provenance: 'SIM',  description: 'Primary country of risk' },
  DELTA:           { id: 'DELTA',            label: 'Option Delta',         unit: 'ratio',    dataType: 'number', chartable: true,  updateFreq: 'tick',      provenance: 'CALC', description: 'Rate of change of option value vs underlying' },
  VEGA:            { id: 'VEGA',             label: 'Option Vega',          unit: 'USD/%',    dataType: 'number', chartable: false, updateFreq: 'tick',      provenance: 'CALC', description: 'Sensitivity to implied volatility changes' },
  GAMMA:           { id: 'GAMMA',            label: 'Option Gamma',         unit: 'ratio',    dataType: 'number', chartable: false, updateFreq: 'tick',      provenance: 'CALC', description: 'Rate of change of delta' },
  THETA:           { id: 'THETA',            label: 'Option Theta',         unit: 'USD/day',  dataType: 'number', chartable: false, updateFreq: 'tick',      provenance: 'CALC', description: 'Time decay per calendar day' },
  YLD_YTM:         { id: 'YLD_YTM',          label: 'Yield to Maturity',    unit: '%',        dataType: 'number', chartable: true,  updateFreq: 'daily',     provenance: 'CALC', description: 'Internal rate of return if held to maturity' },
  SPREAD_OAS:      { id: 'SPREAD_OAS',       label: 'OAS Spread',           unit: 'bps',      dataType: 'number', chartable: true,  updateFreq: 'daily',     provenance: 'CALC', description: 'Option-adjusted spread vs Treasury' },
  DURATION:        { id: 'DURATION',         label: 'Modified Duration',    unit: 'years',    dataType: 'number', chartable: false, updateFreq: 'daily',     provenance: 'CALC', description: 'Price sensitivity per 1% yield change' },
  GDP:             { id: 'GDP',              label: 'GDP',                  unit: 'USD T',    dataType: 'number', chartable: true,  updateFreq: 'quarterly', provenance: 'SIM',  description: 'Gross Domestic Product' },
  INFLATION_RATE:  { id: 'INFLATION_RATE',   label: 'Inflation Rate',       unit: '%',        dataType: 'number', chartable: true,  updateFreq: 'monthly',   provenance: 'SIM',  description: 'Consumer price index YoY change' },
  POLICY_RATE:     { id: 'POLICY_RATE',      label: 'Policy Rate',          unit: '%',        dataType: 'number', chartable: true,  updateFreq: 'daily',     provenance: 'SIM',  description: 'Central bank overnight lending rate' },
  SHARES_HELD:     { id: 'SHARES_HELD',      label: 'Shares Held',          unit: 'M shares', dataType: 'number', chartable: false, updateFreq: 'quarterly', provenance: 'SIM',  description: 'Institutional position in shares' },
  SHARE_CHANGE:    { id: 'SHARE_CHANGE',     label: 'QoQ Position Change',  unit: 'M shares', dataType: 'number', chartable: false, updateFreq: 'quarterly', provenance: 'SIM',  description: 'Change in shares held vs prior quarter' },
};

export function getFieldDef(fieldId: string): FieldDef | undefined {
  return FIELD_CATALOG[fieldId];
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
