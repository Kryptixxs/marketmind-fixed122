# WS — Workspace Manager

<span class="mnemonic-badge">WS</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">OpsConsole</span>

## Purpose

Save and restore complete workspace states including pane layouts, panel content, command histories, and pin strip.

## Inputs

No security required.

## Screen Layout

1. **Saved workspaces list**
2. **Load/Save/Delete controls**
3. **Panel state preview**

## Key Fields

_No specific fields — navigational/administrative function._

## Drill Paths

- Click workspace row → LOAD prompt

## Keyboard Controls

- WS &lt;name&gt; GO → save/load by name
- WS DEL &lt;name&gt; GO → delete

## Opening Examples

```
WS GO  |  WS myworkspace GO  |  WS DEL myworkspace GO
```

## Common Pitfalls

- ⚠️ Workspaces saved to localStorage. Clearing browser data deletes them.
- ⚠️ WS:MARKET-WALL, WS:NEWSROOM, WS:RESEARCH, WS:TRADING → preset workspaces

## Related Functions

[DOCK](/mnemonics/DOCK)  ·  [FLOAT](/mnemonics/FLOAT)  ·  [LAYOUT](/mnemonics/LAYOUT)  ·  [SNAP](/mnemonics/SNAP)  ·  [TRAIL](/mnemonics/TRAIL)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
