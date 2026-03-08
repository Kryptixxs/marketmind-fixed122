# Drill Intents & Entity Model

## What Is an Entity?

Every visible data point in the terminal is an **EntityRef** — a typed, drillable object.

### EntityKind Types

| Kind | Examples | Opens in |
|------|----------|---------|
| `SECURITY` | AAPL US Equity | DES, HP, GP, FA |
| `INDEX` | SPX Index | DES, WEI, GP |
| `FX` | EURUSD Curncy | DES, GP, FXC |
| `RATE` | US10YT | GC, LINE |
| `FUTURE` | CL1 Comdty | DES, GP |
| `OPTION` | AAPL option | CHAIN, SURF |
| `ETF` | QQQ US Equity | DES, ETFM |
| `COMPANY` | Apple Inc | CMPY, RELG |
| `SECTOR` | Technology | SECT, IMAP |
| `INDUSTRY` | Semiconductors | INDY, SCN |
| `COUNTRY` | US, JP, DE | CTY, GEO |
| `PERSON` | CEO name | MGMT |
| `HOLDER` | Institutional holder | OWN |
| `NEWS` | Headline | NTIM, NREL |
| `EVENT` | Earnings, dividend | EVT |
| `FIELD` | PX_LAST, PE_RATIO | LINE, FLD |
| `FUNCTION` | DES, WEI, GP | Navigates to that function |
| `MONITOR` | Custom watchlist | MON |
| `WORKSPACE` | Saved workspace | WS |
| `ALERT` | Alert rule | ALRT |
| `ORDER` | Submitted order | BLTR |
| `TRADE` | Executed trade | BLTR |

## Drill Intents

| Intent | Trigger | Behavior |
|--------|---------|----------|
| `OPEN_IN_PLACE` | Click | Open entity in current pane, replacing current view |
| `OPEN_IN_NEW_PANE` | Shift+Click or Shift+Enter | Open entity in next available pane or create new one |
| `INSPECT_OVERLAY` | Alt+Click or Alt+Enter | Open Inspector overlay without navigating away |
| Context menu | Right-click | Show all available actions for entity |

## The Inspector Overlay

Opening the Inspector (Alt+Click) shows:
- **Header**: entity display name, kind, provenance (SIM/LIVE/STALE), last updated
- **Key fields**: dense key-value grid (each field is itself a FIELD entity, clickable → LINE)
- **Related entities**: list of associated entities (clickable → drill further)
- **Related functions**: relevant mnemonics for this entity type
- **Evidence**: source confidence chain

**Inspector history**: Use back/forward arrows within Inspector to navigate the inspect chain.  
**Pin**: Keep Inspector open while clicking elsewhere in the panel.

## Provenance Badges

| Badge | Meaning |
|-------|---------|
| `SIM` | Simulated data — realistic but not live market data |
| `LIVE` | Live-streamed value (when live mode enabled) |
| `STALE` | Value has exceeded its expected refresh cadence |
| `CALC` | Derived/calculated from other fields |
