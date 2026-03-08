# FXC — FX Cross Matrix

<span class="mnemonic-badge">FXC</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">MonitorTable</span>

## Purpose

N×N matrix of spot FX rates for all major pairs.

## Inputs

No security required.

## Screen Layout

1. **Cross-rate matrix table**

## Key Fields

| Field ID | Description |
|---|---|
| `FX_SPOT` | SIM-sourced FX_SPOT value |
| `PCT_CHG` | SIM-sourced PCT_CHG value |

## Drill Paths

- Click cell → DES of that FX pair
- Right-click → GP chart

## Keyboard Controls

- Click row/col header → sort

## Opening Examples

```
FXC GO
```

## Common Pitfalls

- ⚠️ Matrix shows SIM rates. Not live interbank rates.

## Related Functions

[DES](/mnemonics/DES)  ·  [GP](/mnemonics/GP)  ·  [ECO](/mnemonics/ECO)  ·  [CORR+](/mnemonics/CORR_)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
