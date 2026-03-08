# ALRT — Alerts Monitor

<span class="mnemonic-badge">ALRT</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">MonitorTable</span>

## Purpose

Live alert rules showing triggered vs inactive status. Drill into triggered alerts for evidence.

## Inputs

No security required.

## Screen Layout

1. **Alert rules table (symbol, condition, triggered, created)**

## Key Fields

| Field ID | Description |
|---|---|
| `SYMBOL` | SIM-sourced SYMBOL value |
| `CONDITION` | SIM-sourced CONDITION value |
| `TRIGGERED` | SIM-sourced TRIGGERED value |
| `CREATED` | SIM-sourced CREATED value |

## Drill Paths

- Click triggered alert → evidence trail

## Keyboard Controls

- ALRT+ GO → advanced alert creation with field conditions

## Opening Examples

```
ALRT GO
```

## Common Pitfalls

- ⚠️ Alerts evaluate against simulated streaming data. May trigger unexpectedly on SIM data.

## Related Functions

[ALRT+](/mnemonics/ALRT_)  ·  [MON](/mnemonics/MON)  ·  [MON+](/mnemonics/MON_)  ·  [NOTIF](/mnemonics/NOTIF)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
