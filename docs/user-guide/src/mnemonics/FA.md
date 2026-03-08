# FA — Financial Analysis

<span class="mnemonic-badge">FA</span>
<span class="scope-badge">🔒 Security Scoped</span>
<span class="scope-badge">AnalyticsBoard</span>

## Purpose

Three-tab financial statement viewer: Income Statement, Balance Sheet, Cash Flow.

## Inputs

Security (equity or corp) required.

## Screen Layout

1. **Tab selector (IS / BS / CF)**
2. **Line-item table with multi-period columns**

## Key Fields

| Field ID | Description |
|---|---|
| `REVENUE` | SIM-sourced REVENUE value |
| `EBITDA` | SIM-sourced EBITDA value |
| `NET_INCOME` | SIM-sourced NET_INCOME value |
| `TOTAL_ASSETS` | SIM-sourced TOTAL_ASSETS value |
| `TOTAL_DEBT` | SIM-sourced TOTAL_DEBT value |
| `FCF` | SIM-sourced FCF value |

## Drill Paths

- Click line item → LINE for field lineage

## Keyboard Controls

- Click IS/BS/CF tab → switch statement
- ↑↓ navigate rows
- Enter → drill field

## Opening Examples

```
NVDA US FA GO
```

## Common Pitfalls

- ⚠️ Figures are SIM unless marked LIVE. All periods are approximated.

## Related Functions

[DES](/mnemonics/DES)  ·  [HP](/mnemonics/HP)  ·  [DVD](/mnemonics/DVD)  ·  [NOTES](/mnemonics/NOTES)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
