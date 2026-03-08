# GEO — Global Intelligence Map

<span class="mnemonic-badge">GEO</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">RelationshipBoard</span>

## Purpose

Primary world map with clickable country tiles. Drill into news heat, company footprints, macro signals, and supply chain disruptions.

## Inputs

No security required.

## Screen Layout

1. **Interactive world map (MapLibre GL)**
2. **Country detail panel**
3. **Region news strip**
4. **Active alerts overlay**

## Key Fields

| Field ID | Description |
|---|---|
| `NEWS_INTENSITY` | SIM-sourced NEWS_INTENSITY value |
| `MACRO_SIGNAL` | SIM-sourced MACRO_SIGNAL value |
| `RISK_SCORE` | SIM-sourced RISK_SCORE value |

## Drill Paths

- Click country → RGN dossier
- Shift+Click → new pane
- Right-click → GEO sub-functions

## Keyboard Controls

- Click → drill region
- Shift+Click → send to pane
- Use GEO.N/C/R/M/X/S/E/F/A variants for specific overlays

## Opening Examples

```
GEO GO
```

## Common Pitfalls

- ⚠️ Requires MapLibre tile loading. Slow on first load.
- ⚠️ GEO sub-functions (GEO.N etc.) work as separate mnemonics.

## Related Functions

[GEO.N](/mnemonics/GEO_N)  ·  [GEO.C](/mnemonics/GEO_C)  ·  [GEO.R](/mnemonics/GEO_R)  ·  [GEO.M](/mnemonics/GEO_M)  ·  [RGN](/mnemonics/RGN)  ·  [NMAP](/mnemonics/NMAP)  ·  [SCN](/mnemonics/SCN)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
