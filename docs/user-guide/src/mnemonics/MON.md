# MON — Monitor / Watchlist

<span class="mnemonic-badge">MON</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">MonitorTable</span>

## Purpose

Streaming watchlist with custom columns from the Field Catalog. Supports multiple lists, sorting, filtering.

## Inputs

No security required (universe-scoped).

## Screen Layout

1. **Symbol ticker column**
2. **Custom field columns (add via FLD)**
3. **Sort/filter bar**
4. **List selector tabs**

## Key Fields

| Field ID | Description |
|---|---|
| `PX_LAST` | SIM-sourced PX_LAST value |
| `PCT_CHG` | SIM-sourced PCT_CHG value |
| `VOLUME` | SIM-sourced VOLUME value |
| `(user-defined columns)` | SIM-sourced (user-defined columns) value |

## Drill Paths

- Click row → DES
- Click numeric cell → LINE lineage

## Keyboard Controls

- Tab → switch watchlist
- Alt+Click any cell → Inspector

## Opening Examples

```
MON GO
```

## Common Pitfalls

- ⚠️ Custom columns persist to localStorage. Clear browser data to reset.
- ⚠️ Symbol input requires full Bloomberg-style format: AAPL US Equity

## Related Functions

[MON+](/mnemonics/MON_)  ·  [FLD](/mnemonics/FLD)  ·  [ALRT+](/mnemonics/ALRT_)  ·  [ALRT](/mnemonics/ALRT)  ·  [WS](/mnemonics/WS)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
