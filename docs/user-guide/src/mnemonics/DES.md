# DES — Security Description

<span class="mnemonic-badge">DES</span>
<span class="scope-badge">🔒 Security Scoped</span>
<span class="scope-badge">ReferenceSheet</span>

## Purpose

Comprehensive reference sheet for any security: fundamentals, trading stats, business summary, peers, ownership, events.

## Inputs

Requires a security (ticker + market). E.g. AAPL US Equity.

## Screen Layout

1. **Key fundamentals (P/E, EPS, Div Yield, Market Cap, Beta)**
2. **Trading statistics (VWAP, 52W H/L, volume)**
3. **Business summary text**
4. **Peer quick table**
5. **Ownership & events strip**

## Key Fields

| Field ID | Description |
|---|---|
| `PX_LAST` | SIM-sourced PX_LAST value |
| `PE_RATIO` | SIM-sourced PE_RATIO value |
| `EPS` | SIM-sourced EPS value |
| `DIV_YLD` | SIM-sourced DIV_YLD value |
| `MKT_CAP` | SIM-sourced MKT_CAP value |
| `BETA` | SIM-sourced BETA value |
| `VWAP` | SIM-sourced VWAP value |
| `52W_HIGH` | SIM-sourced 52W_HIGH value |
| `52W_LOW` | SIM-sourced 52W_LOW value |

## Drill Paths

- P/E field → LINE (lineage)
- Peer row → DES of peer
- Ownership row → OWN
- Events row → EVT

## Keyboard Controls

- F2 → MENU for related functions
- Alt+Enter on any value → Inspector with field history

## Opening Examples

```
AAPL US DES GO
```

## Common Pitfalls

- ⚠️ Must include market suffix: AAPL US not just AAPL
- ⚠️ Business summary is SIM; real filings require TRNS/FIL

## Related Functions

[HP](/mnemonics/HP)  ·  [FA](/mnemonics/FA)  ·  [OWN](/mnemonics/OWN)  ·  [CN](/mnemonics/CN)  ·  [EVT](/mnemonics/EVT)  ·  [RELS](/mnemonics/RELS)  ·  [MGMT](/mnemonics/MGMT)  ·  [DVD](/mnemonics/DVD)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
