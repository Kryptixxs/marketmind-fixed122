# Feature Inventory

Auto-generated from live code — current as of build time.

## Hand-Built Mnemonics (FUNCTION_MAP)

These mnemonics have dedicated, bespoke React implementations:

| Code | Title | Scoped | File |
|------|-------|--------|------|
| WEI | World Equity Indices | Global | FnWEI |
| DES | Security Description | Security | FnDES |
| HP | Historical Pricing | Security | FnHP |
| GP | Price Chart | Security | FnGP |
| GIP | Intraday Chart | Security | FnGP |
| FA | Financial Analysis | Security | FnFA |
| OWN | Ownership | Security | FnOWN |
| RELS | Related Securities | Security | FnRELS |
| CN | Company News | Security | FnTOP/FnCN |
| DVD | Dividend History | Security | FnDVD |
| MGMT | Management | Security | FnMGMT |
| EVT | Corporate Events | Security | FnEVT |
| TOP | Top News | Global | FnTOP |
| ECO | Economic Calendar | Global | FnECO |
| FXC | FX Cross Matrix | Global | FnFXC |
| IMAP | Sector Heatmap | Global | FnIMAP |
| GC | Yield Curve | Global | FnGC |
| RV | Relative Value | Security | FnRV |
| MKT | Market Context | Global | FnMKT |
| MON | Monitor / Watchlist | Global | FnMON |
| WS | Workspace Manager | Global | FnMON/FnWS |
| ALRT | Alerts Monitor | Global | FnALRT |
| BLTR | Blotter | Global | FnBLTR |
| ORD | Order Ticket | Security | FnORD |
| IB | Instant Bloomberg | Global | FnIB |
| ANR | Analytics Runtime | Global | AnalyticsMonitor |
| NOTES | Security Notes | Security | FnNOTES |
| AUD | Audit Log | Global | FnAUD |
| STAT | System Status | Global | FnSTAT |
| LAT | Latency Monitor | Global | FnLAT |
| CACH | Cache & Offline | Global | FnCACH |
| ERR | Error Console | Global | FnERR |
| ENT | Entitlements | Global | FnENT |
| COMP | Compliance | Global | FnCOMP |
| POL | Policy Rules | Global | FnPOL |
| LINE | Data Lineage | Global | FnLINE |
| FLD | Field Catalog | Global | FnFLD |
| MAP | Field Mapping | Global | FnMAP |
| QLT | Data Quality | Global | FnQLT |
| COLS | Column Sets | Global | FnCOLS |
| PIN | Pinboard | Global | FnPIN |
| NAV | Navigation Graph | Global | FnNAV |
| NX | Next Best Actions | Global | FnNX |
| GEO | Global Map | Global | FnGeoMapIntel |
| RELG | Relationship Graph | Security | FnRelationshipIntel |
| RELT | Relationship Table | Security | FnRelationshipIntel |
| RGN | Region Dossier | Global | FnRegionNewsIntel |
| SCN | Supply Chain Network | Security | FnSupplyDriverIntel |
| NAVTREE | Function Navigator | Global | FnPlatformOS |
| DOCK | Docking Engine | Global | FnPlatformOS |
| PREF | Preferences | Global | FnPlatformOS |
| TUTOR | Tutorial | Global | FnPlatformOS |
| KEYMAP | Keymap Editor | Global | FnPlatformOS |
| ALRT+ | Advanced Alerts | Global | FnPlatformOS |
| MON+ | Monitor Builder | Global | FnPlatformOS |
| ADMIN | Admin Console | Global | FnPlatformOS |
| STATUS | System Status | Global | FnPlatformOS |
| DIAG | Diagnostics | Global | FnPlatformOS |
| OFFLINE | Offline Mode | Global | FnPlatformOS |

## Catalog-Generated Mnemonics (FunctionFactory)

All remaining codes route to **FnFactoryMnemonic** which renders based on catalog recipe:

| Category | Count | Recipe |
|----------|-------|--------|
| EQUITY | 520 | ReferenceSheet |
| FX | 240 | MonitorTable / VolBoard |
| RATES | 240 | CurveBoard |
| CREDIT | 240 | AnalyticsBoard |
| DERIVS | 540 | VolBoard |
| MACRO | 220 | AnalyticsBoard |
| PORTFOLIO | 240 | PortfolioBoard |
| NEWS_DOCS | 220 | NewsHub |
| OPS_ADMIN | 180 | OpsConsole |
| **Total** | **2,949** | |

## Entity Types (22)

SECURITY · INDEX · FX · RATE · FUTURE · OPTION · ETF · COMPANY · SECTOR · INDUSTRY · COUNTRY · PERSON · HOLDER · NEWS · EVENT · FIELD · FUNCTION · MONITOR · WORKSPACE · ALERT · ORDER · TRADE

## Recipe Types (10)

MonitorTable · ReferenceSheet · AnalyticsBoard · Screener · CurveBoard · VolBoard · NewsHub · RelationshipBoard · OpsConsole · PortfolioBoard

## MnemonicCategory Types (9)

EQUITY · FX · RATES · CREDIT · DERIVS · MACRO · PORTFOLIO · NEWS_DOCS · OPS_ADMIN

## Function Scope Types (5)

SECURITY_SCOPED · UNIVERSE_SCOPED · REGION_SCOPED · CROSS_ASSET · PORTFOLIO_SCOPED
