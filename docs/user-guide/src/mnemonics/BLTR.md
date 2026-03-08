# BLTR — Order Blotter

<span class="mnemonic-badge">BLTR</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">MonitorTable</span>

## Purpose

Real-time streaming blotter of all submitted orders with status, fill info, and drill actions.

## Inputs

No security required.

## Screen Layout

1. **Order stream table (symbol, side, type, qty, px, status, time)**

## Key Fields

| Field ID | Description |
|---|---|
| `SYMBOL` | SIM-sourced SYMBOL value |
| `SIDE` | SIM-sourced SIDE value |
| `QTY` | SIM-sourced QTY value |
| `FILL_PX` | SIM-sourced FILL_PX value |
| `STATUS` | SIM-sourced STATUS value |
| `TIMESTAMP` | SIM-sourced TIMESTAMP value |

## Drill Paths

- Click order row → TCA analysis
- Click symbol → DES

## Keyboard Controls

- KILL GO → activate kill switch
- ALRT GO → set price alert on selected

## Opening Examples

```
BLTR GO
```

## Common Pitfalls

- ⚠️ Blotter data is session-only (not persisted across reload). Export with EXP before closing.

## Related Functions

[ORD](/mnemonics/ORD)  ·  [TCA](/mnemonics/TCA)  ·  [VEN](/mnemonics/VEN)  ·  [KILL](/mnemonics/KILL)  ·  [ANR](/mnemonics/ANR)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
