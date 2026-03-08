# STAT — System Status

<span class="mnemonic-badge">STAT</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">OpsConsole</span>

## Purpose

Feed health, streaming subsystem status, and system metrics dashboard.

## Inputs

No security required.

## Screen Layout

1. **Subsystem status table (Quotes, News, Alerts, Audit)**
2. **Feed tick rate metrics**

## Key Fields

| Field ID | Description |
|---|---|
| `SUBSYSTEM` | SIM-sourced SUBSYSTEM value |
| `HEALTH` | SIM-sourced HEALTH value |
| `VALUE` | SIM-sourced VALUE value |
| `DRILL_CODE` | SIM-sourced DRILL_CODE value |

## Drill Paths

- Click subsystem row → drill to that function (STAT → ALRT+, NEWS → TOP)

## Keyboard Controls

- Click row → navigate to subsystem function

## Opening Examples

```
STAT GO  |  STATUS GO
```

## Common Pitfalls

- ⚠️ Metrics are derived from simulated streaming. FPS/TPS depend on browser performance.

## Related Functions

[LAT](/mnemonics/LAT)  ·  [ERR](/mnemonics/ERR)  ·  [CACH](/mnemonics/CACH)  ·  [DIAG](/mnemonics/DIAG)  ·  [OFFLINE](/mnemonics/OFFLINE)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
