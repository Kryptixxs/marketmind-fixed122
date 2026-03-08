# HP — Historical Pricing

<span class="mnemonic-badge">HP</span>
<span class="scope-badge">🔒 Security Scoped</span>
<span class="scope-badge">AnalyticsBoard</span>

## Purpose

Day-by-day OHLCV table with change columns and sorting. Supports multiple timeframes.

## Inputs

Security required. Timeframe can be set: 1M, 3M, 1Y, 5Y.

## Screen Layout

1. **OHLCV table (sortable, virtualised for large ranges)**
2. **Return distribution mini-chart**

## Key Fields

| Field ID | Description |
|---|---|
| `PX_OPEN` | SIM-sourced PX_OPEN value |
| `PX_HIGH` | SIM-sourced PX_HIGH value |
| `PX_LOW` | SIM-sourced PX_LOW value |
| `PX_LAST` | SIM-sourced PX_LAST value |
| `PX_CHG` | SIM-sourced PX_CHG value |
| `PCT_CHG` | SIM-sourced PCT_CHG value |
| `VOLUME` | SIM-sourced VOLUME value |

## Drill Paths

- Click date row → GP chart at that date
- Click column header → sort
- PCT_CHG value → LINE

## Keyboard Controls

- PageDown → next page of rows
- Click col header → toggle sort
- Enter → drill selected security

## Opening Examples

```
MSFT US HP GO  |  MSFT US HP 1Y GO
```

## Common Pitfalls

- ⚠️ Data is simulated; gaps may exist at session boundary
- ⚠️ 1M is default — add 1Y or 5Y to command for longer history

## Related Functions

[GP](/mnemonics/GP)  ·  [GIP](/mnemonics/GIP)  ·  [DES](/mnemonics/DES)  ·  [DVD](/mnemonics/DVD)  ·  [HIST+](/mnemonics/HIST_)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
