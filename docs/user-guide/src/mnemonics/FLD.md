# FLD — Field Catalog

<span class="mnemonic-badge">FLD</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">OpsConsole</span>

## Purpose

Searchable catalog of all available data fields with definitions, units, cadence, and asset class availability.

## Inputs

No security required.

## Screen Layout

1. **Field search table**
2. **Add to Monitor/Screener buttons**
3. **Chart and lineage drill actions**

## Key Fields

| Field ID | Description |
|---|---|
| `FIELD_ID` | SIM-sourced FIELD_ID value |
| `LABEL` | SIM-sourced LABEL value |
| `DEFINITION` | SIM-sourced DEFINITION value |
| `UNIT` | SIM-sourced UNIT value |
| `TYPE` | SIM-sourced TYPE value |
| `CADENCE` | SIM-sourced CADENCE value |
| `AVAILABILITY` | SIM-sourced AVAILABILITY value |

## Drill Paths

- Click field row → LINE lineage viewer
- Add→MON → add field as monitor column

## Keyboard Controls

- Type to search across all field metadata
- Click Add→MON → appends column to active monitor

## Opening Examples

```
FLD GO  |  FLD PE_RATIO GO
```

## Common Pitfalls

- ⚠️ Field IDs must match exactly for monitor columns. Use FLD search to find correct IDs.

## Related Functions

[LINE](/mnemonics/LINE)  ·  [MAP](/mnemonics/MAP)  ·  [QLT](/mnemonics/QLT)  ·  [MON+](/mnemonics/MON_)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
