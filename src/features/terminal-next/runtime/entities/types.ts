// ── Entity kinds ─────────────────────────────────────────────────────────────
export type EntityKind =
  | 'SECURITY'   // any tradeable instrument
  | 'INDEX'
  | 'FX'
  | 'RATE'
  | 'FUTURE'
  | 'OPTION'
  | 'ETF'
  | 'COMPANY'
  | 'SECTOR'
  | 'INDUSTRY'
  | 'COUNTRY'
  | 'PERSON'
  | 'HOLDER'
  | 'NEWS'
  | 'EVENT'
  | 'FIELD'
  | 'FUNCTION'
  | 'ORDER'
  | 'TRADE';

// ── Payloads per kind ─────────────────────────────────────────────────────────
export interface SecurityPayload {
  sym: string;         // "AAPL US Equity"
  ticker: string;      // "AAPL"
  market: string;      // "US"
  assetClass: string;  // "Equity"
  name?: string;
}
export interface IndexPayload    { sym: string; name?: string }
export interface FXPayload       { pair: string; name?: string }
export interface FuturePayload   { sym: string; name?: string }
export interface OptionPayload   { sym: string; name?: string }
export interface ETFPayload      { sym: string; name?: string }
export interface CompanyPayload  { sym: string; name?: string }
export interface SectorPayload   { name: string; gics?: string }
export interface IndustryPayload { name: string }
export interface CountryPayload  { iso2: string; name: string }
export interface PersonPayload   { name: string; title?: string; company?: string }
export interface HolderPayload   { name: string; pct?: number }
export interface NewsPayload     { headline: string; src?: string; ts?: string }
export interface EventPayload    { type: string; date: string; desc: string }
export interface FieldPayload    { fieldName: string; value?: unknown; desc?: string }
export interface FunctionPayload { code: string; title?: string }
export interface OrderPayload    { id: string; sym?: string }
export interface TradePayload    { id: string; sym?: string }

type KindToPayload = {
  SECURITY:  SecurityPayload;
  INDEX:     IndexPayload;
  FX:        FXPayload;
  RATE:      FieldPayload;
  FUTURE:    FuturePayload;
  OPTION:    OptionPayload;
  ETF:       ETFPayload;
  COMPANY:   CompanyPayload;
  SECTOR:    SectorPayload;
  INDUSTRY:  IndustryPayload;
  COUNTRY:   CountryPayload;
  PERSON:    PersonPayload;
  HOLDER:    HolderPayload;
  NEWS:      NewsPayload;
  EVENT:     EventPayload;
  FIELD:     FieldPayload;
  FUNCTION:  FunctionPayload;
  ORDER:     OrderPayload;
  TRADE:     TradePayload;
};

export interface EntityRef<K extends EntityKind = EntityKind> {
  kind: K;
  id: string;
  display: string;
  payload: KindToPayload[K];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function makeSecurity(sym: string, name?: string): EntityRef<'SECURITY'> {
  const parts = sym.split(' ');
  const ticker = parts[0] ?? sym;
  const market = parts[1] ?? '';
  const assetClass = parts[2] ?? 'Equity';
  return {
    kind: 'SECURITY',
    id: sym,
    display: sym,
    payload: { sym, ticker, market, assetClass, name },
  };
}
export function makeIndex(sym: string, name?: string): EntityRef<'INDEX'> {
  return { kind: 'INDEX', id: sym, display: sym, payload: { sym, name } };
}
export function makeSector(name: string, gics?: string): EntityRef<'SECTOR'> {
  return { kind: 'SECTOR', id: name, display: name, payload: { name, gics } };
}
export function makeCountry(iso2: string, name: string): EntityRef<'COUNTRY'> {
  return { kind: 'COUNTRY', id: iso2, display: name, payload: { iso2, name } };
}
export function makePerson(personName: string, title?: string, company?: string): EntityRef<'PERSON'> {
  return { kind: 'PERSON', id: personName, display: personName, payload: { name: personName, title, company } };
}
export function makeHolder(holderName: string, pct?: number): EntityRef<'HOLDER'> {
  return { kind: 'HOLDER', id: holderName, display: holderName, payload: { name: holderName, pct } };
}
export function makeNews(headline: string, src?: string, ts?: string): EntityRef<'NEWS'> {
  return { kind: 'NEWS', id: headline.slice(0, 40), display: headline, payload: { headline, src, ts } };
}
export function makeEvent(type: string, date: string, desc: string): EntityRef<'EVENT'> {
  return { kind: 'EVENT', id: `${type}-${date}`, display: desc, payload: { type, date, desc } };
}
export function makeField(fieldName: string, value?: unknown, desc?: string): EntityRef<'FIELD'> {
  return { kind: 'FIELD', id: fieldName, display: fieldName, payload: { fieldName, value, desc } };
}
export function makeFunction(code: string, title?: string): EntityRef<'FUNCTION'> {
  return { kind: 'FUNCTION', id: code, display: code, payload: { code, title } };
}
export function makeETF(sym: string, name?: string): EntityRef<'ETF'> {
  return { kind: 'ETF', id: sym, display: sym, payload: { sym, name } };
}
