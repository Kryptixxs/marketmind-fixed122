# AUD — Command Audit Log

<span class="mnemonic-badge">AUD</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">OpsConsole</span>

## Purpose

Chronological log of all user actions: GO commands, drills, alerts, exports, policy blocks.

## Inputs

No security required.

## Screen Layout

1. **Audit log table (timestamp, panel, type, mnemonic, security, detail)**
2. **Filter by type**

## Key Fields

| Field ID | Description |
|---|---|
| `TS` | SIM-sourced TS value |
| `PANEL_IDX` | SIM-sourced PANEL_IDX value |
| `TYPE` | SIM-sourced TYPE value |
| `MNEMONIC` | SIM-sourced MNEMONIC value |
| `SECURITY` | SIM-sourced SECURITY value |
| `DETAIL` | SIM-sourced DETAIL value |
| `ACTOR` | SIM-sourced ACTOR value |

## Drill Paths

- Click row → replay that navigation in panel

## Keyboard Controls

- Filter by type: GO, DRILL, ALERT_CREATE, EXPORT, POLICY_BLOCK, NAV_JUMP

## Opening Examples

```
AUD GO
```

## Common Pitfalls

- ⚠️ Log persists in localStorage. Export before clearing browser data.

## Related Functions

[AUDIT](/mnemonics/AUDIT)  ·  [TRAIL](/mnemonics/TRAIL)  ·  [NAV](/mnemonics/NAV)  ·  [NAVG](/mnemonics/NAVG)  ·  [COMP](/mnemonics/COMP)  ·  [POL](/mnemonics/POL)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
