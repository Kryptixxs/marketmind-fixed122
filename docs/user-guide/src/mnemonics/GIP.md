# GIP — Intraday Chart

<span class="mnemonic-badge">GIP</span>
<span class="scope-badge">🔒 Security Scoped</span>
<span class="scope-badge">Chart</span>

## Purpose

Intraday minute/tick chart with open reference line and OHLC crosshair.

## Inputs

Security required.

## Screen Layout

1. **Intraday price line chart**
2. **Open price marker**

## Key Fields

| Field ID | Description |
|---|---|
| `PX_LAST` | SIM-sourced PX_LAST value |
| `PX_OPEN` | SIM-sourced PX_OPEN value |

## Drill Paths

- Click → GP (daily)
- Shift+Click → new pane with GP

## Keyboard Controls

- Hover → OHLC tooltip

## Opening Examples

```
SPX Index GIP GO
```

## Common Pitfalls

- ⚠️ Intraday data is SIM-generated and refreshes each session

## Related Functions

[GP](/mnemonics/GP)  ·  [HP](/mnemonics/HP)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
