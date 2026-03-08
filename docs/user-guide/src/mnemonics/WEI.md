# WEI — World Equity Indices

<span class="mnemonic-badge">WEI</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">MonitorTable</span>

## Purpose

Real-time overview of all global equity indices. Shows level, change, %change, YTD, and region tags.

## Inputs

No security required. Loads with global default universe.

## Screen Layout

1. **Index table (full universe)**
2. **Top movers (gainers/losers)**
3. **Sector dispersion mini-table**
4. **Correlation mini-table**
5. **Alerts/notes strip**

## Key Fields

| Field ID | Description |
|---|---|
| `PX_LAST` | SIM-sourced PX_LAST value |
| `PX_CHG` | SIM-sourced PX_CHG value |
| `PCT_CHG` | SIM-sourced PCT_CHG value |
| `YTD_PCT` | SIM-sourced YTD_PCT value |
| `REGION` | SIM-sourced REGION value |

## Drill Paths

- Click index row → DES
- Shift+Click → new pane
- Alt+Click → Inspector
- Column header → sort

## Keyboard Controls

- ↑↓ select row
- Enter → DES of selected
- Shift+Enter → send to pane

## Opening Examples

```
WEI GO
```

## Common Pitfalls

- ⚠️ All data is SIM-sourced; freshness badges show STALE after session age
- ⚠️ Use IMAP for sector breakdown instead of column scrolling

## Related Functions

[IMAP](/mnemonics/IMAP)  ·  [TOP](/mnemonics/TOP)  ·  [ECO](/mnemonics/ECO)  ·  [FXC](/mnemonics/FXC)  ·  [RFCM](/mnemonics/RFCM)  ·  [GMOV](/mnemonics/GMOV)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
