# LINE — Data Lineage Viewer

<span class="mnemonic-badge">LINE</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">OpsConsole</span>

## Purpose

Visual lineage trace for any field value: source → normalization → display. Shows SIM/LIVE provenance and freshness.

## Inputs

No security required. Activated by clicking numeric field values or via LINE &lt;field_id&gt; GO.

## Screen Layout

1. **Lineage flow table (source, transforms, output)**
2. **Freshness badge**
3. **Provenance timeline**

## Key Fields

| Field ID | Description |
|---|---|
| `FIELD_ID` | SIM-sourced FIELD_ID value |
| `SOURCE` | SIM-sourced SOURCE value |
| `TRANSFORMS` | SIM-sourced TRANSFORMS value |
| `FRESHNESS` | SIM-sourced FRESHNESS value |
| `AS_OF` | SIM-sourced AS_OF value |

## Drill Paths

- Click source row → SRC data source manager

## Keyboard Controls

- Click any numeric value in DES/WEI/HP → opens this panel automatically

## Opening Examples

```
LINE GO  |  LINE PX_LAST GO
```

## Common Pitfalls

- ⚠️ Lineage is simulated. Transform steps are representative, not from live systems.

## Related Functions

[FLD](/mnemonics/FLD)  ·  [MAP](/mnemonics/MAP)  ·  [QLT](/mnemonics/QLT)  ·  [SRC](/mnemonics/SRC)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
